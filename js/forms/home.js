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
// ══════════════════════════════════════════
// ADDITIONAL INSUREDS
// ══════════════════════════════════════════
if (!window.additionalInsuredCount) window.additionalInsuredCount = 0;
const MAX_ADDITIONAL_INSUREDS = 3;

function handleAdditionalInsureds() {
  const val = document.getElementById('additional-insureds-toggle')?.value;
  const container = document.getElementById('additional-insureds-container');
  const list = document.getElementById('additional-insureds-list');
  const btn = document.getElementById('add-insured-btn');
  if (!container || !list || !btn) return;

  if (val === 'Yes') {
    container.style.display = 'block';
    if (list.children.length === 0) {
      window.additionalInsuredCount = 0;
      addAdditionalInsured();
    }
  } else {
    container.style.display = 'none';
    list.innerHTML = '';
    window.additionalInsuredCount = 0;
    btn.style.display = 'none';
  }
}

function addAdditionalInsured() {
  if (window.additionalInsuredCount >= MAX_ADDITIONAL_INSUREDS) return;
  window.additionalInsuredCount++;
  const n = window.additionalInsuredCount;
  const list = document.getElementById('additional-insureds-list');
  const div = document.createElement('div');
  div.className = 'repeater-item';
  div.id = `ai-${n}`;
  div.innerHTML = `
    <div class="repeater-header">
      <div class="repeater-title">Additional Insured ${n}</div>
      ${n > 1 ? `<button class="btn-remove" onclick="removeAdditionalInsured(${n})">Remove</button>` : ''}
    </div>
    <div class="field-grid">
      <div class="field">
        <label>First Name <span class="req">*</span></label>
        <input type="text" id="ai${n}-first" placeholder="Jane">
      </div>
      <div class="field">
        <label>Last Name <span class="req">*</span></label>
        <input type="text" id="ai${n}-last" placeholder="Smith">
      </div>
      <div class="field">
        <label>Date of Birth <span class="req">*</span></label>
        <input type="date" id="ai${n}-dob">
      </div>
      <div class="field">
        <label>SSN / Last 4 <span class="flag">⚡ for rating</span></label>
        <input type="text" id="ai${n}-ssn" placeholder="XXX-XX-1234" maxlength="11">
      </div>
      <div class="field">
        <label>Phone</label>
        <input type="tel" id="ai${n}-phone" placeholder="(555) 000-0000">
      </div>
      <div class="field">
        <label>Email</label>
        <input type="email" id="ai${n}-email" placeholder="jane@email.com">
      </div>
      <div class="field">
        <label>Relationship to Primary</label>
        <select id="ai${n}-relationship">
          <option value="">-- Select --</option>
          <option>Spouse</option>
          <option>Domestic Partner</option>
          <option>Child</option>
          <option>Parent</option>
          <option>Sibling</option>
          <option>Other</option>
        </select>
      </div>
    </div>`;
  list.appendChild(div);

  const btn = document.getElementById('add-insured-btn');
  if (btn) {
    btn.style.display = window.additionalInsuredCount < MAX_ADDITIONAL_INSUREDS ? 'block' : 'none';
  }
}

function removeAdditionalInsured(n) {
  document.getElementById(`ai-${n}`)?.remove();
  window.additionalInsuredCount--;
  const btn = document.getElementById('add-insured-btn');
  if (btn) btn.style.display = window.additionalInsuredCount < MAX_ADDITIONAL_INSUREDS ? 'block' : 'none';
}
