# EverCold CRM - Ice Sales Order Management System

A web-based CRM system for managing ice sales orders from Korzinka branches. Built with Next.js, PostgreSQL, and Prisma.

## Features

- 📤 **Excel Upload**: Support for both detailed and registry order formats
- 📋 **Order Management**: View, track, and update order statuses
- 🏢 **Multi-Branch Support**: Track orders across 31+ Korzinka branches
- 🧊 **Product Catalog**: Pre-loaded with EverCold ice products
- 💼 **Order Workflow**: Track from NEW → CONFIRMED → IN_PRODUCTION → DELIVERED → PAID

## Tech Stack

- **Frontend**: Next.js 16 + React + TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **File Parsing**: XML2JS for Excel files

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL running locally

### Installation

The project is already set up! The development server is running at:

**🌐 http://localhost:3000**

### Database

The database `evercold_crm` has been created and seeded with:
- ✅ Korzinka customer
- ✅ 31 branches (K013 - K178)
- ✅ 2 products (Лёд 1кг & 3кг)

### Project Structure

```
evercold-crm/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Upload page
│   │   ├── orders/
│   │   │   ├── page.tsx             # Orders list
│   │   │   └── [id]/page.tsx        # Order details
│   │   └── api/
│   │       ├── upload/route.ts      # File upload API
│   │       └── orders/              # Orders API
│   └── lib/
│       ├── prisma.ts                # Database client
│       └── parsers/
│           └── excel-parser.ts      # Excel file parser
├── prisma/
│   ├── schema.prisma                # Database schema
│   ├── seed.ts                      # Seed data
│   └── migrations/
└── public/uploads/                  # Uploaded Excel files
```

## Usage

### 1. Upload Orders

1. Go to http://localhost:3000
2. Click "Click to select Excel file" or drag & drop
3. Select your Excel file (supports both formats)
4. Click "Upload & Process"

### 2. View Orders

- Navigate to "Orders" in the top menu
- See all uploaded orders in a table
- Click "View Details" to see order information

### 3. Update Order Status

- Open any order detail page
- Click on status buttons to update (NEW, CONFIRMED, etc.)

## Supported Excel Formats

### Format 1: Detailed Single Branch Order
```
Заказ № 4506546108 от 03.12.2025
Поставщик: ЧП Ever Cold
Получатель: Korzinka - Beruniy
[Table with products, quantities, prices, VAT]
```

### Format 2: Multi-Branch Registry
```
Matrix format with:
- Row 1: Branch codes (K013, K022, etc.)
- Row 2: Branch names
- Row 3: Order numbers
- Rows 4+: Products with quantities per branch
```

## API Endpoints

- `POST /api/upload` - Upload and process Excel files
- `GET /api/orders` - Get all orders
- `GET /api/orders/[id]` - Get single order
- `PATCH /api/orders/[id]` - Update order status

## Environment Variables

Already configured in `.env`:
```env
DATABASE_URL="postgresql://user@localhost:5432/evercold_crm"
```

## Database Schema

### Main Tables

- **Customer**: Korzinka customer info
- **CustomerBranch**: 31 Korzinka branches
- **Product**: Ice products catalog
- **Order**: Order headers
- **OrderItem**: Order line items with branch links
- **Email**: Tracking uploaded files

## Testing with Real Files

You have test files in `/Users/user/Downloads/`:
- `Форма заказа № 4506546108.xls` (Format 1)
- `Реестр заказов.xls` (Format 2)
- `Реестр заказов (2).xls` (Format 2)
- `Реестр заказов (3).xls` (Format 2)

Try uploading these to test the system!

## Development

The server is already running. To restart:

```bash
cd /Users/user/Documents/evercold-crm
npm run dev
```

## Future Enhancements

- 📧 Gmail integration for automatic email fetching
- 📊 Dashboard with analytics
- 📄 Invoice generation
- 🔐 User authentication
- 📱 Mobile responsive improvements
- 🌐 Deploy to cloud (Vercel)

## License

MIT

## Support

Built with ❄️ for EverCold Ice Sales
