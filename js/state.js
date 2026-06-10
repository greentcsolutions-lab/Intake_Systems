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

const LOB_META = {
  home: { label: 'Home/Renters', step: 'step-home' },
  life: { label: 'Life/Health', step: 'step-life' },
};

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

  // Build step order — auto expands into two focused screens
  const steps = ['applicant'];
  lobs.forEach(lob => {
    if (lob === 'auto') {
      steps.push('auto-vehicles', 'auto-coverage');
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

  const isNo        = insured === 'No';
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

  const pillLabels = {
    applicant: 'Applicant',
    auto:      '🚗 Auto',
    home:      '🏠 Home',
    life:      '❤️ Life / Health',
    review:    '✅ Review',
  };

  // Build a de-duplicated pill list — auto sub-steps collapse into one 'auto' pill
  const pills = []; // { label, firstIndex, lastIndex }
  state.steps.forEach((s, i) => {
    const group = AUTO_STEPS.includes(s) ? 'auto' : s;
    const last = pills[pills.length - 1];
    if (last && last.group === group) {
      last.lastIndex = i;
    } else {
      pills.push({ group, label: pillLabels[group] || group, firstIndex: i, lastIndex: i });
    }
  });

  const currentKey = state.steps[state.currentStepIndex];
  const currentGroup = AUTO_STEPS.includes(currentKey) ? 'auto' : currentKey;

  pills.forEach(pill => {
    const el = document.createElement('div');
    const isActive   = pill.group === currentGroup;
    const isComplete = pill.lastIndex < state.currentStepIndex && !isActive;
    el.className = 'step-pill' + (isActive ? ' active' : '') + (isComplete ? ' complete' : '');
    el.textContent = pill.label;
    // Allow backward navigation to the first step in the group
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
    'applicant':     'step-applicant',
    'auto-vehicles': 'step-auto-vehicles',
    'auto-coverage': 'step-auto-coverage',
    'review':        'step-review',
  };
  const panelId = panelMap[key] || LOB_META[key]?.step || `step-${key}`;
  document.getElementById(panelId)?.classList.remove('hidden');

  // When entering the coverage screen, rebuild physical damage blocks
  // so vehicle labels (Year Make Model) are current
  if (key === 'auto-coverage') {
    refreshVehicleCovBlocks();
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
    applicant:       'Applicant Info',
    'auto-vehicles': 'Vehicles',
    'auto-coverage': 'Auto Coverage',
    home:            'Home / Renters',
    life:            'Life / Health',
    review:          'Review & Export',
  };
  return labels[key] || key;
}

function nextStep() {
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