// js/forms/auto.js
// Version 1.3.0 — 2026-07-15


// ══════════════════════════════════════════
// VEHICLE REPEATER (Personal Auto)
// ══════════════════════════════════════════
function addVehicle() {
  state.vehicleCount++;
  const n = state.vehicleCount;
  const c = document.getElementById('vehicles-container');
  const div = document.createElement('div');
  div.className = 'repeater-item';
  div.id = `vehicle-${n}`;
  div.innerHTML = `
    <div class="repeater-header">
      <div class="repeater-title">Vehicle ${n}</div>
      ${n > 1 ? `<button class="btn-remove" onclick="removeItem('vehicle-${n}')">Remove</button>` : ''}
    </div>
    <div class="field-grid three">
      <div class="field"><label>Year <span class="req">*</span></label><input type="number" id="v${n}-year" placeholder="2020" min="1950" max="2026" onchange="refreshVehicleCovBlocks()"></div>
      <div class="field"><label>Make <span class="req">*</span></label><input type="text" id="v${n}-make" placeholder="Toyota"></div>
      <div class="field"><label>Model <span class="req">*</span></label><input type="text" id="v${n}-model" placeholder="Camry"></div>
      <div class="field"><label>VIN</label><input type="text" id="v${n}-vin" placeholder="1HGBH41JXMN109186"></div>
      <div class="field"><label>Garaging ZIP</label><input type="text" id="v${n}-zip" placeholder="65000" maxlength="5"></div>
      <div class="field"><label>Primary Use</label>
        <select id="v${n}-use" onchange="handleVehicleUse(${n})">
          <option>Pleasure</option><option>Commute</option>
          <option>Business</option><option>Farm</option>
        </select>
      </div>
      <div class="field"><label>Annual Miles <span class="flag">⚡ auto-calculated for commute</span></label><input type="number" id="v${n}-miles" placeholder="12000"></div>
    </div>
    <div class="gate-panel hidden" id="v${n}-commute-block">
      <div class="gate-panel-inner">
        <div class="alert alert-info" style="margin-bottom:12px">
          <div class="alert-icon">ℹ️</div>
          <div><strong>Commute Details Required</strong> Days per week commuted and one-way distance are used to calculate annual mileage for rating.</div>
        </div>
        <div class="field-grid three">
          <div class="field">
            <label>Days/Week Commuting</label>
            <select id="v${n}-commute-days" onchange="calcCommuteMiles(${n})">
              <option value="">-- Select --</option>
              <option value="1">1 day</option><option value="2">2 days</option>
              <option value="3">3 days</option><option value="4">4 days</option>
              <option value="5">5 days</option>
            </select>
          </div>
          <div class="field">
            <label>One-Way Distance (miles)</label>
            <input type="number" id="v${n}-commute-dist" placeholder="15" min="1" oninput="calcCommuteMiles(${n})">
          </div>
          <div class="field">
            <label>Calculated Annual Miles</label>
            <input type="number" id="v${n}-commute-calc" placeholder="—" readonly style="background:var(--cream-dark);color:var(--navy);font-weight:600;">
          </div>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:4px">Formula: (days × 2 × distance × 50 weeks) + estimated personal use</div>
      </div>
    </div>
    <div class="field-grid three" style="margin-top:12px">
      <div class="field"><label>Ownership</label>
        <select id="v${n}-ownership" onchange="handleLienholder(${n})">
          <option value="Owned">Owned (no lien)</option>
          <option value="Financed">Financed (lienholder)</option>
          <option value="Leased">Leased</option>
        </select>
      </div>
    </div>
    <div class="gate-panel hidden" id="v${n}-lien-block">
      <div class="gate-panel-inner">
        <div class="alert alert-warn" style="margin-bottom:12px">
          <div class="alert-icon">⚠️</div>
          <div><strong>Lienholder / Lease</strong> Comp & Collision <strong>required</strong>. Deductible typically capped at $500 by lender. Verify GAP coverage.</div>
        </div>
        <div class="field-grid">
          <div class="field"><label>Lender / Leasing Co.</label><input type="text" id="v${n}-lender"></div>
          <div class="field"><label>Loan / Lease #</label><input type="text" id="v${n}-loan-num"></div>
          <div class="field span2"><label>Lender Address</label><input type="text" id="v${n}-lender-addr"></div>
        </div>
      </div>
    </div>`;
  c.appendChild(div);

  // Auto-populate Vehicle 1 garaging ZIP from applicant address
  if (n === 1) {
    const appZip = document.getElementById('app-zip')?.value;
    if (appZip) {
      const zipEl = document.getElementById('v1-zip');
      if (zipEl) zipEl.value = appZip;
    }
  }

  refreshVehicleCovBlocks();
}

