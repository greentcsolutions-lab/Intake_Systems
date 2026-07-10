// js/forms/home.js
// Version 1.1.0 — 2026-07-09


// ══════════════════════════════════════════
// CONSTRUCTION MATERIALS (Siding / Interior Walls / Flooring)
// Material 1 is static in index.html; materials 2-4 are added dynamically.
// Percentages for a given surface must total 100%.
// ══════════════════════════════════════════
const MATERIAL_OPTIONS = {
  siding: ['Vinyl', 'Brick', 'Brick Veneer', 'Wood', 'Stucco', 'Fiber Cement (Hardie Board)', 'Stone / Stone Veneer', 'Aluminum / Metal', 'EIFS / Synthetic Stucco', 'Log', 'Other'],
  wall:   ['Drywall', 'Plaster', 'Wood Paneling', 'Brick', 'Concrete Block', 'Other'],
  floor:  ['Hardwood', 'Engineered Wood', 'Carpet', 'Tile', 'Laminate', 'Vinyl / LVP', 'Concrete', 'Other'],
};
const MATERIAL_LABELS = { siding: 'Exterior Siding', wall: 'Interior Wall', floor: 'Flooring' };

function ensureMaterialCounts() {
  if (!window.materialCounts) window.materialCounts = { siding: 1, wall: 1, floor: 1 };
  return window.materialCounts;
}

function addMaterialRow(surface) {
  const counts = ensureMaterialCounts();
  if (counts[surface] >= 4) return;
  counts[surface]++;
  const n = counts[surface];
  const c = document.getElementById(`${surface}-materials-container`);
  if (!c) return;
  const label = MATERIAL_LABELS[surface];
  const optionsHtml = MATERIAL_OPTIONS[surface].map(m => `<option>${m}</option>`).join('');

  const div = document.createElement('div');
  div.className = 'field-grid three';
  div.id = `${surface}-mat-${n}`;
  div.style.marginTop = '10px';
  div.innerHTML = `
    <div class="field" data-new-required>
      <label>${label} Material ${n} <span class="req">*</span></label>
      <select id="home-${surface}${n}-type" onchange="updateMaterialTotal('${surface}')">
        <option value="">-- Select --</option>
        ${optionsHtml}
      </select>
    </div>
    <div class="field" data-new-required>
      <label>${label} Material ${n} % <span class="req">*</span></label>
      <input type="number" id="home-${surface}${n}-pct" min="1" max="100" placeholder="e.g. 25" oninput="updateMaterialTotal('${surface}')">
    </div>
    <div class="field" style="justify-content:flex-end">
      <button type="button" class="btn-remove" onclick="removeMaterialRow('${surface}', ${n})">Remove</button>
    </div>`;
  c.appendChild(div);
  updateMaterialTotal(surface);
}

function removeMaterialRow(surface, n) {
  document.getElementById(`${surface}-mat-${n}`)?.remove();
  // Note: counts[surface] is left as-is (highest n used) — validateStep/collect loops
  // check element existence, so a removed middle row is simply skipped.
  updateMaterialTotal(surface);
}

function updateMaterialTotal(surface) {
  const counts = ensureMaterialCounts();
  const count = counts[surface];
  let total = 0;
  for (let i = 1; i <= count; i++) {
    const el = document.getElementById(`home-${surface}${i}-pct`);
    if (el && document.body.contains(el) && el.value) total += parseFloat(el.value) || 0;
  }
  const totalEl = document.getElementById(`${surface}-total`);
  if (totalEl) {
    totalEl.textContent = `Total: ${total}%`;
    totalEl.style.color = total === 100 ? 'var(--green)' : 'var(--red)';
  }
  const addBtn = document.getElementById(`${surface}-add-btn`);
  if (addBtn) {
    addBtn.style.display = (total < 100 && count < 4) ? '' : 'none';
  }
}

// ══════════════════════════════════════════
// HOME LOSS REPEATER
// ══════════════════════════════════════════
function addHomeLoss() {
  state.homeLossCount++;
  const n = state.homeLossCount;
  const c = document.getElementById('home-losses-container');
  const div = document.createElement('div');
  div.className = 'repeater-item';
  div.id = `hl-${n}`;
  div.innerHTML = `
    <div class="repeater-header">
      <div class="repeater-title">Loss ${n}</div>
      <button class="btn-remove" onclick="removeItem('hl-${n}')">Remove</button>
    </div>
    <div class="field-grid">
      <div class="field"><label>Date of Loss</label><input type="date" id="hl${n}-date"></div>
      <div class="field"><label>Type of Loss</label>
        <select id="hl${n}-type">
          <option>Wind/Hail</option><option>Water/Flood</option><option>Fire</option>
          <option>Theft</option><option>Liability</option><option>Other</option>
        </select>
      </div>
      <div class="field"><label>Amount Paid</label><input type="text" id="hl${n}-amount" placeholder="$5,000"></div>
      <div class="field"><label>Status</label>
        <select id="hl${n}-status">
          <option>Closed</option><option>Open</option>
        </select>
      </div>
    </div>`;
  c.appendChild(div);
}

