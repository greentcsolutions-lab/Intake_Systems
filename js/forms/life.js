// ══════════════════════════════════════════
// LIFE / HEALTH — MEDICATIONS
// ══════════════════════════════════════════
const MED_TYPES_REQUIRING_MEDS = [
  'Health / ACA', 'Medicare Supplement', 'Medicare Advantage'
];

const COMMON_MEDICATIONS = [
'Albuterol (ProAir/Ventolin)',
'Alendronate (Fosamax)',
'Alprazolam (Xanax)',
'Amlodipine (Norvasc)',
'Amoxicillin',
'Amphetamine / Dextroamphetamine (Adderall)',
'Apixaban (Eliquis)',
'Aripiprazole (Abilify)',
'Atorvastatin (Lipitor)',
'Bupropion (Wellbutrin)',
'Carvedilol (Coreg)',
'Clonazepam (Klonopin)',
'Clopidogrel (Plavix)',
'Cyclobenzaprine (Flexeril)',
'Duloxetine (Cymbalta)',
'Escitalopram (Lexapro)',
'Finasteride (Proscar)',
'Fluticasone (Flonase)',
'Furosemide (Lasix)',
'Gabapentin (Neurontin)',
'Hydrochlorothiazide',
'Hydrocodone / Acetaminophen (Vicodin)',
'Hydroxychloroquine (Plaquenil)',
'Insulin Aspart (NovoLog)',
'Insulin Glargine (Lantus)',
'Levothyroxine (Synthroid)',
'Lisinopril',
'Losartan (Cozaar)',
'Meloxicam (Mobic)',
'Metformin',
'Methotrexate',
'Methylphenidate (Ritalin)',
'Metoprolol',
'Montelukast (Singulair)',
'Omeprazole (Prilosec)',
'Oxycodone',
'Pantoprazole (Protonix)',
'Prednisone',
'Quetiapine (Seroquel)',
'Rivaroxaban (Xarelto)',
'Rosuvastatin (Crestor)',
'Sertraline (Zoloft)',
'Simvastatin (Zocor)',
'Tamsulosin (Flomax)',
'Topiramate (Topamax)',
'Tramadol',
'Trazodone',
'Venlafaxine (Effexor)',
'Warfarin (Coumadin)',
'Zolpidem (Ambien)',
  'Other (specify in notes)',
];

const MED_OPTIONS_HTML = COMMON_MEDICATIONS.map(m => `<option value="${m}">${m}</option>`).join('');

function handleLifeType() {
  const type = document.getElementById('life-type')?.value;
  const block = document.getElementById('life-meds-block');
  if (!block) return;
  const needsMeds = MED_TYPES_REQUIRING_MEDS.includes(type);
  block.style.display = needsMeds ? 'block' : 'none';
  // Auto-add first medication row if opening for first time
  if (needsMeds && document.getElementById('medications-container').children.length === 0) {
    addMedication();
  }
}

function addMedication() {
  if (!window.medCount) window.medCount = 0;
  window.medCount++;
  const n = window.medCount;
  const c = document.getElementById('medications-container');
  const div = document.createElement('div');
  div.className = 'repeater-item';
  div.id = `med-${n}`;
  div.innerHTML = `
    <div class="repeater-header">
      <div class="repeater-title">Medication ${n}</div>
      <button class="btn-remove" onclick="removeItem('med-${n}')">Remove</button>
    </div>
    <div class="field-grid three">
      <div class="field">
        <label>Medication Name <span class="req">*</span></label>
        <select id="med${n}-name">
          <option value="">-- Select --</option>
          ${MED_OPTIONS_HTML}
        </select>
      </div>
      <div class="field">
        <label>Dosage <span class="req">*</span></label>
        <input type="text" id="med${n}-dosage" placeholder="e.g. 10mg">
      </div>
      <div class="field">
        <label>Frequency</label>
        <select id="med${n}-freq">
          <option value="">-- Select --</option>
          <option>Once daily</option>
          <option>Twice daily</option>
          <option>Three times daily</option>
          <option>Four times daily</option>
          <option>Every other day</option>
          <option>Weekly</option>
          <option>As needed (PRN)</option>
        </select>
      </div>
      <div class="field">
        <label>Prescribing Condition</label>
        <input type="text" id="med${n}-condition" placeholder="e.g. Hypertension, Diabetes">
      </div>
      <div class="field">
        <label>How Long Taking?</label>
        <input type="text" id="med${n}-duration" placeholder="e.g. 2 years">
      </div>
    </div>`;
  c.appendChild(div);
}

function collectMedications() {
  if (!window.medCount) return [];
  const meds = [];
  for (let i = 1; i <= window.medCount; i++) {
    const nameEl = document.getElementById(`med${i}-name`);
    if (!nameEl) continue;
    const name = nameEl.value;
    if (!name) continue;
    meds.push({
      name,
      dosage: document.getElementById(`med${i}-dosage`)?.value || '',
      freq: document.getElementById(`med${i}-freq`)?.value || '',
      condition: document.getElementById(`med${i}-condition`)?.value || '',
      duration: document.getElementById(`med${i}-duration`)?.value || '',
    });
  }
  return meds;
}