function handleVehicleUse(n) {
  const use = document.getElementById(`v${n}-use`)?.value;
  const block = document.getElementById(`v${n}-commute-block`);
  if (!block) return;
  const isCommute = use === 'Commute';
  toggleGatePanel(block, isCommute);
  if (!isCommute) {
    // Clear commute calc when switching away
    const calcEl = document.getElementById(`v${n}-commute-calc`);
    if (calcEl) calcEl.value = '';
  }
}

function calcCommuteMiles(n) {
  const days = parseInt(document.getElementById(`v${n}-commute-days`)?.value) || 0;
  const dist = parseFloat(document.getElementById(`v${n}-commute-dist`)?.value) || 0;
  if (!days || !dist) return;

  // Progressive formula: round trips × weeks + ~3,000 personal miles buffer
  const commuteMiles = days * 2 * dist * 50;
  const personalBuffer = 3000;
  const total = Math.round(commuteMiles + personalBuffer);

  const calcEl = document.getElementById(`v${n}-commute-calc`);
  const milesEl = document.getElementById(`v${n}-miles`);
  if (calcEl) calcEl.value = total;
  if (milesEl) milesEl.value = total; // keep in sync with main miles field
}

function handleLienholder(n) {
  const val = document.getElementById(`v${n}-ownership`).value;
  const block = document.getElementById(`v${n}-lien-block`);
  toggleGatePanel(block, val === 'Financed' || val === 'Leased');
  refreshVehicleCovBlocks();
  checkLienholderAlert();
}

function handleGlass(n) {
  const comp = document.getElementById(`v${n}-comp`)?.value;
  const glassField = document.getElementById(`v${n}-glass-field`);
  if (!glassField) return;
  const hasComp = comp && comp !== 'None' && comp !== '';
  toggleGatePanel(glassField, hasComp);
  if (!hasComp) {
    const glassEl = document.getElementById(`v${n}-glass`);
    if (glassEl) glassEl.value = 'No';
  }
}

function handleSR22() {
  const val = document.getElementById('auto-sr22')?.value;
  const isYes = val === 'Yes';
  toggleGatePanel(document.getElementById('sr22-panel'), isYes);
  document.getElementById('sr22-alert')?.classList.toggle('hidden', !isYes);
}

function checkLienholderAlert() {
  let hasLien = false;
  for (let i = 1; i <= state.vehicleCount; i++) {
    const el = document.getElementById(`v${i}-ownership`);
    if (el && (el.value === 'Financed' || el.value === 'Leased')) { hasLien = true; break; }
  }
  const alert = document.getElementById('comp-coll-alert');
  if (alert) alert.classList.toggle('hidden', !hasLien);
}

function refreshVehicleCovBlocks() {
  checkLienholderAlert();
  const container = document.getElementById('vehicles-cov-container');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= state.vehicleCount; i++) {
    const yearEl = document.getElementById(`v${i}-year`);
    const makeEl = document.getElementById(`v${i}-make`);
    const modelEl = document.getElementById(`v${i}-model`);
    if (!yearEl) continue;
    const label = [yearEl.value, makeEl?.value, modelEl?.value].filter(Boolean).join(' ') || `Vehicle ${i}`;
    const ownershipEl = document.getElementById(`v${i}-ownership`);
    const isLien = ownershipEl && (ownershipEl.value === 'Financed' || ownershipEl.value === 'Leased');
    const req = isLien ? '<span class="req">*</span>' : '';
    const flag = isLien ? '<span class="flag">⚡ lender required</span>' : '';

    const block = document.createElement('div');
    block.className = 'repeater-item';
    block.style.marginTop = '12px';
    block.innerHTML = `
      <div class="repeater-title" style="margin-bottom:14px">${label} — Physical Damage</div>
      <div class="field" style="margin-bottom:16px">
        <label>Storage / Non-Operational? <span class="flag">⚡ liability does not apply to this vehicle</span></label>
        <select id="v${i}-storage" onchange="updateStorageNote()">
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </div>
      <div class="field-grid">
        <div class="field">
          <label>Comprehensive ${req}${flag}</label>
          <select id="v${i}-comp" onchange="handleGlass(${i})">
            <option value="">None</option>
            <option>$100 ded</option><option>$250 ded</option>
            <option>$500 ded</option><option>$1,000 ded</option>
          </select>
        </div>
        <div class="field">
          <label>Collision ${req}${flag}</label>
          <select id="v${i}-coll">
            <option value="">None</option>
            <option>$100 ded</option><option>$250 ded</option>
            <option>$500 ded</option><option>$1,000 ded</option>
          </select>
        </div>
        <div class="field">
          <label>GAP Coverage?</label>
          <select id="v${i}-gap">
            <option value="No">No</option><option value="Yes">Yes</option>
          </select>
        </div>
        <div class="field">
          <label>Custom Parts / Equipment</label>
          <select id="v${i}-custom">
            <option value="No">No</option><option value="Yes">Yes</option>
          </select>
        </div>
      </div>
      <div class="gate-panel hidden" id="v${i}-glass-field">
        <div class="gate-panel-inner">
          <div class="field">
            <label>Glass Coverage</label>
            <select id="v${i}-glass">
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>
      </div>`;
    container.appendChild(block);
  }
  updateStorageNote();
}

