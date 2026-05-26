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

  // Collect flags (same logic as buildReview)
  const flags = [];
  if (v('app-currently-insured') === 'No') flags.push('Coverage lapse — document reason');
  if (v('auto-sr22') === 'Yes') flags.push('SR-22 required — confirm carrier filing');
  if (v('auto-rideshare') === 'Yes') flags.push('Rideshare use — verify endorsement');
  for (let i = 1; i <= state.vehicleCount; i++) {
    const own = v(`v${i}-ownership`);
    if (own === 'Financed' || own === 'Leased') {
      const label = [v(`v${i}-year`), v(`v${i}-make`), v(`v${i}-model`)].filter(Boolean).join(' ') || `Vehicle ${i}`;
      flags.push(`${label}: Lienholder — Comp/Coll required`);
    }
  }
  for (let i = 1; i <= state.driverCount; i++) {
    const acc = parseInt(v(`d${i}-accidents`));
    const vio = parseInt(v(`d${i}-violations`));
    const dui = v(`d${i}-dui`);
    if (acc > 0 || vio > 0 || dui === 'Yes') {
      flags.push(`${v(`d${i}-first`) || `Driver ${i}`}: Incident history flagged`);
    }
  }
  if (v('home-pool') === 'Yes - Unfenced') flags.push('Unfenced pool — liability risk');
  if (v('home-knob-tube') === 'Yes') flags.push('Knob & tube wiring — verify eligibility');
  if (v('home-fuse') === 'Yes') flags.push('Fuse box — some carriers restrict');
  if (v('home-dog') === 'Yes') flags.push(`Dog on premises (${v('home-dog-breed') || 'breed unknown'}) — check restricted breed list`);
  if (v('life-tobacco') === 'Yes') flags.push('Tobacco use — smoker rates apply');
  const roofYr = parseInt(v('home-roof-year'));
  if (!isNaN(roofYr) && (new Date().getFullYear() - roofYr) >= 15) flags.push('Roof age 15+ years — may require inspection');

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
  html += `<div class="pd-section">
    ${sectionHeader('Applicant Information')}
    <div class="pd-grid">
      ${row('First Name', v('app-first'))}
      ${row('Last Name', v('app-last'))}
      ${row('Date of Birth', v('app-dob'))}
      ${row('SSN / Last 4', v('app-ssn'))}
      ${row('Phone', v('app-phone'))}
      ${row('Email', v('app-email'))}
      ${row('Address', v('app-addr1'))}
      ${row('City', v('app-city'))}
      ${row('State', v('app-state'))}
      ${row('ZIP', v('app-zip'))}
      ${row('Currently Insured', v('app-currently-insured'), v('app-currently-insured') === 'No')}
      ${row('Prior Carrier', v('app-prior-carrier'))}
      ${row('Policy Expiration', v('app-prior-expiry'))}
      ${row('Lapse Reason', v('app-lapse-reason'), !!v('app-lapse-reason'))}
    </div>
  </div>`;

  // ── PERSONAL AUTO
  if (lobs.includes('auto')) {
    html += `<div class="pd-section">${sectionHeader('🚗  Personal Auto', true)}`;

    // Vehicles
    for (let i = 1; i <= state.vehicleCount; i++) {
      if (!document.getElementById(`v${i}-year`)) continue;
      const label = [v(`v${i}-year`), v(`v${i}-make`), v(`v${i}-model`)].filter(Boolean).join(' ') || `Vehicle ${i}`;
      const isLien = v(`v${i}-ownership`) === 'Financed' || v(`v${i}-ownership`) === 'Leased';
      const isCommute = v(`v${i}-use`) === 'Commute';
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
        ${row('Comp Deductible', v(`v${i}-comp`))}
          ${row('Glass Coverage', v(`v${i}-glass`))}
        ${row('Coll Deductible', v(`v${i}-coll`))}
        ${row('GAP', v(`v${i}-gap`))}
      </div>`;
    }

    // Drivers
    for (let i = 1; i <= state.driverCount; i++) {
      if (!document.getElementById(`d${i}-first`)) continue;
      const name = [v(`d${i}-first`), v(`d${i}-last`)].filter(Boolean).join(' ') || `Driver ${i}`;
      const hasIncident = parseInt(v(`d${i}-accidents`)) > 0 || parseInt(v(`d${i}-violations`)) > 0 || v(`d${i}-dui`) === 'Yes';
      html += `${subHeader(`Driver ${i} — ${name}`)}
      <div class="pd-grid">
        ${row('Date of Birth', v(`d${i}-dob`))}
        ${row('License #', v(`d${i}-lic`))}
        ${row('License State', v(`d${i}-lic-state`))}
        ${row('Relationship', v(`d${i}-rel`))}
        ${row('Marital Status', v(`d${i}-marital`))}
        ${row('Good Student', v(`d${i}-good-student`))}
        ${row('Accidents (3yr)', v(`d${i}-accidents`), parseInt(v(`d${i}-accidents`)) > 0)}
        ${row('Violations (3yr)', v(`d${i}-violations`), parseInt(v(`d${i}-violations`)) > 0)}
        ${row('DUI/DWI (5yr)', v(`d${i}-dui`), v(`d${i}-dui`) === 'Yes')}
      </div>`;
    }

    // Coverage
    html += `${subHeader('Coverage Selections')}
    <div class="pd-grid">
      ${row('Bodily Injury', v('auto-bi'))}
      ${row('Property Damage', v('auto-pd'))}
      ${row('Uninsured Motorist BI', v('auto-umbi'))}
      ${row('Underinsured Motorist BI', v('auto-uimbi'))}
      ${row('Medical Payments', v('auto-medpay'))}
      ${row('Rental Reimbursement', v('auto-rental'))}
      ${row('Roadside Assistance', v('auto-roadside'))}
      ${row('SR-22', v('auto-sr22'), v('auto-sr22') === 'Yes')}
      ${row('SR-22 Reason', v('auto-sr22-reason'))}
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
    const meds = collectMedications();
    if (meds.length > 0) {
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