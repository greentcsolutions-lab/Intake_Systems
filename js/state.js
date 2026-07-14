// js/state.js
// Version 1.5.0 — 2026-07-14


// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
const state = {
  selectedLOBs: [],
  steps: [], // ordered list of step keys
  currentStepIndex: 0,
  vehicleCount: 0,
  driverCount: 0,
  homeLossCount: 0,
};

const LOB_META = {};

// ══════════════════════════════════════════
// GATE PANEL (shared conditional-reveal utility)
// ══════════════════════════════════════════
// Drives the .gate-panel grid-template-rows 0fr→1fr collapse animation used
// throughout Applicant and Auto for in-place conditional reveals (commute
// details, lienholder block, glass coverage, SR-22 reason, reason-other,
// second-named-insured). Defined here (state.js loads first of all app
// scripts) since it's called from auto.js, collect.js, and inline handlers
// in index.html — a shared layout utility, not owned by any one LOB.
//
// `hidden` (display:none !important) is used only for a panel's true
// initial/never-shown state, matching the static markup in index.html and
// the dynamically-generated blocks in auto.js. The first call — regardless
// of show value — permanently switches the panel over to the animated
// grid-template-rows model, so every subsequent toggle (open OR close)
// animates rather than snapping.
function toggleGatePanel(el, show) {
  if (!el) return;
  el.classList.remove('hidden');
  el.classList.toggle('expanded', !!show);
}

// ══════════════════════════════════════════
// MICRO-STEP ENGINE (No-Scroll Refactor — Stage 0)
// ══════════════════════════════════════════
// Step keys are either bare macro keys ("auto-vehicles") — unrefactored,
// rendered as a single screen exactly like today — or "macroKey:microKey"
// ("applicant:A1") — refactored, rendered as one .micro-screen at a time
// within that macro's panel. macroOf() is the single place that resolves
// a step key down to its macro identity; every other function that needs
// macro identity should call this rather than re-deriving it.
function macroOf(key) {
  return key && key.includes(':') ? key.split(':')[0] : key;
}

function microOf(key) {
  return key && key.includes(':') ? key.split(':')[1] : null;
}

// ── Sub-progress ("Applicant — Step 3 of 6") ──
// Only meaningful within a contiguous run of steps sharing the same macro
// key. Mirrors the grouping logic in buildStepNav()'s pill-collapsing loop.
function updateSubProgress() {
  const el = document.getElementById('subProgressLabel');
  if (!el) return;

  const idx = state.currentStepIndex;
  const macro = macroOf(state.steps[idx]);

  // Only show sub-progress for refactored (micro-stepped) macros
  if (!state.steps[idx].includes(':')) {
    el.textContent = '';
    el.classList.add('hidden');
    return;
  }

  let start = idx;
  while (start > 0 && macroOf(state.steps[start - 1]) === macro) start--;
  let end = idx;
  while (end < state.steps.length - 1 && macroOf(state.steps[end + 1]) === macro) end++;

  const position = idx - start + 1;
  const total = end - start + 1;
  const macroLabel = getStepLabel(macro);

  el.textContent = `${macroLabel} — Step ${position} of ${total}`;
  el.classList.remove('hidden');
}

// ── Yes/No gate + loop splice (reusable across household members,
// vehicles, home losses, medications in later stages) ──
// itemStepKeys: the micro-step keys for ONE loop iteration, e.g.
// ['applicant:A6a', 'applicant:A6b']. Inserted immediately after gateStepKey
// every time the gate advances with an affirmative answer.
function startLoop(gateStepKey, itemStepKeys) {
  const gateIdx = state.steps.indexOf(gateStepKey);
  if (gateIdx === -1) return;
  const alreadyPresent = itemStepKeys.every((k, i) => state.steps[gateIdx + 1 + i] === k);
  if (alreadyPresent) return;
  state.steps.splice(gateIdx + 1, 0, ...itemStepKeys);
}

