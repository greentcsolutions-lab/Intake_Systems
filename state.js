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
  auto: { label: 'Personal Auto', step: 'step-auto' },
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

  // Build step order
  state.steps = ['applicant', ...lobs, 'review'];
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

  // Init with single vehicle and single driver
  addVehicle();
  addDriver();

  document.getElementById('step-lob').classList.add('hidden');
  buildStepNav();
  renderStep();
}

// ══════════════════════════════════════════
// STEP NAV
// ══════════════════════════════════════════
function buildStepNav() {
  const nav = document.getElementById('stepNav');
  nav.innerHTML = '';
  const labels = {
    applicant: 'Applicant',
    auto: '🚗 Auto',
    home: '🏠 Home',
    life: '❤️ Life',
    review: '✅ Review',
  };
  state.steps.forEach((s, i) => {
    const pill = document.createElement('div');
    pill.className = 'step-pill' + (i === state.currentStepIndex ? ' active' : '');
    pill.textContent = labels[s] || s;
    pill.onclick = () => { if (i < state.currentStepIndex) { state.currentStepIndex = i; renderStep(); } };
    nav.appendChild(pill);
  });
}

function renderStep() {
  // Hide all step panels
  document.querySelectorAll('.step-panel').forEach(p => p.classList.add('hidden'));

  const key = state.steps[state.currentStepIndex];
  const panelId = key === 'applicant' ? 'step-applicant' :
                  key === 'review' ? 'step-review' :
                  LOB_META[key]?.step || `step-${key}`;
  document.getElementById(panelId)?.classList.remove('hidden');

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
    applicant: 'Applicant Info',
    auto: 'Personal Auto',
    home: 'Home / Renters',
    life: 'Life / Health',
    review: 'Review & Export',
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