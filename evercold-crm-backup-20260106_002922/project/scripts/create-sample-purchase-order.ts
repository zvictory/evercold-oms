import * as XLSX from 'xlsx';
import { join } from 'path';

// Sample data matching the screenshot format
const sampleData = [
  // Header row
  [
    'Документ закупки',
    'Поставщик/завод-поставщик',
    'Материал',
    'Краткий текст',
    'Имя завода',
    'Количество заказа',
  ],
  // Data rows from the screenshot
  ['4506674756', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00093', 'AF_Куры Голень, вес**', 'Korzinka - Navruz', 129],
  ['4506674756', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00094', 'AF_Куры Крыло, вес**', 'Korzinka - Navruz', 60],
  ['4506674756', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00095', 'AF_Куры Бедро, вес**', 'Korzinka - Navruz', 60],
  ['4506674756', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00144', 'Куриное филе Arzon, вес***', 'Korzinka - Navruz', 30],
  ['4506674756', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00096', 'AF_Куриное филе, вес**', 'Korzinka - Navruz', 150],

  ['4506678864', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00093', 'AF_Куры Голень, вес**', "Korzinka - Andijon To'rko'cha", 141],
  ['4506678864', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00144', 'Куриное филе Arzon, вес***', "Korzinka - Andijon To'rko'cha", 90],
  ['4506678864', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00096', 'AF_Куриное филе, вес**', "Korzinka - Andijon To'rko'cha", 150],
  ['4506678864', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00095', 'AF_Куры Бедро, вес**', "Korzinka - Andijon To'rko'cha", 69],
  ['4506678864', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00094', 'AF_Куры Крыло, вес**', "Korzinka - Andijon To'rko'cha", 81],
  ['4506678864', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00016', 'C_Куры Бройлер, вес', "Korzinka - Andijon To'rko'cha", 195],

  ['4506684042', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00096', 'AF_Куриное филе, вес**', 'Korzinka - Namangan Afsona', 120],
  ['4506684042', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00095', 'AF_Куры Бедро, вес**', 'Korzinka - Namangan Afsona', 81],
  ['4506684042', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00093', 'AF_Куры Голень, вес**', 'Korzinka - Namangan Afsona', 120],

  ['4506684601', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00144', 'Куриное филе Arzon, вес***', 'Korzinka - Namangan', 50],
  ['4506684601', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00096', 'AF_Куриное филе, вес**', 'Korzinka - Namangan', 81],
  ['4506684601', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00095', 'AF_Куры Бедро, вес**', 'Korzinka - Namangan', 60],
  ['4506684601', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00094', 'AF_Куры Крыло, вес**', 'Korzinka - Namangan', 81],
  ['4506684601', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00093', 'AF_Куры Голень, вес**', 'Korzinka - Namangan', 81],

  ['4506684939', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00094', 'AF_Куры Крыло, вес**', 'Korzinka - Chulpon 10', 51],
  ['4506684939', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00093', 'AF_Куры Голень, вес**', 'Korzinka - Chulpon 10', 102],
  ['4506684939', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00096', 'AF_Куриное филе, вес**', 'Korzinka - Chulpon 10', 51],
  ['4506684939', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00144', 'Куриное филе Arzon, вес***', 'Korzinka - Chulpon 10', 70],

  ['4506685104', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00016', 'C_Куры Бройлер, вес', 'Korzinka - Andijon', 598],
  ['4506685104', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00093', 'AF_Куры Голень, вес**', 'Korzinka - Andijon', 201],
  ['4506685104', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00094', 'AF_Куры Крыло, вес**', 'Korzinka - Andijon', 99],
  ['4506685104', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00095', 'AF_Куры Бедро, вес**', 'Korzinka - Andijon', 99],
  ['4506685104', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00096', 'AF_Куриное филе, вес**', 'Korzinka - Andijon', 300],
  ['4506685104', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00144', 'Куриное филе Arzon, вес***', 'Korzinka - Andijon', 80],

  ['4506685889', '100011478 OOO EGGSTRA SPECIAL FARMS', '113000006-00016', 'C_Куры Бройлер, вес', 'Korzinka - Qoqon', 299],
];

// Create workbook and worksheet
const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet(sampleData);

// Set column widths
worksheet['!cols'] = [
  { wch: 15 }, // Документ закупки
  { wch: 40 }, // Поставщик
  { wch: 20 }, // Материал
  { wch: 30 }, // Краткий текст
  { wch: 35 }, // Имя завода
  { wch: 15 }, // Количество заказа
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Orders');

// Save to file
const outputPath = join(process.cwd(), 'sample-purchase-order.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('Sample purchase order file created:', outputPath);
console.log('Total orders:', 7);
console.log('Total line items:', sampleData.length - 1);
