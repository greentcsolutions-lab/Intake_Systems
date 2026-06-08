// ══════════════════════════════════════════
// STEP VALIDATION
// ══════════════════════════════════════════
function validateStep() {
  const key = state.steps[state.currentStepIndex];
  const panelId = key === 'applicant' ? 'step-applicant' :
                  key === 'review'    ? 'step-review'    :
                  (typeof LOB_META !== 'undefined' && LOB_META[key]?.step) || `step-${key}`;
  const panel = document.getElementById(panelId);
  if (!panel) return true;

  // Clear prior errors
  panel.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  panel.querySelectorAll('.field-error-msg').forEach(el => el.remove());
  const oldBanner = panel.querySelector('.validation-banner');
  if (oldBanner) oldBanner.remove();

  const errors = [];

  // ── helper: flag a field invalid by element ID ──
  function flagById(id, labelText) {
    const input = document.getElementById(id);
    if (!input) return;
    if (input.offsetParent === null) return; // hidden ancestor
    if (!input.value.trim()) {
      const fieldDiv = input.closest('.field');
      if (fieldDiv && !errors.find(e => e.fieldDiv === fieldDiv)) {
        errors.push({ labelText, fieldDiv });
      }
    }
  }

  // ── helper: scan a container for * labels (static fields) ──
  function scanContainer(container) {
    container.querySelectorAll('label').forEach(label => {
      if (!label.querySelector('.req')) return;
      const labelText = Array.from(label.childNodes)
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .filter(Boolean)
        .join(' ')
        .trim();
      const fieldDiv = label.closest('.field');
      if (!fieldDiv) return;
      const input = fieldDiv.querySelector('input, select, textarea');
      if (!input) return;
      if (input.offsetParent === null) return;
      if (!input.value.trim()) {
        if (!errors.find(e => e.fieldDiv === fieldDiv)) {
          errors.push({ labelText, fieldDiv });
        }
      }
    });
  }

  // ══════════════════════════════════════════
  // APPLICANT
  // ══════════════════════════════════════════
  if (key === 'applicant') {
    scanContainer(panel);
  }

  // ══════════════════════════════════════════
  // AUTO
  // ══════════════════════════════════════════
  else if (key === 'auto') {
    // Per-vehicle: Year, Make, Model required (have * markers via addVehicle)
    // Comp & Coll required when Financed or Leased
    for (let i = 1; i <= state.vehicleCount; i++) {
      if (!document.getElementById(`v${i}-year`)) continue;
      flagById(`v${i}-year`,  `Vehicle ${i} — Year`);
      flagById(`v${i}-make`,  `Vehicle ${i} — Make`);
      flagById(`v${i}-model`, `Vehicle ${i} — Model`);
      const ownership = document.getElementById(`v${i}-ownership`)?.value;
      if (ownership === 'Financed' || ownership === 'Leased') {
        const vLabel = [
          document.getElementById(`v${i}-year`)?.value,
          document.getElementById(`v${i}-make`)?.value,
          document.getElementById(`v${i}-model`)?.value,
        ].filter(Boolean).join(' ') || `Vehicle ${i}`;
        flagById(`v${i}-comp`, `${vLabel} — Comprehensive (lender required)`);
        flagById(`v${i}-coll`, `${vLabel} — Collision (lender required)`);
      }
    }
    // Static * fields: BI Liability, Property Damage
    scanContainer(panel);
  }

  if (errors.length === 0) return true;

  // ── Inline errors ──
  errors.forEach(({ fieldDiv, labelText }) => {
    if (!fieldDiv) return;
    fieldDiv.classList.add('field-error');
    if (!fieldDiv.querySelector('.field-error-msg')) {
      const msg = document.createElement('div');
      msg.className = 'field-error-msg';
      msg.textContent = `${labelText} is required`;
      fieldDiv.appendChild(msg);
    }
  });

  // ── Banner ──
  const firstCard = panel.querySelector('.card');
  if (firstCard) {
    const banner = document.createElement('div');
    banner.className = 'validation-banner';
    banner.innerHTML = `<strong>Please complete all required fields before continuing:</strong><ul>${
      errors.map(e => `<li>${e.labelText}</li>`).join('')
    }</ul>`;
    firstCard.insertBefore(banner, firstCard.firstChild);
    banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return false;
}

// ══════════════════════════════════════════
// COLLECT DATA
// ══════════════════════════════════════════
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function collectAllData() {
  const data = {};

  // Applicant
  data['First Name'] = val('app-first');
  data['Last Name'] = val('app-last');
  data['DOB'] = val('app-dob');
  data['SSN/Last4'] = val('app-ssn');
  data['Phone'] = val('app-phone');
  data['Email'] = val('app-email');
  data['Address'] = val('app-addr1');
  data['City'] = val('app-city');
  data['State'] = val('app-state');
  data['ZIP'] = val('app-zip');
  // Per-LOB carrier info
  const carrierLOBs = { auto: 'Auto', home: 'Home', life: 'Life' };
  state.selectedLOBs.forEach(lob => {
    const l = carrierLOBs[lob] || lob;
    data[`${l} Currently Insured`]  = val(`${lob}-currently-insured`);
    data[`${l} Carrier Name`]       = val(`${lob}-carrier-name`);
    data[`${l} Policy Number`]      = val(`${lob}-carrier-policy`);
    data[`${l} Expiration Date`]    = val(`${lob}-carrier-expiry`);
    data[`${l} Current Premium`]    = val(`${lob}-carrier-premium`);
    data[`${l} Lapse Reason`]       = val(`${lob}-carrier-lapse`);
  });
  data['Lines of Business'] = state.selectedLOBs.join(', ');
  data['Submission Date'] = new Date().toLocaleDateString();
  data['Submission Time'] = new Date().toLocaleTimeString();

  // Auto
  if (state.selectedLOBs.includes('auto')) {
    for (let i = 1; i <= state.vehicleCount; i++) {
      const prefix = `Veh${i}`;
      if (!document.getElementById(`v${i}-year`)) continue;
      data[`${prefix} Year`] = val(`v${i}-year`);
      data[`${prefix} Make`] = val(`v${i}-make`);
      data[`${prefix} Model`] = val(`v${i}-model`);
      data[`${prefix} VIN`] = val(`v${i}-vin`);
      data[`${prefix} Miles`] = val(`v${i}-miles`);
      data[`${prefix} Use`] = val(`v${i}-use`);
      data[`${prefix} Commute Days/Wk`] = val(`v${i}-commute-days`);
      data[`${prefix} Commute One-Way (mi)`] = val(`v${i}-commute-dist`);
      data[`${prefix} Annual Miles`] = val(`v${i}-commute-calc`) || val(`v${i}-miles`);
      data[`${prefix} Ownership`] = val(`v${i}-ownership`);
      data[`${prefix} Lender`] = val(`v${i}-lender`);
      data[`${prefix} Comp`] = val(`v${i}-comp`);
      data[`${prefix} Glass`] = val(`v${i}-glass`) || 'No';
      data[`${prefix} Coll`] = val(`v${i}-coll`);
      data[`${prefix} GAP`] = val(`v${i}-gap`);
    }
    for (let i = 1; i <= state.driverCount; i++) {
      const prefix = `Drv${i}`;
      if (!document.getElementById(`d${i}-first`)) continue;
      data[`${prefix} Name`] = `${val(`d${i}-first`)} ${val(`d${i}-last`)}`;
      data[`${prefix} DOB`] = val(`d${i}-dob`);
      data[`${prefix} License`] = val(`d${i}-lic`);
      data[`${prefix} Accidents`] = val(`d${i}-accidents`);
      data[`${prefix} Violations`] = val(`d${i}-violations`);
      data[`${prefix} DUI`] = val(`d${i}-dui`);
    }
    data['Auto BI'] = val('auto-bi');
    data['Auto PD'] = val('auto-pd');
    data['Auto UM BI'] = val('auto-umbi');
    data['Auto UIM BI'] = val('auto-uimbi');
    data['Auto MedPay'] = val('auto-medpay');
    data['Auto Rental'] = val('auto-rental');

    data['Auto SR22'] = val('auto-sr22');
    data['Auto Rideshare'] = val('auto-rideshare');
  }

  // Home
  if (state.selectedLOBs.includes('home')) {
    data['Home Type'] = val('home-type');
    data['Home Description'] = val('home-description');
    data['Directions to House'] = val('home-directions');
    data['Purchase Date'] = val('home-purchase-date');
    data['Home Address'] = val('home-addr');
    data['Year Built'] = val('home-year');
    data['Square Footage'] = val('home-sqft');
    data['Construction'] = val('home-construction');
    data['Roof Type'] = val('home-roof-type');
    data['Roof Year'] = val('home-roof-year');
    data['Pool'] = val('home-pool');
    data['Dog'] = val('home-dog');
    data['Dog Breed'] = val('home-dog-breed');
    data['Smoke Detectors'] = val('home-smoke-detectors');
    data['Smoke Detector Type'] = val('home-smoke-type');
    data['Fire Extinguishers'] = val('home-fire-ext');
    data['Security Alarm'] = val('home-alarm');
    data['Alarm Company'] = val('home-alarm-company');
    data['Security Cameras'] = val('home-cameras');
    data['Smart Doorbell'] = val('home-doorbell');
    data['Deadbolt Locks'] = val('home-deadbolts');
    data['Water Shutoff Device'] = val('home-water-shutoff');
    data['Home Mortgage'] = val('home-lienholder');
    data['Home Lender'] = val('home-lender-name');
    data['Home Cov A'] = val('home-cov-a');
    data['Home Cov C'] = val('home-cov-c');
    data['Home Liability'] = val('home-cov-e');
    data['Home Deductible'] = val('home-ded');
    data['Water Backup'] = val('home-water-backup');
    // Additional coverages
    const addCovKeys = ['earthquake','flood','guns','money','jewelry','collectibles'];
    const addCovLabels = {
      earthquake: 'Earthquake', flood: 'Flood', guns: 'Guns/Firearms',
      money: 'Money/Securities', jewelry: 'Jewelry', collectibles: 'Collectibles'
    };
    addCovKeys.forEach(k => {
      const checked = document.getElementById(`home-addcov-${k}`)?.checked;
      data[`AddCov ${addCovLabels[k]}`] = checked ? (val(`home-addcov-${k}-val`) || 'Yes') : 'No';
    });
    data['Home Notes'] = val('home-notes');
  }

  // Life
  if (state.selectedLOBs.includes('life')) {
    data['Life Product'] = val('life-type');
    data['Life Amount'] = val('life-amount');
    data['Life Term'] = val('life-term');
    data['Beneficiary'] = val('life-beneficiary');
    data['Tobacco'] = val('life-tobacco');
    data['Medical Conditions'] = val('life-conditions');
    data['Life Notes'] = val('life-notes');
    const pcpToggled = document.getElementById('med-pcp-toggle')?.checked;
    data['Medications — PCP List'] = pcpToggled ? 'Yes — see notes for contact info' : '';
    const meds = collectMedications();
    data['Medication Count'] = meds.length > 0 ? String(meds.length) : '';
    meds.forEach((m, idx) => {
      const n = idx + 1;
      data[`Med${n} Name`] = m.name;
      data[`Med${n} Dosage`] = m.dosage;
      data[`Med${n} Frequency`] = m.freq;
      data[`Med${n} Condition`] = m.condition;
      data[`Med${n} Duration`] = m.duration;
    });
  }

  return data;
}

// ══════════════════════════════════════════
// COMPUTE FLAGS  (single source of truth)
// Called by both buildReview() and buildPrintDocument()
// ══════════════════════════════════════════
function computeFlags() {
  const flags = [];

  // Coverage lapses (per LOB)
  const lobLabels = { auto: 'Auto', home: 'Home', life: 'Life' };
  state.selectedLOBs.forEach(lob => {
    const label = lobLabels[lob] || lob;
    if (val(`${lob}-currently-insured`) === 'No') {
      flags.push(`${label} coverage lapse — document reason`);
    }
  });

  // Auto — policy-level
  if (val('auto-sr22') === 'Yes') flags.push('SR-22 required — confirm carrier filing');
  if (val('auto-rideshare') === 'Yes') flags.push('Rideshare use — verify endorsement');

  // Auto — per vehicle
  for (let i = 1; i <= state.vehicleCount; i++) {
    if (!document.getElementById(`v${i}-year`)) continue;
    const own = val(`v${i}-ownership`);
    if (own === 'Financed' || own === 'Leased') {
      const vLabel = [val(`v${i}-year`), val(`v${i}-make`), val(`v${i}-model`)].filter(Boolean).join(' ') || `Vehicle ${i}`;
      flags.push(`${vLabel}: Lienholder — Comp/Coll required`);
    }
  }

  // Auto — per driver
  for (let i = 1; i <= state.driverCount; i++) {
    if (!document.getElementById(`d${i}-first`)) continue;
    const acc = parseInt(val(`d${i}-accidents`));
    const vio = parseInt(val(`d${i}-violations`));
    const dui = val(`d${i}-dui`);
    if (acc > 0 || vio > 0 || dui === 'Yes') {
      flags.push(`${val(`d${i}-first`) || `Driver ${i}`}: Incident history flagged`);
    }
  }

  // Home
  if (val('home-pool') === 'Yes - Unfenced') flags.push('Unfenced pool — liability risk');
  if (val('home-knob-tube') === 'Yes') flags.push('Knob & tube wiring — verify eligibility');
  if (val('home-fuse') === 'Yes') flags.push('Fuse box — some carriers restrict');
  if (val('home-dog') === 'Yes') flags.push(`Dog on premises (${val('home-dog-breed') || 'breed unknown'}) — check restricted breed list`);
  const roofYr = parseInt(val('home-roof-year'));
  if (!isNaN(roofYr) && (new Date().getFullYear() - roofYr) >= 15) {
    flags.push('Roof age 15+ years — may require inspection');
  }

  // Life
  if (val('life-tobacco') === 'Yes') flags.push('Tobacco use — smoker rates apply');

  return flags;
}

// ══════════════════════════════════════════
// BUILD REVIEW
// ══════════════════════════════════════════
function buildReview() {
  const data = collectAllData();
  const flags = computeFlags();

  const flagsDiv = document.getElementById('flags-container');
  if (flags.length) {
    flagsDiv.innerHTML = `
      <div class="alert alert-warn" style="margin-bottom:20px">
        <div class="alert-icon">⚠️</div>
        <div>
          <strong>${flags.length} item${flags.length > 1 ? 's' : ''} require attention before quoting</strong>
          <ul style="margin-top:8px;padding-left:16px">
            ${flags.map(f => `<li style="margin-bottom:4px">${f}</li>`).join('')}
          </ul>
        </div>
      </div>`;
  } else {
    flagsDiv.innerHTML = `<div class="alert alert-info" style="margin-bottom:20px"><div class="alert-icon">✅</div><div><strong>No flags detected.</strong> Intake looks clean.</div></div>`;
  }

  // Summary
  const sum = document.getElementById('summary-container');
  sum.innerHTML = '';

  const sections = [
    { title: 'Applicant', keys: ['First Name','Last Name','DOB','Phone','Email','Address','City','State','ZIP','Lines of Business','Submission Date'] },
    ...state.selectedLOBs.map(lob => {
      const l = { auto: 'Auto', home: 'Home', life: 'Life' }[lob] || lob;
      return { title: `${l} — Current Coverage`, keys: [`${l} Currently Insured`, `${l} Carrier Name`, `${l} Policy Number`, `${l} Expiration Date`, `${l} Current Premium`, `${l} Lapse Reason`] };
    }),
    ...(state.selectedLOBs.includes('auto') ? [{ title: 'Personal Auto — Coverage', keys: ['Auto BI','Auto PD','Auto UM BI','Auto UIM BI','Auto MedPay','Auto Rental','Auto SR22','Auto Rideshare'] }] : []),
    ...(state.selectedLOBs.includes('home') ? [{ title: 'Home / Renters', keys: ['Home Type','Purchase Date','Year Built','Square Footage','Construction','Roof Type','Roof Year','Pool','Dog','Smoke Detectors','Security Alarm','Home Mortgage','Home Lender','Home Cov A','Home Cov C','Home Liability','Home Deductible'] }] : []),
    ...(state.selectedLOBs.includes('bop') ? [{ title: 'BOP', keys: ['Biz Name','Biz Revenue','Biz Employees','BOP GL','BOP Building','BOP BPP'] }] : []),
    ...(state.selectedLOBs.includes('life') ? [{ title: 'Life / Health', keys: ['Life Product','Life Amount','Life Term','Beneficiary','Tobacco','Medical Conditions'] }] : []),
  ];

  sections.forEach(sec => {
    const block = document.createElement('div');
    block.className = 'summary-block';
    const rows = sec.keys.map(k => {
      if (!data[k]) return '';
      const isFlagged = flags.some(f => f.toLowerCase().includes(k.toLowerCase()));
      return `<div class="summary-row">
        <div class="summary-key">${k}</div>
        <div class="summary-val">${data[k]}${isFlagged ? '<span class="summary-flag">⚠️ FLAG</span>' : ''}</div>
      </div>`;
    }).filter(Boolean).join('');
    if (!rows) return;
    block.innerHTML = `<h3>${sec.title}</h3>${rows}`;
    sum.appendChild(block);
  });
}
