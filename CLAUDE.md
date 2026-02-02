# CLAUDE.md - Evercold CRM Project Context

> **Project**: Evercold CRM - Ice manufacturing and distribution management system
> **Purpose**: This file serves as the complete rulebook for all AI-assisted development tasks

---

## 🛠 Commands

### Development
```bash
npm run dev          # Start Next.js development server (localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:push      # Push Prisma schema to database (no migrations)
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed database with initial data
```

### Code Quality
```bash
npm run type-check   # TypeScript type checking
npm run format       # Format code with Prettier
```

---

## 🏗 Tech Stack

### Core Framework
- **Next.js 16** (App Router, React Server Components)
- **React 19** (Client & Server Components)
- **TypeScript** (Strict mode enabled)

### Database & ORM
- **PostgreSQL** (Primary database)
- **Prisma ORM** with `@prisma/adapter-pg`
- Connection pooling with `@prisma/adapter-pg` + `pg`

### UI & Styling
- **Tailwind CSS 4** (Latest beta with modern configuration)
- **Shadcn/UI** (Radix UI primitives)
- **Lucide React** (Icon library - ONLY icon source allowed)
- **Recharts** (Data visualization)

### Data Handling
- **ExcelJS** - XLSX file parsing (binary Excel files)
- **xml2js** - XML-based .xls file parsing (legacy Excel format)
- **date-fns** - Date manipulation and formatting

### Utilities
- **clsx** + **tailwind-merge** - Conditional class merging via `cn()` utility
- **React Hook Form** - Form state management
- **Zod** - Runtime validation schemas

### Development Tools
- **ESLint** (Next.js config)
- **TypeScript** 5.x
- **PostCSS** (Tailwind CSS processing)

## 6. UI Component Rules
- **Date Inputs:** MUST use `Flatpickr`.
  - **Strict Format:** `dd/mm/yyyy` (e.g., 31/01/2026).
  - **Forbidden:** Do NOT use native `<input type="date">` or Shadcn `Calendar` primitive directly.
  - **Library:** `react-flatpickr` with `Russian` locale by default.
  - **Styling:** Match standard input classes (`h-10 border-slate-200 rounded-md`).
---

## 🎨 Design System Rules - "Ice & Steel" Aesthetic

### Visual Philosophy
Professional, high-density enterprise UI with ice-cold clarity and industrial precision.

### Color Palette (Slate-based)
```typescript
// Backgrounds
bg-white           // Primary surface
bg-slate-50        // Secondary surface, hover states
bg-slate-100       // Tertiary surface, disabled states

// Borders
border-slate-100   // Primary borders (light)
border-slate-200   // Secondary borders (default)
border-slate-300   // Emphasis borders

// Text
text-slate-900     // Primary text (headings, labels)
text-slate-700     // Secondary text
text-slate-500     // Tertiary text (metadata)
text-slate-400     // Disabled text, placeholders

// Accent Colors
bg-sky-600         // Primary actions (buttons, links)
bg-emerald-600     // Success states
bg-red-600         // Danger/delete actions
bg-amber-600       // Warning states
```

### Status Color System
```typescript
// Order Status Colors
NEW:        bg-blue-50 text-blue-700 border-blue-100
CONFIRMED:  bg-purple-50 text-purple-700 border-purple-100
SHIPPED:    bg-indigo-50 text-indigo-700 border-indigo-100
DELIVERED:  bg-emerald-50 text-emerald-700 border-emerald-100
CANCELLED:  bg-red-50 text-red-700 border-red-100

// Product Type Colors
3kg Ice:    bg-blue-50 text-blue-700 border-blue-200
1kg Ice:    bg-sky-50 text-sky-700 border-sky-200
```

### Component Standards

#### Tables
- **Container**: `rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden`
- **Header**: `bg-slate-50/50` with `font-semibold text-slate-900`
- **Rows**: `border-slate-100` with `hover:bg-slate-50/50`
- **Selected Row**: `bg-sky-50/30`
- **Numbers**: Use `tabular-nums` class for alignment

#### Buttons
- **Primary**: `bg-sky-600 hover:bg-sky-700 text-white shadow-sm`
- **Secondary**: `border-slate-200 hover:bg-slate-50 text-slate-600`
- **Danger**: `text-red-600 hover:bg-red-50`
- **Ghost**: `hover:bg-slate-50 text-slate-400`

