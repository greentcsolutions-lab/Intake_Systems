// ══════════════════════════════════════════
// EXPORT: GOOGLE SHEETS
// ══════════════════════════════════════════
function openSheetsModal() {
  const saved = localStorage.getItem('sheets_url') || '';
  document.getElementById('sheets-url').value = saved;
  document.getElementById('sheetsModal').classList.add('show');
}
function closeSheetsModal() {
  document.getElementById('sheetsModal').classList.remove('show');
}

async function sendToSheets() {
  const url = document.getElementById('sheets-url').value.trim();
  if (!url) { alert('Please enter your Google Apps Script URL.'); return; }
  localStorage.setItem('sheets_url', url);

  const data = collectAllData();
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    closeSheetsModal();
    alert('✅ Data sent to Google Sheets! (no-cors mode — check your sheet to confirm.)');
  } catch (e) {
    alert('❌ Error sending to Sheets: ' + e.message);
  }
}
