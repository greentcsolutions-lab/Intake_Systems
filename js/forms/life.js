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

const LIFE_PRODUCTS  = ['Term Life', 'Whole Life', 'Universal Life', 'Final Expense'];
const HEALTH_PRODUCTS = ['Health / ACA', 'Medicare Supplement', 'Medicare Advantage', 'Dental / Vision'];

const MEDICARE_PRODUCTS = ['Medicare Supplement', 'Medicare Advantage', 'Health / ACA'];

function handleLifeType() {
  const type = document.getElementById('life-type')?.value;

  const isLife      = LIFE_PRODUCTS.includes(type);
  const isHealth    = HEALTH_PRODUCTS.includes(type);
  const isTerm      = type === 'Term Life';
  const needsMeds   = MED_TYPES_REQUIRING_MEDS.includes(type);
  const isMedicare  = MEDICARE_PRODUCTS.includes(type);

  // Life-only fields
  const lifeGroup = document.getElementById('life-fields-group');
  if (lifeGroup) lifeGroup.style.display = isLife ? 'block' : 'none';

  // Term length — only for Term Life
  const termField = document.getElementById('life-term-field');
  if (termField) termField.style.display = isTerm ? 'block' : 'none';

  // Shared fields (height/weight/tobacco/conditions/notes) — both Life and Health
  const sharedGroup = document.getElementById('life-shared-group');
  if (sharedGroup) sharedGroup.style.display = (isLife || isHealth) ? 'block' : 'none';

  // Medications block — Health only, specific products
  const medsBlock = document.getElementById('life-meds-block');
  if (medsBlock) medsBlock.style.display = needsMeds ? 'block' : 'none';
  if (needsMeds && document.getElementById('medications-container').children.length === 0) {
    addMedication();
  }

  // Medicare sub-section
  const medicareGroup = document.getElementById('life-medicare-group');
  if (medicareGroup) medicareGroup.style.display = isMedicare ? 'block' : 'none';

  // Current plan detail blocks — mutually exclusive
  const suppBlock = document.getElementById('life-current-supp-block');
  const advBlock  = document.getElementById('life-current-adv-block');
  const acaBlock  = document.getElementById('life-current-aca-block');
  if (suppBlock) suppBlock.style.display = type === 'Medicare Supplement' ? 'block' : 'none';
  if (advBlock)  advBlock.style.display  = type === 'Medicare Advantage'  ? 'block' : 'none';
  if (acaBlock)  acaBlock.style.display  = type === 'Health / ACA'        ? 'block' : 'none';
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

function toggleMedPCP() {
  const cb      = document.getElementById('med-pcp-toggle');
  const alert   = document.getElementById('med-pcp-alert');
  const addBtn  = document.getElementById('med-add-btn');
  const container = document.getElementById('medications-container');
  if (!cb) return;
  const locked = cb.checked;

  // Show/hide alert
  if (alert) alert.classList.toggle('hidden', !locked);

  // Disable/enable Add button
  if (addBtn) {
    addBtn.disabled = locked;
    addBtn.style.opacity = locked ? '0.4' : '1';
    addBtn.style.cursor  = locked ? 'not-allowed' : 'pointer';
  }

  // Gray out / restore all existing med rows
  container?.querySelectorAll('.repeater-item').forEach(row => {
    row.classList.toggle('med-locked', locked);
    row.querySelectorAll('input, select, button').forEach(el => {
      el.disabled = locked;
    });
  });
}

function collectMedications() {
  // If PCP toggle is active, suppress all med rows from output
  if (document.getElementById('med-pcp-toggle')?.checked) return [];
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