#### Forms
- **Inputs**: `bg-slate-50 border-slate-200 hover:bg-white transition-all`
- **Labels**: `text-sm font-medium text-slate-900`
- **Helper Text**: `text-xs text-slate-500`

#### Cards
- **Container**: `bg-white p-6 rounded-2xl border border-slate-200 shadow-sm`
- **Section Divider**: `border-t border-slate-100`

#### Badges
- **Outline**: `variant="outline"` with status-specific colors
- **Size**: `px-2 py-0.5 text-[11px] font-bold`
- **Dot Indicator**: `h-1.5 w-1.5 rounded-full` with matching color

### Typography
```typescript
// Headings
h1: "text-2xl font-bold text-slate-900 tracking-tight"
h2: "text-xl font-semibold text-slate-900"
h3: "text-lg font-semibold text-slate-900"

// Body
body: "text-sm text-slate-700"
small: "text-xs text-slate-500"
metadata: "text-[10px] text-slate-400 font-bold uppercase tracking-wider"

// Special
mono: "font-mono font-bold text-sky-600"  // Order numbers, codes
tabular: "tabular-nums"                    // Numbers, amounts
```

### Spacing & Layout
- **Page Container**: `flex flex-col gap-6`
- **Card Padding**: `p-6` (24px)
- **Component Gap**: `gap-3` to `gap-6` depending on hierarchy
- **Border Radius**: `rounded-xl` (cards), `rounded-lg` (modals), `rounded` (inputs)

### Icons
- **Source**: Lucide React ONLY (no other icon libraries)
- **Size**: `h-4 w-4` (standard), `h-5 w-5` (emphasis), `h-12 w-12` (empty states)
- **Color**: Inherit from parent or explicit `text-slate-400`

---

## 🛡 Coding Standards

### The "One Prompt, One Session" Rule

**CRITICAL**: Each implementation task must be completed in a single continuous session without requiring user intervention.

#### What This Means:
- ✅ Read all necessary files upfront
- ✅ Plan the complete implementation before starting
- ✅ Handle all edge cases and errors in one go
- ✅ Test thoroughly before marking complete
- ❌ Do NOT ask "Should I also update X?" mid-implementation
- ❌ Do NOT say "Let me know if you want me to add Y"
- ❌ Do NOT leave TODOs or incomplete sections

#### Example:
```typescript
// ❌ BAD - Incomplete implementation
export async function createOrder(data: OrderInput) {
  // TODO: Add validation
  // TODO: Handle errors
  return await prisma.order.create({ data })
}

// ✅ GOOD - Complete implementation
export async function createOrder(data: OrderInput) {
  try {
    // Validate input
    const validated = orderSchema.parse(data)

    // Check business rules
    if (validated.items.length === 0) {
      throw new Error('Order must have at least one item')
    }

    // Execute transaction
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          totalAmount: calculateTotal(validated.items),
          customerId: validated.customerId,
          orderItems: {
            create: validated.items
          }
        }
      })

      // Update inventory
      for (const item of validated.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      }

      return order
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(`Database error: ${error.message}`)
    }
    throw error
  }
}
```

---

### Multi-Language Support

**Languages**: English (en), Russian (ru), Uzbek Latin (uz-Latn), Uzbek Cyrillic (uz-Cyrl)

#### The "English Logic, Russian Content" Rule

**CRITICAL**: All code, variables, functions, and types must be in English. All user-facing content must be in Russian (default) or support multi-language.

```typescript
// ❌ BAD - Mixed languages in code
interface Заказ {
  номер_заказа: string
  филиал: string
}

const создатьЗаказ = (данные: Заказ) => {
  // ...
}

// ✅ GOOD - English code, Russian content
interface Order {
  orderNumber: string
  branchName: string
}

const createOrder = (data: Order) => {
  return {
    ...data,
    displayName: "Заказ #${data.orderNumber}",  // Russian for users
    successMessage: "Заказ успешно создан"      // Russian for users
  }
}
```

#### Implementation Pattern:
```typescript
// 1. Define content in separate locale files
// src/lib/locales/ru.ts
export const ru = {
  orders: {
    title: "Заказы",
    create: "Создать заказ",
    status: {
      new: "Новый",
      confirmed: "Подтверждён",
      shipped: "Отгружен",
      delivered: "Доставлен"
    }
  }
}

// 2. Use in components
export function OrdersPage() {
  const t = useTranslation()

  return (
    <div>
      <h1>{t('orders.title')}</h1>
      <Button>{t('orders.create')}</Button>
    </div>
  )
}
```

