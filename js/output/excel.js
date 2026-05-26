// ══════════════════════════════════════════
// EXPORT: EXCEL
// ══════════════════════════════════════════
function exportExcel() {
  const data = collectAllData();
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary row
  const summaryData = [Object.keys(data), Object.values(data)];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1['!cols'] = Object.keys(data).map(() => ({ wch: 22 }));
  XLSX.utils.book_append_sheet(wb, ws1, 'Intake Summary');

  // Medications sheet (if life selected and meds entered)
  if (state.selectedLOBs.includes('life')) {
    const meds = collectMedications();
    if (meds.length > 0) {
      const mRows = [['#', 'Medication', 'Dosage', 'Frequency', 'Prescribing Condition', 'Duration']];
      meds.forEach((m, idx) => mRows.push([idx + 1, m.name, m.dosage, m.freq, m.condition, m.duration]));
      const wsM = XLSX.utils.aoa_to_sheet(mRows);
      wsM['!cols'] = [{ wch: 4 }, { wch: 35 }, { wch: 12 }, { wch: 18 }, { wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsM, 'Medications');
    }
  }

  const name = `Intake_${val('app-last') || 'Client'}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, name);
}