function updateStorageNote() {
  const note = document.getElementById('storage-vehicles-note');
  const list = document.getElementById('storage-vehicles-list');
  if (!note || !list) return;
  const stored = [];
  for (let i = 1; i <= state.vehicleCount; i++) {
    if (document.getElementById(`v${i}-storage`)?.value === 'Yes') {
      const label = [
        document.getElementById(`v${i}-year`)?.value,
        document.getElementById(`v${i}-make`)?.value,
        document.getElementById(`v${i}-model`)?.value,
      ].filter(Boolean).join(' ') || `Vehicle ${i}`;
      stored.push(label);
    }
  }
  note.classList.toggle('hidden', stored.length === 0);
  list.textContent = stored.join(', ');
}

// ══════════════════════════════════════════
// HOUSEHOLD MEMBER REPEATER (additional members beyond applicant)
// Max 5 additional (6 total including applicant)
// ══════════════════════════════════════════
const EDUCATION_OPTIONS_HTML = [
  'Less than High School', 'High School / GED', 'Some College',
  "Associate's Degree", "Bachelor's Degree", "Master's Degree",
  'Doctorate / Professional Degree',
].map(o => `<option>${o}</option>`).join('');

function addHouseholdMember() {
  state.driverCount++;
  const n = state.driverCount;
  const container = document.getElementById('hh-loop-container');

  const a6a = document.createElement('div');
  a6a.className = 'micro-screen hidden';
  a6a.dataset.microStep = `applicant:A6a-${n}`;
  a6a.innerHTML = `
    <div class="card-title" style="font-size:16px;margin-bottom:16px">Household Member ${n}</div>
    <div class="field-grid three">
      <div class="field"><label>First Name</label><input type="text" id="d${n}-first"></div>
      <div class="field"><label>Last Name</label><input type="text" id="d${n}-last"></div>
      <div class="field"><label>Date of Birth</label><input type="date" id="d${n}-dob" onchange="checkDriverAge(${n})"></div>
      <div class="field"><label>SSN / Last 4 <span class="flag">⚡ optional</span></label><input type="text" id="d${n}-ssn" placeholder="XXX-XX-1234" maxlength="11"></div>
      <div class="field"><label>License # <span class="flag">⚡ optional</span></label><input type="text" id="d${n}-lic"></div>
      <div class="field"><label>License State</label>
        <select id="d${n}-lic-state">
          <option>MO</option><option>IL</option><option>KS</option><option>AR</option><option>TN</option>
          <option>KY</option><option>TX</option><option>FL</option><option>Other</option>
        </select>
      </div>
      <div class="field"><label>Relationship</label>
        <select id="d${n}-rel">
          <option>Spouse</option><option>Child</option>
          <option>Parent</option><option>Other</option>
        </select>
      </div>
      <div class="field"><label>Marital Status</label>
        <select id="d${n}-marital">
          <option>Single</option><option>Married</option>
          <option>Divorced</option><option>Widowed</option>
        </select>
      </div>
      <div class="field"><label>Good Student Discount?</label>
        <select id="d${n}-good-student">
          <option value="No">No</option><option value="Yes">Yes</option>
        </select>
      </div>
      <div class="field"><label>Accidents (3 yr)</label>
        <select id="d${n}-accidents" onchange="checkDriverHistory(${n})">
          <option value="0">0</option><option value="1">1</option>
          <option value="2">2</option><option value="3+">3+</option>
        </select>
      </div>
      <div class="field"><label>Violations (3 yr)</label>
        <select id="d${n}-violations" onchange="checkDriverHistory(${n})">
          <option value="0">0</option><option value="1">1</option>
          <option value="2">2</option><option value="3+">3+</option>
        </select>
      </div>
      <div class="field"><label>DUI / DWI (5 yr)?</label>
        <select id="d${n}-dui" onchange="checkDriverHistory(${n})">
          <option value="No">No</option><option value="Yes">Yes</option>
        </select>
      </div>
    </div>
    <div id="d${n}-history-alert" class="alert alert-warn hidden" style="margin-top:10px">
      <div class="alert-icon">⚠️</div>
      <div><strong>Incident History Flag</strong> This household member has incidents that will affect rating. Verify details and check carrier eligibility guidelines.</div>
    </div>
    <div id="d${n}-age-alert" class="alert alert-warn hidden" style="margin-top:10px">
      <div class="alert-icon">⚠️</div>
      <div><strong>Young Driver</strong> Drivers under 25 typically rated significantly higher. Confirm discount eligibility (good student, driver training).</div>
    </div>`;
  container.appendChild(a6a);

  const a6b = document.createElement('div');
  a6b.className = 'micro-screen hidden';
  a6b.dataset.microStep = `applicant:A6b-${n}`;
  a6b.innerHTML = `
    <div class="section-divider"><span>Second Named Insured — Member ${n}</span></div>
    <div class="field-grid">
      <div class="field">
        <label>Second Named Insured on Policy?</label>
        <select id="d${n}-second-insured" onchange="toggleSecondNamedInsured(${n})">
          <option value="No">No</option><option value="Yes">Yes</option>
        </select>
      </div>
    </div>
    <div class="gate-panel hidden" id="d${n}-second-insured-block">
      <div class="gate-panel-inner">
        <div class="field-grid">
          <div class="field" data-new-required>
            <label>Occupation <span class="req">*</span></label>
            <input type="text" id="d${n}-occupation" placeholder="e.g. Registered Nurse">
          </div>
          <div class="field" data-new-required>
            <label>Education <span class="req">*</span></label>
            <select id="d${n}-education">
              <option value="">-- Select --</option>
              ${EDUCATION_OPTIONS_HTML}
            </select>
          </div>
        </div>
      </div>
    </div>`;
  container.appendChild(a6b);

  // Splice this member's two screens in immediately before Reason for
  // Policy (A7) — appending at a fixed anchor, rather than relative to the
  // gate, keeps repeated "Yes" answers in chronological order (member 1's
  // screens stay ahead of member 2's, etc.) regardless of how many loop
  // iterations already exist.
  const a7Idx = state.steps.indexOf('applicant:A7');
  if (a7Idx !== -1) {
    state.steps.splice(a7Idx, 0, `applicant:A6a-${n}`, `applicant:A6b-${n}`);
  }

  return n;
}