#### Database Content:
- Store translatable content in JSON columns when needed
- Primary language: Russian
- Support multiple languages via `translations` field

```prisma
model Product {
  id              String   @id @default(cuid())
  sapCode         String   // English: system codes
  productName     String   // Russian: display name
  translations    Json?    // { uz_latn: "...", uz_cyrl: "...", en: "..." }
}
```

---

### TypeScript Rules

#### Type Definitions
```typescript
// ✅ Use `interface` for object shapes
interface OrderInput {
  customerId: string
  items: OrderItemInput[]
  deliveryDate: Date
}

// ✅ Use `type` for unions, intersections, or utilities
type OrderStatus = 'NEW' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED'
type OrderWithCustomer = Order & { customer: Customer }

// ❌ Avoid `any` - use `unknown` or proper types
// BAD:  const data: any = await fetch(...)
// GOOD: const data: OrderResponse = await fetch(...)
```

#### Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitAny": true
  }
}
```

---

### Next.js App Router Patterns

#### File Structure (Feature-based)
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route groups
│   ├── api/                      # API routes
│   │   ├── orders/route.ts       # GET /api/orders
│   │   └── upload/route.ts       # POST /api/upload
│   ├── orders/
│   │   └── page.tsx              # /orders page
│   └── page.tsx                  # Home page
├── components/
│   ├── ui/                       # Shadcn components
│   ├── orders/                   # Feature: Orders
│   │   ├── OrderTable.tsx
│   │   ├── OrderSheet.tsx
│   │   └── OrderImportModal.tsx
│   └── dashboard/                # Feature: Dashboard
├── lib/
│   ├── prisma.ts                 # Prisma client
│   ├── utils.ts                  # Utilities (cn, etc.)
│   └── parsers/                  # Data parsers
└── types/                        # Shared TypeScript types
```

#### Component Patterns

##### Server Components (Default)
```typescript
// app/orders/page.tsx - Fetch data on server
export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: { customer: true }
  })

  return <OrderTable orders={orders} />
}
```

##### Client Components (Interactive)
```typescript
// components/orders/OrderTable.tsx
"use client"

import { useState } from "react"

export function OrderTable({ orders }: { orders: Order[] }) {
  const [selection, setSelection] = useState<string[]>([])

  return (
    // Interactive table with checkboxes, sorting, filtering
  )
}
```

#### API Routes
```typescript
// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      include: { customer: true, orderItems: true }
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with Zod
    const validated = orderSchema.parse(body)

    // Create order
    const order = await prisma.order.create({
      data: validated
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
```

---

### Database & Prisma Patterns

#### Transaction Pattern (Multi-table writes)
```typescript
// ✅ Use $transaction for atomic operations
export async function createOrderWithItems(data: OrderInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Create order
    const order = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        customerId: data.customerId,
        totalAmount: calculateTotal(data.items)
      }
    })

    // 2. Create order items
    await tx.orderItem.createMany({
      data: data.items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        pricePerUnit: item.pricePerUnit
      }))
    })

    // 3. Update inventory
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
    }

    return order
  })
}
```

#### Query Patterns
```typescript
// ✅ Include related data efficiently
const orders = await prisma.order.findMany({
  include: {
    customer: {
      select: { name: true, phone: true }  // Only needed fields
    },
    orderItems: {
      include: {
        branch: {
          select: { branchCode: true, branchName: true }
        }
      }
    }
  },
  orderBy: { orderDate: 'desc' }
})

// ✅ Use where clauses for filtering
const activeOrders = await prisma.order.findMany({
  where: {
    status: { notIn: ['DELIVERED', 'CANCELLED'] },
    orderDate: { gte: startDate, lte: endDate }
  }
})
```

#### Error Handling
```typescript
import { Prisma } from '@prisma/client'

try {
  await prisma.order.create({ data })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      throw new Error('Order number already exists')
    }
    if (error.code === 'P2003') {
      throw new Error('Related record not found')
    }
  }
  throw error
}
```

---

### State Management

#### Client State (React useState)
```typescript
// For UI-only state (modals, selections, filters)
const [isOpen, setIsOpen] = useState(false)
const [selectedIds, setSelectedIds] = useState<string[]>([])
const [filters, setFilters] = useState({ status: 'ALL', branch: '' })
```

