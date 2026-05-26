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
// CONDITIONAL ALERTS
// ══════════════════════════════════════════
function handleCurrentInsured() {
  const val = document.getElementById('app-currently-insured').value;
  document.getElementById('prior-carrier-field').style.display = val === 'Yes' ? 'block' : 'none';
  document.getElementById('prior-expiry-field').style.display = val === 'Yes' ? 'block' : 'none';
  document.getElementById('lapse-field').style.display = val === 'No' ? 'block' : 'none';
  document.getElementById('lapse-alert').classList.toggle('hidden', val !== 'No');
}

function checkRideshare() {
  const v = document.getElementById('auto-rideshare')?.value;
  document.getElementById('rideshare-alert')?.classList.toggle('hidden', v !== 'Yes');
}

document.getElementById('auto-sr22')?.addEventListener('change', function() {
  document.getElementById('sr22-reason-field').style.display = this.value === 'Yes' ? 'block' : 'none';
  document.getElementById('sr22-alert')?.classList.toggle('hidden', this.value !== 'Yes');
});

function handleHomeType() {
  const val = document.getElementById('home-type').value;
  const ownerFields = document.getElementById('owner-fields');
  ownerFields.style.display = val === 'Renters (HO-4)' ? 'none' : 'block';
  const purchaseDateField = document.getElementById('home-purchase-date-field');
  if (purchaseDateField) purchaseDateField.style.display = val === 'Homeowners (HO-3)' ? 'block' : 'none';
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
  document.getElementById('knob-tube-alert')?.classList.toggle('hidden', document.getElementById('home-knob-tube').value !== 'Yes');
}
function checkFuseBox() {
  document.getElementById('fuse-box-alert')?.classList.toggle('hidden', document.getElementById('home-fuse').value !== 'Yes');
}
function checkPool() {
  document.getElementById('pool-alert')?.classList.toggle('hidden', document.getElementById('home-pool').value !== 'Yes - Unfenced');
}
function checkTrampoline() {
  document.getElementById('trampoline-alert')?.classList.toggle('hidden', document.getElementById('home-trampoline').value !== 'Yes - Open');
}
function checkDog() {
  const v = document.getElementById('home-dog').value;
  document.getElementById('dog-breed-field').style.display = v === 'Yes' ? 'block' : 'none';
  document.getElementById('dog-alert')?.classList.toggle('hidden', v !== 'Yes');
}
function checkHomeBusiness() {
  document.getElementById('home-business-alert')?.classList.toggle('hidden', document.getElementById('home-business').value !== 'Yes');
}

function handleHomeAlarm() {
  const val = document.getElementById('home-alarm')?.value;
  const field = document.getElementById('home-alarm-company-field');
  if (field) field.style.display = val && val !== 'No' ? 'block' : 'none';
}
function checkJewelry() {
  // No-op: jewelry is now handled by the Additional Coverages checklist
}
function checkTobacco() {
  document.getElementById('tobacco-alert')?.classList.toggle('hidden', document.getElementById('life-tobacco').value !== 'Yes');
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