// Count of household members currently ACTIVE (not removed). Distinct from
// state.driverCount, which is a high-water mark used only for assigning
// fresh, never-reused element IDs — matches the pattern already used for
// construction-material rows in home.js. The 5-member cap is enforced
// against the active count so removing members actually frees up a slot.
function activeHouseholdCount() {
  let count = 0;
  for (let i = 1; i <= state.driverCount; i++) {
    if (document.getElementById(`d${i}-first`)) count++;
  }
  return count;
}

function refreshHouseholdSummary() {
  const el = document.getElementById('hh-members-summary');
  if (!el) return;
  let rows = '';
  for (let i = 1; i <= state.driverCount; i++) {
    if (!document.getElementById(`d${i}-first`)) continue; // removed
    const first = document.getElementById(`d${i}-first`)?.value.trim();
    const last = document.getElementById(`d${i}-last`)?.value.trim();
    const name = [first, last].filter(Boolean).join(' ') || `Member ${i}`;
    rows += `<div class="hh-summary-row">
      <span class="hh-summary-name">${name}</span>
      <button type="button" class="btn-remove" onclick="removeMember(${i})">Remove</button>
    </div>`;
  }
  el.innerHTML = rows || '<div class="hh-summary-empty">No additional household members yet.</div>';
}

// Sets the hidden app-hh-gate value and the buttons' visual selected state,
// then defers to the existing handleHouseholdGate() unchanged — the button
// UI is purely a presentation swap over the same gate logic.
function selectHouseholdGate(val) {
  const gateEl = document.getElementById('app-hh-gate');
  if (gateEl) gateEl.value = val;
  document.getElementById('app-hh-gate-yes')?.classList.toggle('selected', val === 'Yes');
  document.getElementById('app-hh-gate-no')?.classList.toggle('selected', val === 'No');
  handleHouseholdGate();
}