#### Server State (React Server Components)
```typescript
// For data fetching - prefer RSC over client-side fetching
export default async function OrdersPage() {
  const orders = await fetchOrders()  // Server-side
  return <OrderTable orders={orders} />
}
```

#### Form State (React Hook Form)
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm<OrderInput>({
  resolver: zodResolver(orderSchema),
  defaultValues: initialData
})

const onSubmit = form.handleSubmit(async (data) => {
  await createOrder(data)
})
```

---

### Data Fetching & Mutations

#### Fetching Pattern (Client Components)
```typescript
// Use for dynamic data that needs refresh
const [data, setData] = useState<Order[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

useEffect(() => {
  fetchData()
}, [filters])  // Re-fetch when filters change

async function fetchData() {
  try {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams(filters)
    const response = await fetch(`/api/orders?${params}`)

    if (!response.ok) throw new Error('Fetch failed')

    const result = await response.json()
    setData(result.orders)
  } catch (err: any) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}
```

#### Mutation Pattern
```typescript
async function handleSave(data: OrderInput) {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message)
    }

    const order = await response.json()

    // Refresh data after mutation
    await fetchOrders()

    // Show success feedback
    toast.success('Order created successfully')
  } catch (error: any) {
    toast.error(error.message)
  }
}
```

---

### Import Standards

#### Use Absolute Imports
```typescript
// ✅ GOOD - Absolute imports
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"

// ❌ BAD - Relative imports
import { Button } from "../../components/ui/button"
import { prisma } from "../../../lib/prisma"
```

#### Import Order
```typescript
// 1. External dependencies
import * as React from "react"
import { Prisma } from "@prisma/client"

// 2. Next.js imports
import { NextRequest, NextResponse } from "next/server"

// 3. Internal UI components
import { Button } from "@/components/ui/button"
import { Table } from "@/components/ui/table"

// 4. Feature components
import { OrderTable } from "@/components/orders/OrderTable"

