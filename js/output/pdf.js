// js/output/pdf.js
// Version 1.0.1 — 2026-07-09


// ══════════════════════════════════════════
// PRINT PDF
// ══════════════════════════════════════════
function row(key, val, flag) {
  if (!val) return '';
  const flagMark = flag ? ' <span class="pd-val flag">⚠</span>' : '';
  return `<div class="pd-cell"><div class="pd-key">${key}</div><div class="pd-val">${val}${flagMark}</div></div>`;
}
function rowFull(key, val) {
  if (!val) return '';
  return `<div class="pd-full"><div class="pd-key">${key}</div><div class="pd-val">${val}</div></div>`;
}
function sectionHeader(title, lob) {
  return `<div class="pd-section-header${lob ? ' lob' : ''}">${title}</div>`;
}
function subHeader(title) {
  return `<div class="pd-sub-header">${title}</div>`;
}

function buildPrintDocument() {
  const v = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const lobs = state.selectedLOBs;

  const flags = computeFlags();

  // ── HEADER
  let html = `
  <div class="pd-header">
    <div>
      <div class="pd-agency">Insurance Intake Receipt</div>
      <div class="pd-sub">Confidential — Agent Use Only</div>
    </div>
    <div class="pd-meta">
      <div>Date: ${new Date().toLocaleDateString()}</div>
      <div>Time: ${new Date().toLocaleTimeString()}</div>
      <div>Lines: ${lobs.map(l => ({auto:'Personal Auto',home:'Home/Renters',life:'Life/Health'}[l]||l)).join(', ')}</div>
    </div>
  </div>
  <div class="pd-client-bar">
    ${v('app-first')} ${v('app-last')} &nbsp;|&nbsp; ${v('app-phone')} &nbsp;|&nbsp; ${v('app-email') || 'No email'} &nbsp;|&nbsp; ${v('app-addr1')}, ${v('app-city')}, ${v('app-state')} ${v('app-zip')}
  </div>
  <div class="pd-body">`;

  // ── FLAGS
  if (flags.length) {
    html += `<div class="pd-flag-bar"><div class="pd-flag-title">⚠ Items Requiring Attention (${flags.length})</div>${flags.map(f => `<div class="pd-flag-item">${f}</div>`).join('')}</div>`;
  }

  // ── APPLICANT SECTION
  const reasonForPolicy = v('app-reason') === 'Other' ? (v('app-reason-other') || 'Other') : v('app-reason');
  const clientType = document.getElementById('app-existing-client')?.checked ? 'Existing Client' : 'New Client';
  html += `<div class="pd-section">
    ${sectionHeader('Applicant Information')}
    <div class="pd-grid">
      ${row('Client Type', clientType)}
      ${row('Reason for Policy', reasonForPolicy)}
      ${row('First Name', v('app-first'))}
      ${row('Last Name', v('app-last'))}
      ${row('Date of Birth', v('app-dob'))}
      ${row('SSN / Last 4', v('app-ssn'))}
      ${row('Phone', v('app-phone'))}
      ${row('Email', v('app-email'))}
      ${row('Referred By', v('app-referred-by'))}
      ${row('Occupation', v('app-occupation'))}
      ${row('Education', v('app-education'))}
      ${row('Total Household Members', v('app-household-total'))}
      ${row('Address', v('app-addr1'))}
      ${row('City', v('app-city'))}
      ${row('State', v('app-state'))}
      ${row('ZIP', v('app-zip'))}
    </div>
  </div>`;

  // ── HOUSEHOLD MEMBERS (account-level — shown regardless of selected LOBs)
  if (state.driverCount > 0) {
    let memberRows = '';
    for (let i = 1; i <= state.driverCount; i++) {
      if (!document.getElementById(`d${i}-first`)) continue;
      const name = [v(`d${i}-first`), v(`d${i}-last`)].filter(Boolean).join(' ') || `Member ${i}`;
      const isSecondInsured = v(`d${i}-second-insured`) === 'Yes';
      memberRows += `${subHeader(`Household Member ${i} — ${name}`)}
      <div class="pd-grid">
        ${row('Date of Birth', v(`d${i}-dob`))}
        ${row('SSN / Last 4', v(`d${i}-ssn`))}
        ${row('License #', v(`d${i}-lic`))}
        ${row('License State', v(`d${i}-lic-state`))}
        ${row('Relationship', v(`d${i}-rel`))}
        ${row('Marital Status', v(`d${i}-marital`))}
        ${row('Good Student', v(`d${i}-good-student`))}
        ${row('Accidents (3yr)', v(`d${i}-accidents`), parseInt(v(`d${i}-accidents`)) > 0)}
        ${row('Violations (3yr)', v(`d${i}-violations`), parseInt(v(`d${i}-violations`)) > 0)}
        ${row('DUI/DWI (5yr)', v(`d${i}-dui`), v(`d${i}-dui`) === 'Yes')}
        ${row('Second Named Insured', v(`d${i}-second-insured`) || 'No', isSecondInsured)}
        ${isSecondInsured ? row('Occupation', v(`d${i}-occupation`)) : ''}
        ${isSecondInsured ? row('Education', v(`d${i}-education`)) : ''}
      </div>`;
    }
    if (memberRows) {
      html += `<div class="pd-section">${sectionHeader('Household Members')}${memberRows}</div>`;
    }
  }

  // ── CURRENT COVERAGE (per LOB)
  if (lobs.length) {
    const carrierLabels = { auto: 'Auto', home: 'Home', life: 'Life' };
    html += `<div class="pd-section">${sectionHeader('Current / Prior Coverage')}`;
    html += `<div class="pd-grid">`;
    lobs.forEach(lob => {
      const label = carrierLabels[lob] || lob;
      const insured  = v(`${lob}-currently-insured`);
      const isLapse  = insured === 'No';
      html += row(`${label} — Insured?`, insured, isLapse);
      if (insured === 'Yes') {
        html += row(`${label} — Carrier`,    v(`${lob}-carrier-name`));
        html += row(`${label} — Policy #`,   v(`${lob}-carrier-policy`));
        html += row(`${label} — Expiration`, v(`${lob}-carrier-expiry`));
        html += row(`${label} — Premium`,    v(`${lob}-carrier-premium`));
      }
      if (isLapse) {
        html += row(`${label} — Lapse Reason`, v(`${lob}-carrier-lapse`), true);
      }
    });
    html += `</div></div>`;
  }

  // ── PERSONAL AUTO
  if (lobs.includes('auto')) {
    html += `<div class="pd-section">${sectionHeader('🚗  Personal Auto', true)}`;

    // Vehicles
    for (let i = 1; i <= state.vehicleCount; i++) {
      if (!document.getElementById(`v${i}-year`)) continue;
      const label = [v(`v${i}-year`), v(`v${i}-make`), v(`v${i}-model`)].filter(Boolean).join(' ') || `Vehicle ${i}`;
      const isLien = v(`v${i}-ownership`) === 'Financed' || v(`v${i}-ownership`) === 'Leased';
      const isCommute = v(`v${i}-use`) === 'Commute';
      const isStorage = v(`v${i}-storage`) === 'Yes';
      html += `${subHeader(`Vehicle ${i} — ${label}`)}
      <div class="pd-grid">
        ${row('VIN', v(`v${i}-vin`))}
        ${row('Garaging ZIP', v(`v${i}-zip`))}
        ${row('Primary Use', v(`v${i}-use`))}
        ${row('Annual Miles', v(`v${i}-commute-calc`) || v(`v${i}-miles`))}
        ${isCommute ? row('Commute Days/Wk', v(`v${i}-commute-days`)) : ''}
        ${isCommute ? row('One-Way Distance', v(`v${i}-commute-dist`) ? v(`v${i}-commute-dist`) + ' mi' : '') : ''}
        ${row('Ownership', v(`v${i}-ownership`), isLien)}
        ${row('Lender', v(`v${i}-lender`))}
        ${row('Storage / Non-Operational', v(`v${i}-storage`) || 'No', isStorage)}
        ${row('Comp Deductible', v(`v${i}-comp`))}
          ${row('Glass Coverage', v(`v${i}-glass`))}
        ${row('Coll Deductible', v(`v${i}-coll`))}
        ${row('GAP', v(`v${i}-gap`))}
      </div>`;
    }

    // Coverage
    const storageVehicles = [];
    for (let i = 1; i <= state.vehicleCount; i++) {
      if (v(`v${i}-storage`) === 'Yes') {
        storageVehicles.push([v(`v${i}-year`), v(`v${i}-make`), v(`v${i}-model`)].filter(Boolean).join(' ') || `Vehicle ${i}`);
      }
    }
    html += `${subHeader('Coverage Selections')}
    ${storageVehicles.length ? rowFull('⚠ Storage / Non-Operational (liability N/A)', storageVehicles.join(', ')) : ''}
    <div class="pd-grid">
      ${row('Bodily Injury', v('auto-bi'))}
      ${row('Property Damage', v('auto-pd'))}
      ${row('Uninsured Motorist BI', v('auto-umbi'))}
      ${row('Underinsured Motorist BI', v('auto-uimbi'))}
      ${row('Medical Payments', v('auto-medpay'))}
      ${row('Rental Reimbursement', v('auto-rental'))}
      ${row('Roadside Assistance', v('auto-roadside'))}
      ${row('SR-22', v('auto-sr22'), v('auto-sr22') === 'Yes')}
      ${v('auto-sr22') === 'Yes' ? row('SR-22 Reason', v('auto-sr22-reason')) : ''}
      ${row('Rideshare', v('auto-rideshare'), v('auto-rideshare') === 'Yes')}
      ${row('Business Use', v('auto-business-use'))}
      ${row('Telematics', v('auto-telematics'))}
    </div></div>`;
  }

  // ── HOME / RENTERS
  if (lobs.includes('home')) {
    html += `<div class="pd-section">${sectionHeader('🏠  Home / Renters', true)}`;
    html += `${subHeader('Property Details')}
    <div class="pd-grid">
      ${row('Policy Type', v('home-type'))}
      ${row('Purchase Date', v('home-purchase-date'))}
      ${row('Property Address', v('home-addr') || v('app-addr1') + ', ' + v('app-city'))}
      ${row('Year Built', v('home-year'))}
      ${row('Square Footage', v('home-sqft') ? v('home-sqft') + ' sq ft' : '')}
      ${row('Construction', v('home-construction'))}
      ${row('Foundation', v('home-foundation'))}
      ${row('Stories', v('home-stories'))}
      ${row('Garage', v('home-garage'))}
      ${row('Heating', v('home-heat'))}
      ${row('Roof Type', v('home-roof-type'))}
      ${row('Roof Year', v('home-roof-year'), !isNaN(parseInt(v('home-roof-year'))) && (new Date().getFullYear() - parseInt(v('home-roof-year'))) >= 15)}
      ${row('Electrical Updated', v('home-electric-updated'))}
      ${row('Plumbing Updated', v('home-plumbing-updated'))}
      ${row('Knob & Tube', v('home-knob-tube'), v('home-knob-tube') === 'Yes')}
      ${row('Fuse Box', v('home-fuse'), v('home-fuse') === 'Yes')}
      ${row('Pool', v('home-pool'), v('home-pool') === 'Yes - Unfenced')}
      ${row('Trampoline', v('home-trampoline'), v('home-trampoline') === 'Yes - Open')}
      ${row('Dog', v('home-dog'), v('home-dog') === 'Yes')}
      ${row('Dog Breed', v('home-dog-breed'), !!v('home-dog-breed'))}
      ${row('Business on Premises', v('home-business'), v('home-business') === 'Yes')}
    </div>
    ${v('home-description') ? `${subHeader('Description of House')}<div class="pd-full">${v('home-description')}</div>` : ''}
    ${v('home-directions') ? `${subHeader('Directions to House')}<div class="pd-full">${v('home-directions')}</div>` : ''}
    ${subHeader('Safety & Security')}
    <div class="pd-grid">
      ${row('Smoke Detectors', v('home-smoke-detectors'))}
      ${row('Smoke Detector Type', v('home-smoke-type'))}
      ${row('Fire Extinguishers', v('home-fire-ext'))}
      ${row('Security Alarm', v('home-alarm'))}
      ${row('Alarm Company', v('home-alarm-company'))}
      ${row('Security Cameras', v('home-cameras'))}
      ${row('Smart Doorbell', v('home-doorbell'))}
      ${row('Deadbolt Locks', v('home-deadbolts'))}
      ${row('Water Shutoff Device', v('home-water-shutoff'))}
    </div>
    ${subHeader('Mortgage / Lienholder')}
    <div class="pd-grid">
      ${row('Lienholder', v('home-lienholder'))}
      ${row('Lender Name', v('home-lender-name'))}
      ${row('Loan Number', v('home-loan-number'))}
      ${row('Lender Address', v('home-lender-addr'))}
    </div>
    ${subHeader('Coverage Selections')}
    <div class="pd-grid">
      ${row('Dwelling (Cov A)', v('home-cov-a'))}
      ${row('Other Structures (Cov B)', v('home-cov-b'))}
      ${row('Personal Property (Cov C)', v('home-cov-c'))}
      ${row('Loss of Use (Cov D)', v('home-cov-d'))}
      ${row('Liability (Cov E)', v('home-cov-e'))}
      ${row('Medical Pmts (Cov F)', v('home-cov-f'))}
      ${row('All-Peril Deductible', v('home-ded'))}
      ${row('Wind/Hail Deductible', v('home-wind-ded'))}
      ${row('Water Backup', v('home-water-backup'))}
    </div>
    ${subHeader('Additional Coverages')}
    <div class="pd-grid">
      ${[
        ['earthquake','Earthquake'],['flood','Flood (NFIP)'],['guns','Guns/Firearms'],
        ['money','Money/Securities'],['jewelry','Jewelry'],['collectibles','Collectibles']
      ].map(([k,label]) => {
        const checked = document.getElementById(`home-addcov-${k}`)?.checked;
        if (!checked) return row(label, 'No');
        const detail = document.getElementById(`home-addcov-${k}-val`)?.value;
        return row(label, detail ? `Yes — ${detail}` : 'Yes');
      }).join('')}
    </div>`;

    // Prior losses
    if (state.homeLossCount > 0) {
      html += subHeader('Prior Losses');
      for (let i = 1; i <= state.homeLossCount; i++) {
        if (!document.getElementById(`hl${i}-date`)) continue;
        html += `<div class="pd-grid">
          ${row(`Loss ${i} Date`, v(`hl${i}-date`))}
          ${row(`Loss ${i} Type`, v(`hl${i}-type`))}
          ${row(`Loss ${i} Amount`, v(`hl${i}-amount`))}
          ${row(`Loss ${i} Status`, v(`hl${i}-status`))}
        </div>`;
      }
    }
    if (v('home-notes')) {
      html += `${subHeader('Agent Notes')}<div class="pd-full" style="white-space:pre-wrap">${v('home-notes')}</div>`;
    }
    html += `</div>`;
  }

  // ── LIFE / HEALTH
  if (lobs.includes('life')) {
    const lifeType = v('life-type');
    const isMedicare = ['Medicare Supplement', 'Medicare Advantage', 'Health / ACA'].includes(lifeType);

    html += `<div class="pd-section">${sectionHeader('❤️  Life / Health', true)}
    <div class="pd-grid">
      ${row('Product Type', v('life-type'))}
      ${row('Coverage Amount', v('life-amount'))}
      ${row('Term Length', v('life-term'))}
      ${row('Beneficiary', v('life-beneficiary'))}
      ${row('Height', v('life-height'))}
      ${row('Weight', v('life-weight') ? v('life-weight') + ' lbs' : '')}
      ${row('Tobacco Use', v('life-tobacco'), v('life-tobacco') === 'Yes')}
      ${row('Medical Conditions', v('life-conditions'), v('life-conditions') !== 'None' && v('life-conditions') !== '')}
    </div>`;

    // Medicare details block
    if (isMedicare) {
      html += `${subHeader('Medicare Details')}
      <div class="pd-grid">
        ${row('Medicare Part A & B', v('life-medicare-ab'))}
        ${row('Part A Effective Date', v('life-medicare-parta'))}
        ${row('Part B Effective Date', v('life-medicare-partb'))}
        ${row('Medicare Claim #', v('life-medicare-claim'))}
        ${row('VA Coverage', v('life-va'))}
        ${row('Medicaid', v('life-medicaid'))}
        ${row('Medicaid #', v('life-medicaid-num'))}
        ${row('Extra Help / LIS', v('life-lis'))}
        ${row('LIS Level', v('life-lis-level'))}
        ${row('Mail Order Pharmacy', v('life-mail-order'))}
        ${row('Preferred Pharmacy', v('life-pharmacy'))}
        ${row('Preferred Hospital', v('life-hospital'))}
        ${row('PCP Name', v('life-pcp-name'))}
        ${row('PCP Office Location', v('life-pcp-location'))}
        ${row('Specialist', v('life-specialist'))}
      </div>`;

      // Current plan details — by product type
      if (lifeType === 'Medicare Supplement') {
        html += `${subHeader('Current Medicare Supplement')}
        <div class="pd-grid">
          ${row('Current Company', v('life-supp-company'))}
          ${row('Plan Type', v('life-supp-plan-type'))}
          ${row('Current Premium', v('life-supp-premium'))}
          ${row('Renewal Date', v('life-supp-renewal'))}
        </div>`;
      }
      if (lifeType === 'Medicare Advantage') {
        html += `${subHeader('Current Medicare Advantage')}
        <div class="pd-grid">
          ${row('Current Company', v('life-adv-company'))}
          ${row('Plan Name', v('life-adv-plan'))}
        </div>`;
      }
      if (lifeType === 'Health / ACA') {
        html += `${subHeader('Current Health / ACA Plan')}
        <div class="pd-grid">
          ${row('Current Company', v('life-aca-company'))}
          ${row('Policy #', v('life-aca-policy'))}
        </div>`;
      }

      // Part D + Group coverage
      html += `${subHeader('Prescription / Part D')}
      <div class="pd-grid">
        ${row('Part D Plan', v('life-partd'))}
        ${row('Part D Company', v('life-partd-company'))}
      </div>
      ${subHeader('Group / Other Coverage')}
      <div class="pd-grid">
        ${row('Group Coverage', v('life-group-cov'))}
        ${row('Group Company', v('life-group-company'))}
        ${row('Group Policy #', v('life-group-policy'))}
        ${row('Termination Date', v('life-group-term'))}
      </div>`;
    }

    const meds = collectMedications();
    const pcpToggled = document.getElementById('med-pcp-toggle')?.checked;
    if (pcpToggled) {
      html += `${subHeader('Current Medications')}<div class="pd-full" style="color:#7a5a00;font-weight:600">⚠ Medication list provided by PCP / Pharmacist — see notes for contact info.</div>`;
    } else if (meds.length > 0) {
      html += subHeader(`Current Medications (${meds.length})`);
      meds.forEach((m, idx) => {
        html += `<div class="pd-grid">
          ${row(`Med ${idx+1}`, m.name)}
          ${row('Dosage', m.dosage)}
          ${row('Frequency', m.freq)}
          ${row('Condition', m.condition)}
          ${row('Duration', m.duration)}
        </div>`;
      });
    }
    if (v('life-notes')) {
      html += `${subHeader('Notes')}<div class="pd-full">${v('life-notes')}</div>`;
    }
    html += `</div>`;
  }

  html += `<div style="margin-top:24px;font-size:10px;color:#7f8c9a;border-top:1px solid #d8d0be;padding-top:10px;">
    This document is confidential and intended for agency use only. Generated ${new Date().toLocaleString()}.
  </div>`;

  html += '</div>'; // close pd-body
  return html;
}

function printPDF() {
  const doc = document.getElementById('print-document');
  doc.innerHTML = buildPrintDocument();
  window.print();
}
