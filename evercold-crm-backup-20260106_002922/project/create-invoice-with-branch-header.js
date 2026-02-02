const ExcelJS = require('exceljs');

async function createInvoiceWithBranchHeader() {
  // Load the template
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('/Users/zafar/Downloads/счет фактура2.xlsx');
  const worksheet = workbook.worksheets[0];

  // Data from PDF invoice 2129
  const invoiceData = {
    invoiceNumber: '2129',
    invoiceDate: '05.12.2025',
    contractNumber: '17',
    contractDate: '07.09.2022',
    branchNumber: '00053',
    branchName: 'KorzinkaKeles',
    buyerAddress: 'Keles city, Oqibat MFY, "Keles yo\'li" ko\'chasi. Tuman hokimligi',
    totalWithVAT: 111900.04,
    totalWithoutVAT: 99910.75,
    vatAmount: 11989.29
  };

  // Update invoice number and date (Row 3)
  worksheet.getCell('A3').value = `№ ${invoiceData.invoiceNumber} от ${invoiceData.invoiceDate}`;

  // Update contract info (Row 4)
  worksheet.getCell('A4').value = `к договору № ${invoiceData.contractNumber} от ${invoiceData.contractDate}`;

  // Add branch information in Row 5 (right after contract info)
  // First, let's check what's in row 5 and add the branch info
  const branchText = `Филиал: ${invoiceData.branchNumber} - ${invoiceData.branchName}`;

  // Set the branch info in row 5, merged across all columns like the rows above
  worksheet.getCell('A5').value = branchText;

  // Copy the styling from row 3 (bold, size 7, merged)
  const row3Cell = worksheet.getCell('A3');
  const row5Cell = worksheet.getCell('A5');

  row5Cell.font = {
    bold: true,
    size: 7,
    color: { theme: 1 },
    name: "Calibri",
    family: 2,
    charset: 204,
    scheme: "minor"
  };

  row5Cell.fill = {
    type: 'pattern',
    pattern: 'none'
  };

  // Merge cells A5:K5 to match the style of rows 2, 3, 4
  worksheet.mergeCells('A5:K5');

  // Copy the value to all cells in the merged range
  for (let col = 2; col <= 11; col++) {
    const cell = worksheet.getCell(5, col);
    cell.value = branchText;
    cell.font = row5Cell.font;
    cell.fill = row5Cell.fill;
  }

  // Update buyer name to include branch (Row 6, columns 9-11)
  const buyerName = `"ANGLESEY FOOD" MCHJ (${invoiceData.branchNumber} - ${invoiceData.branchName})`;
  worksheet.getCell('I6').value = buyerName;

  // Update buyer address (Row 7, columns 9-11)
  worksheet.getCell('I7').value = invoiceData.buyerAddress;

  // Update totals (Row 19)
  worksheet.getCell('H19').value = invoiceData.totalWithoutVAT;
  worksheet.getCell('J19').value = invoiceData.vatAmount;
  worksheet.getCell('K19').value = invoiceData.totalWithVAT;

  // Update the duplicate section if it exists (Row 52)
  if (worksheet.rowCount >= 52) {
    worksheet.getCell('H52').value = invoiceData.totalWithoutVAT;
    worksheet.getCell('J52').value = invoiceData.vatAmount;
    worksheet.getCell('K52').value = invoiceData.totalWithVAT;

    // Update invoice number in second section (Row 36)
    worksheet.getCell('A36').value = `№ ${invoiceData.invoiceNumber} от ${invoiceData.invoiceDate}`;

    // Update contract in second section (Row 37)
    worksheet.getCell('A37').value = `к договору № ${invoiceData.contractNumber} от ${invoiceData.contractDate}`;

    // Add branch to second section (Row 38 or check where it should go)
    // The second section starts at row 35, so row 38 would be equivalent to row 5
    const row38Cell = worksheet.getCell('A38');
    row38Cell.value = branchText;
    row38Cell.font = row5Cell.font;
    row38Cell.fill = row5Cell.fill;

    // Check if there's a merge for this row and apply it
    worksheet.mergeCells('A38:K38');
    for (let col = 2; col <= 11; col++) {
      const cell = worksheet.getCell(38, col);
      cell.value = branchText;
      cell.font = row5Cell.font;
      cell.fill = row5Cell.fill;
    }
  }

  // Save the new invoice
  await workbook.xlsx.writeFile('/Users/zafar/Downloads/invoice_2129_with_branch_header.xlsx');
  console.log('✅ Invoice created successfully with branch header!');
  console.log('📄 File: /Users/zafar/Downloads/invoice_2129_with_branch_header.xlsx');
  console.log('');
  console.log('Document structure:');
  console.log('  Row 2: Счет-фактура');
  console.log(`  Row 3: № ${invoiceData.invoiceNumber} от ${invoiceData.invoiceDate}`);
  console.log(`  Row 4: к договору № ${invoiceData.contractNumber} от ${invoiceData.contractDate}`);
  console.log(`  Row 5: Филиал: ${invoiceData.branchNumber} - ${invoiceData.branchName}`);
  console.log('');
  console.log('Extracted data:');
  console.log(`  Order No: ${invoiceData.invoiceNumber}`);
  console.log(`  Branch Number: ${invoiceData.branchNumber}`);
  console.log(`  Branch Name: ${invoiceData.branchName}`);
  console.log(`  Total with VAT: ${invoiceData.totalWithVAT} сум`);
}

createInvoiceWithBranchHeader().catch(console.error);
