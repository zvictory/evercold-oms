const ExcelJS = require('exceljs');
const path = require('path');

async function createInvoiceExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Invoice Data');

  // Add headers
  worksheet.columns = [
    { header: 'Order No', key: 'orderNo', width: 15 },
    { header: 'Branch No', key: 'branchNo', width: 20 },
    { header: 'Total Cost with VAT (сум)', key: 'totalCost', width: 25 }
  ];

  // Add data from invoice 2129
  worksheet.addRow({
    orderNo: '2129',
    branchNo: '00053 - KorzinkaKeles',
    totalCost: 111900.04
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };

  // Add borders to all cells
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // Format the total cost as number with 2 decimal places
  worksheet.getColumn('totalCost').numFmt = '#,##0.00';

  // Save the file
  const outputPath = '/Users/zafar/Downloads/invoice_2129_data.xlsx';
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Excel file created successfully at: ${outputPath}`);
}

createInvoiceExcel().catch(console.error);
