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

  // Build step order
  const steps = ['applicant'];
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
  state.currentStepIndex = 0;

  // Reset repeater containers and counts before init
  ['vehicles-container', 'vehicles-cov-container', 'drivers-container',
   'medications-container'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });
  state.vehicleCount = 0;
  state.driverCount = 0;
  window.medCount = 0;

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
    const block = document.createElement('div');
    block.className = 'repeater-item';
    block.id = id;
    block.style.marginBottom = '14px';
    block.innerHTML = `
      <div class="repeater-title" style="margin-bottom:14px">${label}</div>
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
      </div>`;
    container.appendChild(block);
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
    if (AUTO_STEPS.includes(s)) return 'auto';
    if (HOME_STEPS.includes(s)) return 'home';
    if (LIFE_STEPS.includes(s)) return 'life';
    return s;
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
  const panelId = panelMap[key] || `step-${key}`;
  document.getElementById(panelId)?.classList.remove('hidden');

  // When entering auto coverage screen, rebuild physical damage blocks
  if (key === 'auto-coverage') {
    refreshVehicleCovBlocks();
  }

  // When entering home-details, show/hide owner fields based on policy type
  if (key === 'home-details') {
    applyHomeTypeToDetails();
  }

  // When entering the meds screen, ensure at least one med row exists
  if (key === 'life-meds') {
    const container = document.getElementById('medications-container');
    if (container && container.children.length === 0) {
      addMedication();
    }
  }

  // When entering medicare screen, show the correct current plan block
  if (key === 'life-medicare') {
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
    `Step ${state.currentStepIndex + 1} of ${state.steps.length} — ${getStepLabel(key)}`;

  // Nav pills
  buildStepNav();

  if (key === 'review') buildReview();
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

  if (currentKey === 'home-type') {
    resolveHomeSteps();
  }
  if (currentKey === 'life-product') {
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