function addLoopIteration(gateStepKey, itemStepKeys) {
  const gateIdx = state.steps.indexOf(gateStepKey);
  if (gateIdx === -1) return;
  // Insert right after the gate so newest iteration is next, ahead of
  // any prior iterations already spliced in — gate always re-fires after.
  state.steps.splice(gateIdx + 1, 0, ...itemStepKeys);
}

function exitLoop(gateStepKey) {
  // Minimal stub for Stage 0. Removing the gate itself and deciding what
  // comes next is macro-specific (mirrors resolveHomeSteps()/
  // resolveLifeSteps()) — Stage 1+ will supply that logic per loop rather
  // than a generic implementation here, since "loop is done" behavior
  // differs per macro-step.
  const gateIdx = state.steps.indexOf(gateStepKey);
  if (gateIdx === -1) return;
  state.steps.splice(gateIdx, 1);
}

// ── Remove a single loop iteration's steps (Stage 1 — household member
// removal; reusable by vehicles/home losses/meds in later stages). Unlike
// startLoop()/addLoopIteration(), this doesn't assume position — it just
// strips the given keys out of state.steps wherever they are. ──
function removeLoopIteration(itemStepKeys) {
  state.steps = state.steps.filter(s => !itemStepKeys.includes(s));
}

// ── Skip-branch splice (existing-client skip, renters skip, etc.) ──
// skippableStepKeys: micro-steps to remove/re-insert as a contiguous block
// immediately after anchorKey, based on a boolean condition.
function applySkipBranch(anchorKey, skippableStepKeys, shouldSkip) {
  const anchorIdx = state.steps.indexOf(anchorKey);
  if (anchorIdx === -1) return;

  // Remove any of skippableStepKeys currently present, wherever they are
  state.steps = state.steps.filter(s => !skippableStepKeys.includes(s));

  if (!shouldSkip) {
    state.steps.splice(anchorIdx + 1, 0, ...skippableStepKeys);
  }
}

// ── Auto-advance handler for Yes/No gate screens ──
// Attach via onchange on gate-style selects/chips instead of requiring
// an explicit Continue tap. Reuses whatever control pattern is already in
// place (select or check-chip) — no new gate UI is introduced.
function autoAdvanceGate(id) {
  const el = document.getElementById(id);
  if (!el || !el.value) return;
  if (validateStep()) nextStep();
}

// ══════════════════════════════════════════
// DYNAMIC APPLICANT STEP RESOLUTION (No-Scroll Refactor — Stage 1)
// Called once at intake start. Builds the initial applicant:A1...A8-{lob}
// sequence — A2-A5 present unless Existing Client is already checked at
// that moment (it won't be, on a fresh intake; handleExistingClient()
// applies the same skip live via applySkipBranch() once the person
// toggles it on screen A1). Household loop iterations (A6a-n/A6b-n) are
// added later by addHouseholdMember() and are NOT part of this initial
// build — this only runs before any members exist.
// ══════════════════════════════════════════
function resolveApplicantSteps() {
  const isExisting = document.getElementById('app-existing-client')?.checked || false;
  const seq = ['applicant:A1'];
  if (!isExisting) seq.push('applicant:A2', 'applicant:A3', 'applicant:A4', 'applicant:A5');
  seq.push('applicant:A6', 'applicant:A7');
  state.selectedLOBs.forEach(lob => seq.push(`applicant:A8-${lob}`));

  state.steps = state.steps.filter(s => macroOf(s) !== 'applicant');
  state.steps.unshift(...seq);
}

// ── Applicant Back/Continue dispatchers ──
// A single global btn-row serves every applicant micro-screen (matches the
// no-scroll design — one field/group visible at a time, nav pinned below).
// Most screens use plain validate-then-advance; the household gate and the
// last screen of each loop iteration need to jump to a specific step
// instead of the next array index, so those are special-cased here rather
// than baked into nextStep()/prevStep() themselves.
function applicantContinue() {
  const key = state.steps[state.currentStepIndex];
  if (key === 'applicant:A6') {
    handleHouseholdGate();
    return;
  }
  if (key && key.startsWith('applicant:A6b-')) {
    finishHouseholdLoopIteration();
    return;
  }
  if (validateStep()) nextStep();
}

