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
      <div class="field"><label>Year</label><input type="number" id="v${n}-year" placeholder="2020" min="1950" max="2026" onchange="refreshVehicleCovBlocks()"></div>
      <div class="field"><label>Make</label><input type="text" id="v${n}-make" placeholder="Toyota"></div>
      <div class="field"><label>Model</label><input type="text" id="v${n}-model" placeholder="Camry"></div>
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
    <div id="v${n}-commute-block" style="display:none;margin-top:12px">
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
    <div class="field-grid three" style="margin-top:12px">
      <div class="field"><label>Ownership</label>
        <select id="v${n}-ownership" onchange="handleLienholder(${n})">
          <option value="Owned">Owned (no lien)</option>
          <option value="Financed">Financed (lienholder)</option>
          <option value="Leased">Leased</option>
        </select>
      </div>
    </div>
    <div id="v${n}-lien-block" style="display:none;margin-top:12px">
      <div class="alert alert-warn" style="margin-bottom:12px">
        <div class="alert-icon">⚠️</div>
        <div><strong>Lienholder / Lease</strong> Comp & Collision <strong>required</strong>. Deductible typically capped at $500 by lender. Verify GAP coverage.</div>
      </div>
      <div class="field-grid">
        <div class="field"><label>Lender / Leasing Co.</label><input type="text" id="v${n}-lender"></div>
        <div class="field"><label>Loan / Lease #</label><input type="text" id="v${n}-loan-num"></div>
        <div class="field span2"><label>Lender Address</label><input type="text" id="v${n}-lender-addr"></div>
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
  block.style.display = isCommute ? 'block' : 'none';
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
  block.style.display = (val === 'Financed' || val === 'Leased') ? 'block' : 'none';
  refreshVehicleCovBlocks();
  checkLienholderAlert();
}

function handleGlass(n) {
  const comp = document.getElementById(`v${n}-comp`)?.value;
  const glassField = document.getElementById(`v${n}-glass-field`);
  if (!glassField) return;
  const hasComp = comp && comp !== 'None' && comp !== '';
  glassField.style.display = hasComp ? 'block' : 'none';
  if (!hasComp) {
    const glassEl = document.getElementById(`v${n}-glass`);
    if (glassEl) glassEl.value = 'No';
  }
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
      <div class="field-grid">
        <div class="field">
          <label>Comprehensive ${req}${flag}</label>
          <select id="v${i}-comp" onchange="handleGlass(${i})">
            <option value="">None</option>
            <option>$100 ded</option><option>$250 ded</option>
            <option>$500 ded</option><option>$1,000 ded</option>
          </select>
        </div>
        <div class="field" id="v${i}-glass-field" style="display:none">
          <label>Glass Coverage</label>
          <select id="v${i}-glass">
            <option value="No">No</option>
            <option value="Yes">Yes</option>
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
      </div>`;
    container.appendChild(block);
  }
}

// ══════════════════════════════════════════
// DRIVER REPEATER
// ══════════════════════════════════════════
function addDriver() {
  state.driverCount++;
  const n = state.driverCount;
  const c = document.getElementById('drivers-container');
  const div = document.createElement('div');
  div.className = 'repeater-item';
  div.id = `driver-${n}`;
  div.innerHTML = `
    <div class="repeater-header">
      <div class="repeater-title">Driver ${n}</div>
      ${n > 1 ? `<button class="btn-remove" onclick="removeItem('driver-${n}')">Remove</button>` : ''}
    </div>
    <div class="field-grid three">
      <div class="field"><label>First Name</label><input type="text" id="d${n}-first"></div>
      <div class="field"><label>Last Name</label><input type="text" id="d${n}-last"></div>
      <div class="field"><label>Date of Birth</label><input type="date" id="d${n}-dob" onchange="checkDriverAge(${n})"></div>
      <div class="field"><label>License #</label><input type="text" id="d${n}-lic"></div>
      <div class="field"><label>License State</label>
        <select id="d${n}-lic-state">
          <option>MO</option><option>IL</option><option>KS</option><option>AR</option><option>TN</option>
          <option>KY</option><option>TX</option><option>FL</option><option>Other</option>
        </select>
      </div>
      <div class="field"><label>Relationship</label>
        <select id="d${n}-rel">
          <option>Self</option><option>Spouse</option><option>Child</option>
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
      <div><strong>Driver History Flag</strong> This driver has incidents that will affect rating. Verify details and check carrier eligibility guidelines.</div>
    </div>
    <div id="d${n}-age-alert" class="alert alert-warn hidden" style="margin-top:10px">
      <div class="alert-icon">⚠️</div>
      <div><strong>Young Driver</strong> Drivers under 25 typically rated significantly higher. Confirm discount eligibility (good student, driver training).</div>
    </div>`;
  c.appendChild(div);

  // Auto-populate Driver 1 from applicant page
  if (n === 1) {
    const fields = {
      'd1-first': 'app-first',
      'd1-last':  'app-last',
      'd1-dob':   'app-dob',
    };
    for (const [driverId, appId] of Object.entries(fields)) {
      const appVal = document.getElementById(appId)?.value;
      const driverEl = document.getElementById(driverId);
      if (appVal && driverEl) driverEl.value = appVal;
    }
    // Lock relationship to Self for Driver 1
    const relEl = document.getElementById('d1-rel');
    if (relEl) relEl.value = 'Self';
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