// 5. Utilities & types
import { cn } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import type { Order } from "@/types"
```

---

### Error Handling Standards

#### API Error Responses
```typescript
// Consistent error format
return NextResponse.json(
  {
    error: "User-friendly message",
    code: "ERROR_CODE",  // Optional
    details: {} // Optional debug info
  },
  { status: 400 | 404 | 500 }
)
```

#### Client Error Handling
```typescript
try {
  await riskyOperation()
} catch (error: any) {
  console.error('Operation failed:', error)

  // Show user-friendly message
  const message = error.message || 'An unexpected error occurred'
  toast.error(message)

  // Optional: Send to error tracking service
  // trackError(error)
}
```

---

### Component Composition

#### Props Interface
```typescript
// Define clear props interface at top of file
interface OrderTableProps {
  orders: Order[]
  loading?: boolean
  error?: string | null
  onEdit?: (order: Order) => void
  selection?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function OrderTable({
  orders,
  loading = false,
  error = null,
  onEdit,
  selection = [],
  onSelectionChange
}: OrderTableProps) {
  // ...
}
```

#### Conditional Rendering
```typescript
// Loading state
if (loading) {
  return <LoadingSpinner />
}

// Error state
if (error) {
  return <ErrorDisplay message={error} />
}

// Empty state
if (orders.length === 0) {
  return <EmptyState message="No orders found" />
}

// Main content
return <TableContent orders={orders} />
```

---

### Performance Optimization

#### React Patterns
```typescript
// Use React.memo for expensive components
export const OrderTable = React.memo(function OrderTable({ orders }: Props) {
  // ...
})

// Use useCallback for event handlers
const handleDelete = useCallback((id: string) => {
  // ...
}, [dependencies])

// Use useMemo for expensive calculations
const sortedOrders = useMemo(() => {
  return orders.sort((a, b) => b.orderDate - a.orderDate)
}, [orders])
```

#### Database Optimization
```typescript
// Select only needed fields
const customers = await prisma.customer.findMany({
  select: {
    id: true,
    name: true,
    // Don't fetch unused fields
  }
})

// Use pagination for large datasets
const orders = await prisma.order.findMany({
  take: 50,
  skip: page * 50,
  orderBy: { orderDate: 'desc' }
})
```

---

### Testing Expectations

#### Manual Testing Checklist
Before marking any task complete:

- [ ] Page loads without console errors
- [ ] All interactive elements respond correctly
- [ ] Loading states display during async operations
- [ ] Error states display helpful messages
- [ ] Empty states display when appropriate
- [ ] Data displays correctly (no "undefined", no null errors)
- [ ] Filters/search work as expected
- [ ] Forms validate input correctly
- [ ] Success feedback shown after mutations
- [ ] Database state is correct (verify with Prisma Studio or SQL)

#### API Testing
```bash
# Test GET endpoint
curl http://localhost:3000/api/orders?status=NEW&branch=K001

# Test POST endpoint
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerId":"...", "items":[...]}'
```

---

## 📋 Common Patterns & Snippets

### SAP Product Codes
```typescript
// Standard product codes used in Evercold
const PRODUCT_CODES = {
  ICE_3KG: '107000001-00001',  // Лёд пищевой Ever Cold 3кг
  ICE_1KG: '107000001-00006',  // Лёд пищевой Ever Cold 1кг
}

// Usage in queries
const ice3kgOrders = order.orderItems
  .filter(item => item.sapCode === PRODUCT_CODES.ICE_3KG)
  .reduce((sum, item) => sum + item.quantity, 0)
```

### Order Number Generation
```typescript
// Format: ORD-YYYYMMDD-XXXX
function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${random}`
}
```

### Date Formatting
```typescript
import { format } from 'date-fns'

// Display format: 2024-01-28
const displayDate = format(order.orderDate, 'yyyy-MM-dd')

// Include full day in date range queries
const endDate = new Date(dateTo)
endDate.setHours(23, 59, 59, 999)
```

### Utility: cn() for Class Merging
```typescript
import { cn } from "@/lib/utils"

// Merge conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  isPending ? "pending-class" : "ready-class"
)} />
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Use Mock Data
```typescript
// BAD
const orders = [
  { id: '1', orderNumber: 'ORD-001' },
  { id: '2', orderNumber: 'ORD-002' }
]

// GOOD
const orders = await prisma.order.findMany()
```

### ❌ Don't Ignore Error States
```typescript
// BAD
const data = await fetch('/api/orders').then(r => r.json())
setOrders(data.orders)

// GOOD
try {
  const response = await fetch('/api/orders')
  if (!response.ok) throw new Error('Failed to fetch')
  const data = await response.json()
  setOrders(data.orders)
} catch (error: any) {
  setError(error.message)
}
```

### ❌ Don't Mix Languages in Code
```typescript
// BAD
interface Филиал {
  код_филиала: string
}

// GOOD
interface Branch {
  branchCode: string
  // Display in Russian in UI, not in code
}
```

### ❌ Don't Use Relative Imports
```typescript
// BAD
import { Button } from "../../../components/ui/button"

// GOOD
import { Button } from "@/components/ui/button"
```

### ❌ Don't Skip Loading States
```typescript
// BAD
return <Table data={orders} />

// GOOD
if (loading) return <LoadingSpinner />
if (error) return <ErrorDisplay error={error} />
return <Table data={orders} />
```

---

## 📚 Key Reference Files

- `/prisma/schema.prisma` - Complete database schema
- `/SYSTEM_OVERVIEW.md` - Comprehensive system documentation (913 lines)
- `/README.md` - Project overview and setup instructions
- `/src/lib/prisma.ts` - Prisma client singleton
- `/src/lib/utils.ts` - Shared utilities (cn, formatters)
- `/src/lib/parsers/excel-parser.ts` - Excel file parsing logic

---

## 🎯 Development Workflow

### Starting a New Feature
1. Read relevant files (schema, existing components, API routes)
2. Plan complete implementation (One Prompt, One Session)
3. Create necessary types/interfaces
4. Implement database queries (with transactions if needed)
5. Build API route with full error handling
6. Create UI components (loading, error, empty, success states)
7. Test thoroughly (manual + curl for APIs)
8. Commit with descriptive message

### Modifying Existing Features
1. Read current implementation completely
2. Understand existing patterns and conventions
3. Make changes that match existing style
4. Don't leave orphaned code or TODOs
5. Test all affected flows
6. Verify database state is correct

### Debugging Issues
1. Check console for error messages
2. Verify API responses with curl or browser DevTools
3. Check database state with Prisma Studio
4. Review recent commits for changes
5. Validate types and interfaces match runtime data

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0

---

> 💡 **Remember**: This file is the source of truth for all development decisions. When in doubt, refer to this document first.