// Clears both the hidden value and the buttons' selected state together —
// used whenever the gate needs to present as unanswered again (loop-back,
// max-members block).
function resetHouseholdGateUI() {
  const gateEl = document.getElementById('app-hh-gate');
  if (gateEl) gateEl.value = '';
  document.getElementById('app-hh-gate-yes')?.classList.remove('selected');
  document.getElementById('app-hh-gate-no')?.classList.remove('selected');
}

function handleHouseholdGate() {
  const gateEl = document.getElementById('app-hh-gate');
  const gateVal = gateEl?.value;
  if (!gateVal) { alert('Please select Yes or No.'); return; }

  if (gateVal === 'Yes') {
    if (activeHouseholdCount() >= 5) {
      alert('Maximum of 5 additional household members reached.');
      resetHouseholdGateUI();
      return;
    }
    const n = addHouseholdMember();
    state.currentStepIndex = state.steps.indexOf(`applicant:A6a-${n}`);
    renderStep();
  } else {
    // "No" must jump straight to A7, NOT fall through to a generic
    // nextStep(). Every already-added member's A6a-n/A6b-n screens are
    // spliced in between the gate and A7 (see addHouseholdMember()), so a
    // plain array-index increment here would land on the first loop item
    // instead of skipping past all of them — this was the cause of the
    // "stuck in a loop" bug: selecting No repeatedly re-entered household
    // member screens instead of ever reaching Reason for Policy.
    state.currentStepIndex = state.steps.indexOf('applicant:A7');
    renderStep();
  }
}

// Called from the last screen of a loop iteration (A6b-n's Continue) to
// jump back to the A6 gate instead of falling through to A7 — this is the
// "loop back to gate" behavior. Resetting the gate's UI here (rather than
// on every renderStep()) is what lets handleHouseholdGate() fire again on
// re-entry.
function finishHouseholdLoopIteration() {
  if (!validateStep()) return;
  resetHouseholdGateUI();
  state.currentStepIndex = state.steps.indexOf('applicant:A6');
  renderStep();
}

function removeMember(n) {
  document.querySelector(`.micro-screen[data-micro-step="applicant:A6a-${n}"]`)?.remove();
  document.querySelector(`.micro-screen[data-micro-step="applicant:A6b-${n}"]`)?.remove();
  removeLoopIteration([`applicant:A6a-${n}`, `applicant:A6b-${n}`]);
  // state.driverCount is intentionally left unchanged — matches the
  // material-row high-water-mark pattern. collectAllData()/pdf.js/
  // buildReview() already guard on element existence (`continue` when a
  // d{i}-first is missing), so a removed member is simply skipped in
  // output, and future members always get a fresh, never-reused number.
  refreshHouseholdSummary();
  renderStep();
}

function toggleSecondNamedInsured(n) {
  const val = document.getElementById(`d${n}-second-insured`)?.value;
  const isYes = val === 'Yes';

  // Enforce "only one" — clear every other member's toggle when this one is set to Yes
  if (isYes) {
    for (let i = 1; i <= state.driverCount; i++) {
      if (i === n) continue;
      const otherSelect = document.getElementById(`d${i}-second-insured`);
      if (otherSelect && otherSelect.value === 'Yes') {
        otherSelect.value = 'No';
        toggleSecondNamedInsured(i);
      }
    }
  }

  const block = document.getElementById(`d${n}-second-insured-block`);
  if (block) toggleGatePanel(block, isYes);
  if (!isYes) {
    const occEl = document.getElementById(`d${n}-occupation`);
    const eduEl = document.getElementById(`d${n}-education`);
    if (occEl) occEl.value = '';
    if (eduEl) eduEl.value = '';
  }
}

function checkDriverHistory(n) {
  const acc = document.getElementById(`d${n}-accidents`)?.value;
  const vio = document.getElementById(`d${n}-violations`)?.value;
  const dui = document.getElementById(`d${n}-dui`)?.value;
  const alert = document.getElementById(`d${n}-history-alert`);
  if (!alert) return;
  const flag = parseInt(acc) > 0 || parseInt(vio) > 0 || dui === 'Yes';
  alert.classList.toggle('hidden', !flag);
}

function checkDriverAge(n) {
  const dob = document.getElementById(`d${n}-dob`)?.value;
  if (!dob) return;
  const age = Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 3600 * 1000));
  const alert = document.getElementById(`d${n}-age-alert`);
  if (alert) alert.classList.toggle('hidden', age >= 25);
}

// ══════════════════════════════════════════
// COMMERCIAL VEHICLE + DRIVER REPEATERS
// ══════════════════════════════════════════