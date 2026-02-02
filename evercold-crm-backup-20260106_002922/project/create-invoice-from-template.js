const ExcelJS = require('exceljs');

async function createInvoiceFromPDF() {
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
    branch: '00053 - KorzinkaKeles',
    buyerAddress: 'Keles city, Oqibat MFY, "Keles yo\'li" ko\'chasi. Tuman hokimligi',
    totalWithVAT: 111900.04,
    totalWithoutVAT: 99910.75,
    vatAmount: 11989.29
  };

  // Update invoice number and date (Row 3)
  worksheet.getCell('A3').value = `№ ${invoiceData.invoiceNumber} от ${invoiceData.invoiceDate}`;

  // Update contract info (Row 4)
  worksheet.getCell('A4').value = `к договору № ${invoiceData.contractNumber} от ${invoiceData.contractDate}`;

  // Update buyer name to include branch (Row 6, columns 9-11)
  const buyerName = `"ANGLESEY FOOD" MCHJ (${invoiceData.branch})`;
  worksheet.getCell('I6').value = buyerName;

  // Update buyer address (Row 7, columns 9-11)
  worksheet.getCell('I7').value = invoiceData.buyerAddress;

  // For the totals (Row 19), we need to update the values
  // The template has formulas that sum the items, but we can override with our values
  // Column H (8) = Total without VAT
  // Column J (10) = VAT amount
  // Column K (11) = Total with VAT

  worksheet.getCell('H19').value = invoiceData.totalWithoutVAT;
  worksheet.getCell('J19').value = invoiceData.vatAmount;
  worksheet.getCell('K19').value = invoiceData.totalWithVAT;

  // Also update the duplicate section (Row 52) if it exists
  if (worksheet.rowCount >= 52) {
    worksheet.getCell('H52').value = invoiceData.totalWithoutVAT;
    worksheet.getCell('J52').value = invoiceData.vatAmount;
    worksheet.getCell('K52').value = invoiceData.totalWithVAT;

    // Update invoice number in second section (Row 36)
    worksheet.getCell('A36').value = `№ ${invoiceData.invoiceNumber} от ${invoiceData.invoiceDate}`;
  }

  // Save the new invoice
  await workbook.xlsx.writeFile('/Users/zafar/Downloads/invoice_2129_exact_format.xlsx');
  console.log('✅ Invoice created successfully!');
  console.log('📄 File: /Users/zafar/Downloads/invoice_2129_exact_format.xlsx');
  console.log('');
  console.log('Extracted data:');
  console.log(`  Order No: ${invoiceData.invoiceNumber}`);
  console.log(`  Branch: ${invoiceData.branch}`);
  console.log(`  Total with VAT: ${invoiceData.totalWithVAT} сум`);
}

createInvoiceFromPDF().catch(console.error);