function applicantBack() {
  if (state.currentStepIndex === 0) {
    goToLOB();
    return;
  }
  prevStep();
}

// ══════════════════════════════════════════
// LOB SELECTION
// ══════════════════════════════════════════
document.querySelectorAll('.lob-card').forEach(card => {
  card.addEventListener('click', function() {
    const cb = this.querySelector('input[type="checkbox"]');
    cb.checked = !cb.checked;
    this.classList.toggle('selected', cb.checked);
  });
});

function getSelectedLOBs() {
  return [...document.querySelectorAll('.lob-card input:checked')].map(i => i.value);
}

function startIntake() {
  const lobs = getSelectedLOBs();
  if (!lobs.length) { alert('Please select at least one line of business.'); return; }
  state.selectedLOBs = lobs;

  // Build step order — non-applicant macro steps first, then prepend the
  // resolved applicant micro-step sequence (which needs selectedLOBs set,
  // for its A8-{lob} carrier screens).
  const steps = [];
  lobs.forEach(lob => {
    if (lob === 'auto') {
      steps.push('auto-vehicles', 'auto-coverage');
    } else if (lob === 'home') {
      steps.push('home-type', 'home-details', 'home-coverage');
    } else if (lob === 'life') {
      steps.push('life-product'); // medicare + meds steps added dynamically on Continue
    } else {
      steps.push(lob);
    }
  });
  steps.push('review');
  state.steps = steps;
  resolveApplicantSteps();
  state.currentStepIndex = 0;

  // Reset repeater containers and counts before init
  ['vehicles-container', 'vehicles-cov-container', 'hh-loop-container',
   'medications-container', 'siding-materials-container', 'wall-materials-container',
   'floor-materials-container'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  const hhSummaryEl = document.getElementById('hh-members-summary');
  if (hhSummaryEl) hhSummaryEl.innerHTML = '';
  state.vehicleCount = 0;
  state.driverCount = 0;
  window.medCount = 0;
  window.materialCounts = { siding: 1, wall: 1, floor: 1 };

  // Render per-LOB carrier blocks on the applicant page
  renderCarrierBlocks(lobs);

  // Init with single vehicle
  addVehicle();

  document.getElementById('step-lob').classList.add('hidden');
  buildStepNav();
  renderStep();
}

// ══════════════════════════════════════════
// CARRIER BLOCKS (per LOB, on Applicant step)
// ══════════════════════════════════════════
const CARRIER_LOB_LABELS = {
  auto: 'Auto',
  home: 'Home',
  life: 'Life/Health',
};

function renderCarrierBlocks(lobs) {
  const container = document.getElementById('carrier-blocks-container');
  if (!container) return;
  container.innerHTML = '';

  lobs.forEach(lob => {
    const label = CARRIER_LOB_LABELS[lob] || lob;
    const id = `carrier-${lob}`;
    const screen = document.createElement('div');
    screen.className = 'micro-screen hidden';
    screen.dataset.microStep = `applicant:A8-${lob}`;
    screen.innerHTML = `
      <div class="section-divider"><span>Current Coverage — ${label}</span></div>
      <div class="repeater-item" id="${id}" style="margin-bottom:14px">
        <div class="field-grid">
          <div class="field">
            <label>Currently Insured?</label>
            <select id="${lob}-currently-insured" onchange="handleCarrierInsured('${lob}')">
              <option value="">-- Select --</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div class="field" id="${lob}-carrier-name-field" style="display:none">
            <label>Carrier Name</label>
            <input type="text" id="${lob}-carrier-name" placeholder="State Farm, Progressive, etc.">
          </div>
          <div class="field" id="${lob}-carrier-policy-field" style="display:none">
            <label>Policy Number <span class="flag">⚡ if known</span></label>
            <input type="text" id="${lob}-carrier-policy" placeholder="Optional">
          </div>
          <div class="field" id="${lob}-carrier-expiry-field" style="display:none">
            <label>Expiration Date</label>
            <input type="date" id="${lob}-carrier-expiry">
          </div>
          <div class="field" id="${lob}-carrier-premium-field" style="display:none">
            <label>Current Premium</label>
            <input type="text" id="${lob}-carrier-premium" placeholder="$1,200/yr">
          </div>
          <div class="field" id="${lob}-carrier-lapse-field" style="display:none">
            <label>Reason for Lapse</label>
            <select id="${lob}-carrier-lapse" onchange="handleCarrierLapse('${lob}')">
              <option value="">-- Select --</option>
              <option>Non-payment</option>
              <option>Cancelled by carrier</option>
              <option>Never had insurance</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div id="${lob}-carrier-lapse-alert" class="alert alert-warn hidden" style="margin-top:10px">
          <div class="alert-icon">⚠️</div>
          <div><strong>${label} Coverage Lapse</strong> Most carriers will rate for lapse. Document reason and duration carefully.</div>
        </div>
      </div>`;
    container.appendChild(screen);
  });
}

function handleCarrierInsured(lob) {
  const val = document.getElementById(`${lob}-currently-insured`)?.value;
  const isYes = val === 'Yes';
  const isNo  = val === 'No';

  const fields = ['carrier-name', 'carrier-policy', 'carrier-expiry', 'carrier-premium'];
  fields.forEach(f => {
    const el = document.getElementById(`${lob}-${f}-field`);
    if (el) el.style.display = isYes ? 'block' : 'none';
  });

  const lapseField = document.getElementById(`${lob}-carrier-lapse-field`);
  if (lapseField) lapseField.style.display = isNo ? 'block' : 'none';

  // Reset lapse reason when toggling away from No
  if (!isNo) {
    const lapseEl = document.getElementById(`${lob}-carrier-lapse`);
    if (lapseEl) lapseEl.value = '';
  }

  handleCarrierLapse(lob);
}

function handleCarrierLapse(lob) {
  const insured = document.getElementById(`${lob}-currently-insured`)?.value;
  const lapse   = document.getElementById(`${lob}-carrier-lapse`)?.value;
  const alert   = document.getElementById(`${lob}-carrier-lapse-alert`);
  if (!alert) return;

  const isNo          = insured === 'No';
  const isNewCustomer = lapse === 'Never had insurance';
  alert.classList.toggle('hidden', !isNo || isNewCustomer);
}

// ══════════════════════════════════════════
// STEP NAV
// ══════════════════════════════════════════
function buildStepNav() {
  const nav = document.getElementById('stepNav');
  nav.innerHTML = '';

  const AUTO_STEPS = ['auto-vehicles', 'auto-coverage'];
  const HOME_STEPS = ['home-type', 'home-details', 'home-coverage'];
  const LIFE_STEPS = ['life-product', 'life-medicare', 'life-meds'];

  const pillLabels = {
    applicant: 'Applicant',
    auto:      '🚗 Auto',
    home:      '🏠 Home',
    life:      '❤️ Life / Health',
    review:    '✅ Review',
  };

  function stepGroup(s) {
    const m = macroOf(s);
    if (AUTO_STEPS.includes(m)) return 'auto';
    if (HOME_STEPS.includes(m)) return 'home';
    if (LIFE_STEPS.includes(m)) return 'life';
    return m;
  }

  // Build a de-duplicated pill list — sub-steps collapse into one pill
  const pills = [];
  state.steps.forEach((s, i) => {
    const group = stepGroup(s);
    const last = pills[pills.length - 1];
    if (last && last.group === group) {
      last.lastIndex = i;
    } else {
      pills.push({ group, label: pillLabels[group] || group, firstIndex: i, lastIndex: i });
    }
  });

  const currentKey   = state.steps[state.currentStepIndex];
  const currentGroup = stepGroup(currentKey);

  pills.forEach(pill => {
    const el = document.createElement('div');
    const isActive   = pill.group === currentGroup;
    const isComplete = pill.lastIndex < state.currentStepIndex && !isActive;
    el.className = 'step-pill' + (isActive ? ' active' : '') + (isComplete ? ' complete' : '');
    el.textContent = pill.label;
    el.onclick = () => {
      if (pill.firstIndex < state.currentStepIndex) {
        state.currentStepIndex = pill.firstIndex;
        renderStep();
      }
    };
    nav.appendChild(el);
  });
}

function renderStep() {
  // Hide all step panels
  document.querySelectorAll('.step-panel').forEach(p => p.classList.add('hidden'));

  const key = state.steps[state.currentStepIndex];
  const macro = macroOf(key);

  const panelMap = {
    'applicant':      'step-applicant',
    'auto-vehicles':  'step-auto-vehicles',
    'auto-coverage':  'step-auto-coverage',
    'home-type':      'step-home-type',
    'home-details':   'step-home-details',
    'home-coverage':  'step-home-coverage',
    'life-product':   'step-life-product',
    'life-medicare':  'step-life-medicare',
    'life-meds':      'step-life-meds',
    'review':         'step-review',
  };
  const panelId = panelMap[macro] || `step-${macro}`;
  const panel = document.getElementById(panelId);
  panel?.classList.remove('hidden');

  // Micro-step display: if this macro's panel has been refactored into
  // .micro-screen segments, show only the one matching this step key.
  // Panels with no .micro-screen children (unrefactored macros) are
  // unaffected — the whole panel renders as one screen, same as today.
  if (panel) {
    const microScreens = panel.querySelectorAll('.micro-screen');
    if (microScreens.length) {
      microScreens.forEach(screen => {
        screen.classList.toggle('hidden', screen.dataset.microStep !== key);
      });
    }
  }

  // When entering the household-members gate, refresh the running summary.
  // The gate's Yes/No select auto-advances on its own, so the global
  // Continue button is hidden here to remove any chance of it firing a
  // second, redundant navigation on top of the select's onchange.
  const applicantContinueBtn = document.getElementById('applicant-continue-btn');
  if (key === 'applicant:A6') {
    refreshHouseholdSummary();
    if (applicantContinueBtn) applicantContinueBtn.classList.add('hidden');
  } else if (applicantContinueBtn) {
    applicantContinueBtn.classList.remove('hidden');
  }

  // When entering auto coverage screen, rebuild physical damage blocks
  if (macro === 'auto-coverage') {
    refreshVehicleCovBlocks();
  }

  // When entering home-details, show/hide owner fields based on policy type
  if (macro === 'home-details') {
    applyHomeTypeToDetails();
  }

  // When entering the meds screen, ensure at least one med row exists
  if (macro === 'life-meds') {
    const container = document.getElementById('medications-container');
    if (container && container.children.length === 0) {
      addMedication();
    }
  }

  // When entering medicare screen, show the correct current plan block
  if (macro === 'life-medicare') {
    const type = document.getElementById('life-type')?.value;
    const suppBlock = document.getElementById('life-current-supp-block');
    const advBlock  = document.getElementById('life-current-adv-block');
    const acaBlock  = document.getElementById('life-current-aca-block');
    if (suppBlock) suppBlock.style.display = type === 'Medicare Supplement' ? 'block' : 'none';
    if (advBlock)  advBlock.style.display  = type === 'Medicare Advantage'  ? 'block' : 'none';
    if (acaBlock)  acaBlock.style.display  = type === 'Health / ACA'        ? 'block' : 'none';
  }

  // Progress
  const pct = Math.round(((state.currentStepIndex + 1) / state.steps.length) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent =
    `Step ${state.currentStepIndex + 1} of ${state.steps.length} — ${getStepLabel(macro)}`;
  updateSubProgress();

  // Nav pills
  buildStepNav();

  if (macro === 'review') buildReview();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getStepLabel(key) {
  const labels = {
    applicant:        'Applicant Info',
    'auto-vehicles':  'Vehicles',
    'auto-coverage':  'Auto Coverage',
    'home-type':      'Policy Type',
    'home-details':   'Property Details',
    'home-coverage':  'Home Coverage',
    'life-product':   'Product & Health',
    'life-medicare':  'Medicare Details',
    'life-meds':      'Medications',
    review:           'Review & Export',
  };
  return labels[key] || key;
}

// ══════════════════════════════════════════
// DYNAMIC HOME STEP RESOLUTION
// Called when leaving home-type — skips home-details for Renters (HO-4)
// ══════════════════════════════════════════
function resolveHomeSteps() {
  const type = document.getElementById('home-type')?.value || '';
  const isRenters = type === 'Renters (HO-4)';

  const homeTypeIdx = state.steps.indexOf('home-type');
  if (homeTypeIdx === -1) return;

  // Remove existing home sub-steps after home-type
  const homeSubSteps = ['home-details', 'home-coverage'];
  state.steps = state.steps.filter((s, i) =>
    i <= homeTypeIdx || !homeSubSteps.includes(s)
  );

  // Re-insert: Renters skips details, goes straight to coverage
  const insertAt = state.steps.indexOf('home-type') + 1;
  const toInsert = isRenters ? ['home-coverage'] : ['home-details', 'home-coverage'];
  state.steps.splice(insertAt, 0, ...toInsert);
}

// ══════════════════════════════════════════
// DYNAMIC LIFE STEP RESOLUTION
// Called when leaving life-product — inserts/removes
// life-medicare and life-meds based on product type
// ══════════════════════════════════════════
function resolveLifeSteps() {
  const MEDICARE_PRODUCTS = ['Medicare Supplement', 'Medicare Advantage', 'Health / ACA'];
  const MEDS_PRODUCTS     = ['Medicare Supplement', 'Medicare Advantage', 'Health / ACA'];

  const type = document.getElementById('life-type')?.value || '';
  const needsMedicare = MEDICARE_PRODUCTS.includes(type);
  const needsMeds     = MEDS_PRODUCTS.includes(type);

  const lifeIdx = state.steps.indexOf('life-product');
  if (lifeIdx === -1) return;

  const lifeSubSteps = ['life-medicare', 'life-meds'];
  state.steps = state.steps.filter((s, i) =>
    i <= lifeIdx || !lifeSubSteps.includes(s)
  );

  const insertAt = state.steps.indexOf('life-product') + 1;
  const toInsert = [];
  if (needsMedicare) toInsert.push('life-medicare');
  if (needsMeds)     toInsert.push('life-meds');
  state.steps.splice(insertAt, 0, ...toInsert);
}

function nextStep() {
  const currentKey = state.steps[state.currentStepIndex];
  const currentMacro = macroOf(currentKey);

  if (currentMacro === 'home-type') {
    resolveHomeSteps();
  }
  if (currentMacro === 'life-product') {
    resolveLifeSteps();
  }

  if (state.currentStepIndex < state.steps.length - 1) {
    state.currentStepIndex++;
    renderStep();
  }
}
function prevStep() {
  if (state.currentStepIndex > 0) {
    state.currentStepIndex--;
    renderStep();
  }
}
function goToLOB() {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('step-lob').classList.remove('hidden');
  document.getElementById('stepNav').innerHTML = '';
  document.getElementById('progressFill').style.width = '10%';
  document.getElementById('progressLabel').textContent = 'Step 1 of 2 — Line Selection';
}
function newIntake() {
  if (confirm('Start a new intake? All current data will be cleared.')) {
    location.reload();
  }
}