// ══════════════════════════════════════════
// REMOVE ITEM
// ══════════════════════════════════════════
function removeItem(id) {
  document.getElementById(id)?.remove();
}

// ══════════════════════════════════════════
// HOME TYPE → DETAILS VISIBILITY
// Called by renderStep() when entering home-details,
// and by the home-type onchange handler on the type screen.
// ══════════════════════════════════════════
function applyHomeTypeToDetails() {
  const type = document.getElementById('home-type')?.value || '';
  const isRenters = type === 'Renters (HO-4)';
  const isHO3     = type === 'Homeowners (HO-3)';

  // Owner-only fields (property structure details)
  const ownerFields = document.getElementById('owner-fields');
  if (ownerFields) ownerFields.style.display = isRenters ? 'none' : 'block';

  // Purchase date only for HO-3
  const purchaseDateField = document.getElementById('home-purchase-date-field');
  if (purchaseDateField) purchaseDateField.style.display = isHO3 ? 'block' : 'none';
}

// ══════════════════════════════════════════
// CONDITIONAL ALERTS
// ══════════════════════════════════════════
function checkRideshare() {
  const v = document.getElementById('auto-rideshare')?.value;
  document.getElementById('rideshare-alert')?.classList.toggle('hidden', v !== 'Yes');
}

function handleHomeLienholder() {
  const val = document.getElementById('home-lienholder').value;
  document.getElementById('home-lienholder-block').style.display = val === 'Yes' ? 'block' : 'none';
}

function checkRoofAge() {
  const yr = parseInt(document.getElementById('home-roof-year')?.value);
  const age = new Date().getFullYear() - yr;
  document.getElementById('roof-age-alert')?.classList.toggle('hidden', isNaN(age) || age < 15);
}

function checkKnobTube() {
  document.getElementById('knob-tube-alert')?.classList.toggle('hidden',
    document.getElementById('home-knob-tube').value !== 'Yes');
}
function checkFuseBox() {
  document.getElementById('fuse-box-alert')?.classList.toggle('hidden',
    document.getElementById('home-fuse').value !== 'Yes');
}
function checkPool() {
  document.getElementById('pool-alert')?.classList.toggle('hidden',
    document.getElementById('home-pool').value !== 'Yes - Unfenced');
}
function checkTrampoline() {
  document.getElementById('trampoline-alert')?.classList.toggle('hidden',
    document.getElementById('home-trampoline').value !== 'Yes - Open');
}
function checkDog() {
  const v = document.getElementById('home-dog').value;
  document.getElementById('dog-breed-field').style.display = v === 'Yes' ? 'block' : 'none';
  document.getElementById('dog-alert')?.classList.toggle('hidden', v !== 'Yes');
}
function checkHomeBusiness() {
  document.getElementById('home-business-alert')?.classList.toggle('hidden',
    document.getElementById('home-business').value !== 'Yes');
}

function handleHomeAlarm() {
  const val = document.getElementById('home-alarm')?.value;
  const field = document.getElementById('home-alarm-company-field');
  if (field) field.style.display = val && val !== 'No' ? 'block' : 'none';
}

function checkTobacco() {
  document.getElementById('tobacco-alert')?.classList.toggle('hidden',
    document.getElementById('life-tobacco').value !== 'Yes');
}

function toggleAddCov(key) {
  const cb = document.getElementById(`home-addcov-${key}`);
  const detail = document.getElementById(`home-addcov-${key}-detail`);
  if (!cb || !detail) return;
  detail.classList.toggle('hidden', !cb.checked);
  if (!cb.checked) {
    const input = document.getElementById(`home-addcov-${key}-val`);
    if (input) input.value = '';
  }
}

function updateDirectionsCount(el) {
  const counter = document.getElementById('home-directions-count');
  if (counter) counter.textContent = `${el.value.length} / 1000`;
}

// ══════════════════════════════════════════
// MEDICARE TOGGLES
// ══════════════════════════════════════════
function handleMedicareAB() {
  const val = document.getElementById('life-medicare-ab')?.value;
  const isYes = val === 'Yes';
  const partA = document.getElementById('life-medicare-parta-field');
  const partB = document.getElementById('life-medicare-partb-field');
  if (partA) partA.style.display = isYes ? 'block' : 'none';
  if (partB) partB.style.display = isYes ? 'block' : 'none';
}

function handleMedicaid() {
  const val = document.getElementById('life-medicaid')?.value;
  const el = document.getElementById('life-medicaid-num-field');
  if (el) el.style.display = val === 'Yes' ? 'block' : 'none';
}

function handleLIS() {
  const val = document.getElementById('life-lis')?.value;
  const el = document.getElementById('life-lis-level-field');
  if (el) el.style.display = val === 'Yes' ? 'block' : 'none';
}

function handlePartD() {
  const val = document.getElementById('life-partd')?.value;
  const el = document.getElementById('life-partd-company-field');
  if (el) el.style.display = val === 'Yes' ? 'block' : 'none';
}

function handleGroupCov() {
  const val = document.getElementById('life-group-cov')?.value;
  const isYes = val === 'Yes';
  ['life-group-company-field', 'life-group-policy-field', 'life-group-term-field'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = isYes ? 'block' : 'none';
  });
}
