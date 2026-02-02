import ExcelJS from 'exceljs';

async function verifyHeights() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/tmp/test-invoice-with-heights.xlsx');

  const sheet = workbook.worksheets[0];

  console.log('✅ ROW HEIGHTS VERIFICATION:\n');

  // Check specific rows
  console.log(`Row 14 (Header): ${sheet.getRow(14).height} (expected: 23.25)`);
  console.log(`Row 17 (Data):   ${sheet.getRow(17).height} (expected: 17.25)`);
  console.log(`Row 18 (Data):   ${sheet.getRow(18).height} (expected: 17.25)`);
  console.log(`Row 22 (Sig 1):  ${sheet.getRow(22).height} (expected: 9.75)`);
  console.log(`Row 24 (Sig 2):  ${sheet.getRow(24).height} (expected: 24.75)`);
  console.log(`Row 26 (Sig 2):  ${sheet.getRow(26).height} (expected: 24.75)`);
  console.log(`Row 28 (Sig 3):  ${sheet.getRow(28).height} (expected: 12.75)`);

  console.log('\n✅ COLUMN WIDTHS VERIFICATION:\n');
  console.log(`Col A: ${sheet.getColumn(1).width} (expected: 4.140625)`);
  console.log(`Col B: ${sheet.getColumn(2).width} (expected: 12.140625)`);
  console.log(`Col C: ${sheet.getColumn(3).width} (expected: 20.7109375)`);
}

verifyHeights().catch(console.error);
