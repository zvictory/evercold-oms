# TypeORM Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task with two-stage reviews (spec compliance, then code quality).

**Goal:** Migrate Evercold CRM from Prisma ORM to TypeORM, fixing the database connection issue and establishing a sustainable data access pattern.

**Architecture:** Replace Prisma client singleton with TypeORM DataSource. Create entity models for all 28 Prisma models. Build repository layer for database access. Systematically update 72 database-accessing files (38 API routes, 11 raw pg routes, 5 library files, 16 enum imports, 2 server components). Convert 7 transaction blocks to TypeORM QueryRunner transactions.

**Tech Stack:** TypeORM 0.3.x, PostgreSQL driver, pg connection pooling, Next.js 16 API routes, React Server Components

---

## Phase 1: TypeORM Setup & Configuration (CRITICAL)

### Task 1: Install TypeORM Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Add TypeORM packages to package.json**

Add to `"dependencies"` section:

```json
{
  "dependencies": {
    "typeorm": "^0.3.20",
    "pg": "^8.16.3",
    "reflect-metadata": "^0.1.14",
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1"
  }
}
```

**Note:** `pg` is already installed. We're adding TypeORM, reflect-metadata (required for TypeORM decorators), and validation libraries.

**Step 2: Install dependencies**

```bash
cd /Users/zafar/Documents/evercold
npm install
```

Expected: All packages installed successfully, no errors.

**Step 3: Verify TypeORM installation**

```bash
npx typeorm --version
```

Expected: Output showing TypeORM version (e.g., "0.3.20")

**Step 4: Commit**

```bash
cd /Users/zafar/Documents/evercold
git add package.json package-lock.json
git commit -m "feat: add TypeORM dependencies"
```

---

### Task 2: Create TypeORM DataSource Configuration

**Files:**
- Create: `src/lib/database.ts` (new file)
- Modify: `src/lib/prisma.ts` (deprecate but keep for reference)

**Step 1: Create TypeORM DataSource**

Create `/Users/zafar/Documents/evercold/src/lib/database.ts`:

```typescript
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Customer } from '@/entities/Customer'
import { CustomerBranch } from '@/entities/CustomerBranch'
import { Product } from '@/entities/Product'
import { CustomerProductPrice } from '@/entities/CustomerProductPrice'
import { Order } from '@/entities/Order'
import { OrderItem } from '@/entities/OrderItem'
import { Email } from '@/entities/Email'
import { Delivery } from '@/entities/Delivery'
import { DeliveryRoute } from '@/entities/DeliveryRoute'
import { RouteStop } from '@/entities/RouteStop'
import { DeliveryChecklist } from '@/entities/DeliveryChecklist'
import { DeliveryPhoto } from '@/entities/DeliveryPhoto'
import { DeliveryItem } from '@/entities/DeliveryItem'
import { Driver } from '@/entities/Driver'
import { DriverSession } from '@/entities/DriverSession'
import { Vehicle } from '@/entities/Vehicle'
import { Technician } from '@/entities/Technician'
import { TechnicianBranchAssignment } from '@/entities/TechnicianBranchAssignment'
import { ServiceTicket } from '@/entities/ServiceTicket'
import { ServiceCompletion } from '@/entities/ServiceCompletion'
import { IssueCategory } from '@/entities/IssueCategory'
import { IssueSubcategory } from '@/entities/IssueSubcategory'
import { User } from '@/entities/User'
import { EdoIntegration } from '@/entities/EdoIntegration'
import { EdoDocumentSync } from '@/entities/EdoDocumentSync'

// Get database credentials from environment or use defaults
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://evercold_user:2d075a53447d1d4ac4080f17d5a07f32@localhost:5432/evercold_production'

// Parse connection URL (fallback to individual parameters)
let dbConfig = {
  host: 'localhost',
  port: 5432,
  username: 'evercold_user',
  password: '2d075a53447d1d4ac4080f17d5a07f32',
  database: 'evercold_production',
}

// Try to parse DATABASE_URL if it's a full connection string
if (DATABASE_URL.startsWith('postgresql://')) {
  const url = new URL(DATABASE_URL)
  dbConfig = {
    host: url.hostname || 'localhost',
    port: parseInt(url.port || '5432'),
    username: url.username || 'evercold_user',
    password: url.password || '',
    database: url.pathname.substring(1).split('?')[0] || 'evercold_production',
  }
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [
    Customer,
    CustomerBranch,
    Product,
    CustomerProductPrice,
    Order,
    OrderItem,
    Email,
    Delivery,
    DeliveryRoute,
    RouteStop,
    DeliveryChecklist,
    DeliveryPhoto,
    DeliveryItem,
    Driver,
    DriverSession,
    Vehicle,
    Technician,
    TechnicianBranchAssignment,
    ServiceTicket,
    ServiceCompletion,
    IssueCategory,
    IssueSubcategory,
    User,
    EdoIntegration,
    EdoDocumentSync,
  ],
  synchronize: false, // Don't auto-sync schema, we manage migrations manually
  logging: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
  ssl: false,
  poolSize: 10,
  connectionTimeoutMillis: 5000,
})

// Initialize DataSource on first import
let initialized = false

export async function initializeDatabase() {
  if (initialized) return AppDataSource

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      initialized = true
      console.log('✅ TypeORM database connection initialized')
    }
    return AppDataSource
  } catch (error: any) {
    console.error('❌ Failed to initialize database:', error.message)
    throw error
  }
}

// Get DataSource or throw error if not initialized
export function getDataSource(): DataSource {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database not initialized. Call initializeDatabase() first.')
  }
  return AppDataSource
}
```

**Step 2: Create entities directory structure**

```bash
mkdir -p /Users/zafar/Documents/evercold/src/entities
```

**Step 3: Test configuration loads (no errors)**

Create temporary test file `/Users/zafar/Documents/evercold/test-typeorm.ts`:

```typescript
import 'reflect-metadata'
import { AppDataSource } from '@/lib/database'

async function testConnection() {
  try {
    await AppDataSource.initialize()
    console.log('✅ Database connected')

    // Test simple query
    const result = await AppDataSource.query('SELECT NOW() as current_time')
    console.log('✅ Query works:', result)

    await AppDataSource.destroy()
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

testConnection()
```

```bash
cd /Users/zafar/Documents/evercold
npx ts-node test-typeorm.ts
```

Expected: Output shows "✅ Database connected" and current timestamp, then "✅ Query works"

**Step 4: Clean up test file**

```bash
rm /Users/zafar/Documents/evercold/test-typeorm.ts
```

**Step 5: Commit**

```bash
cd /Users/zafar/Documents/evercold
git add src/lib/database.ts
git commit -m "feat: create TypeORM DataSource configuration"
```

---

## Phase 2: Entity Models (28 Entities)

### Task 3: Create Core Entity Models (Part 1: Customer & Order Domain)

**Files:**
- Create: `src/entities/Customer.ts`
- Create: `src/entities/CustomerBranch.ts`
- Create: `src/entities/Product.ts`
- Create: `src/entities/CustomerProductPrice.ts`
- Create: `src/entities/Order.ts`
- Create: `src/entities/OrderItem.ts`
- Create: `src/entities/Email.ts`

**Step 1: Create Customer entity**

Create `/Users/zafar/Documents/evercold/src/entities/Customer.ts`:

```typescript
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm'
import { CustomerBranch } from './CustomerBranch'
import { Order } from './Order'

@Entity('Customer')
export class Customer {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  customerCode: string

  @Column('text')
  name: string

  @Column('text', { nullable: true })
  email?: string

  @Column('text', { nullable: true })
  phone?: string

  @Column('text', { nullable: true })
  contactPerson?: string

  @Column('text', { nullable: true })
  contractNumber?: string

  @Column('text', { nullable: true })
  legalAddress?: string

  @Column('text', { nullable: true })
  organizationType?: string

  @Column('text', { nullable: true })
  innumber?: string

  @Column('text', { nullable: true })
  accountManager?: string

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  creditLimit?: number

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentDebt: number

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => CustomerBranch, branch => branch.customer, { cascade: true, onDelete: 'CASCADE' })
  branches: CustomerBranch[]

  @OneToMany(() => Order, order => order.customer, { cascade: true, onDelete: 'CASCADE' })
  orders: Order[]
}
```

**Step 2: Create CustomerBranch entity**

Create `/Users/zafar/Documents/evercold/src/entities/CustomerBranch.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Customer } from './Customer'
import { TechnicianBranchAssignment } from './TechnicianBranchAssignment'
import { ServiceTicket } from './ServiceTicket'
import { OrderItem } from './OrderItem'

@Entity('CustomerBranch')
export class CustomerBranch {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  customerId: string

  @Column('text')
  branchCode: string

  @Column('text')
  branchName: string

  @Column('text', { nullable: true })
  deliveryAddress?: string

  @Column('text', { nullable: true })
  coordinates?: string

  @Column('text', { nullable: true })
  oldBranchCode?: string

  @Column('boolean', { default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Customer, customer => customer.branches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer

  @OneToMany(() => TechnicianBranchAssignment, assignment => assignment.branch, { cascade: true })
  technicianAssignments: TechnicianBranchAssignment[]

  @OneToMany(() => ServiceTicket, ticket => ticket.branch, { cascade: true })
  serviceTickets: ServiceTicket[]

  @OneToMany(() => OrderItem, item => item.branch, { cascade: true })
  orderItems: OrderItem[]
}
```

**Step 3: Create Product entity**

Create `/Users/zafar/Documents/evercold/src/entities/Product.ts`:

```typescript
import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { OrderItem } from './OrderItem'
import { CustomerProductPrice } from './CustomerProductPrice'

@Entity('Product')
export class Product {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  name: string

  @Column('text', { nullable: true })
  sku?: string

  @Column('text', { nullable: true })
  barcode?: string

  @Column('text', { nullable: true })
  sapCode?: string

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number

  @Column('decimal', { precision: 5, scale: 2 })
  vatRate: number

  @Column('text', { nullable: true })
  category?: string

  @Column('text', { nullable: true })
  description?: string

  @Column('integer', { default: 0 })
  stock: number

  @Column('text', { nullable: true })
  unit?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => OrderItem, item => item.product, { cascade: true })
  orderItems: OrderItem[]

  @OneToMany(() => CustomerProductPrice, price => price.product, { cascade: true })
  customerPrices: CustomerProductPrice[]
}
```

**Step 4: Create CustomerProductPrice entity**

Create `/Users/zafar/Documents/evercold/src/entities/CustomerProductPrice.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Customer } from './Customer'
import { Product } from './Product'

@Entity('CustomerProductPrice')
export class CustomerProductPrice {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  customerId: string

  @Column('uuid')
  productId: string

  @Column('decimal', { precision: 12, scale: 2 })
  customPrice: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer

  @ManyToOne(() => Product, product => product.customerPrices, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product
}
```

**Step 5: Create Order entity**

Create `/Users/zafar/Documents/evercold/src/entities/Order.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Customer } from './Customer'
import { OrderItem } from './OrderItem'
import { Delivery } from './Delivery'
import { EdoDocumentSync } from './EdoDocumentSync'

export enum OrderStatus {
  NEW = 'NEW',
  CONFIRMED = 'CONFIRMED',
  PICKING = 'PICKING',
  PACKING = 'PACKING',
  READY = 'READY',
  SHIPPED = 'SHIPPED',
  PARTIAL = 'PARTIAL',
  COMPLETED = 'COMPLETED',
  INVOICED = 'INVOICED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export enum SourceType {
  DETAILED = 'DETAILED',
  REGISTRY = 'REGISTRY',
}

@Entity('Order')
export class Order {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  customerId: string

  @Column('text', { unique: true })
  orderNumber: string

  @Column('enum', { enum: OrderStatus, default: OrderStatus.NEW })
  status: OrderStatus

  @Column('enum', { enum: SourceType, default: SourceType.DETAILED })
  sourceType: SourceType

  @Column('date')
  orderDate: Date

  @Column('date', { nullable: true })
  requiredDeliveryDate?: Date

  @Column('decimal', { precision: 12, scale: 2 })
  totalAmount: number

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  paidAmount: number

  @Column('text', { unique: true, nullable: true })
  invoiceNumber?: string

  @Column('date', { nullable: true })
  invoiceDate?: Date

  @Column('text', { nullable: true })
  deliveryAddress?: string

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Customer, customer => customer.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customerId' })
  customer: Customer

  @OneToMany(() => OrderItem, item => item.order, { cascade: true, onDelete: 'CASCADE' })
  orderItems: OrderItem[]

  @OneToMany(() => Delivery, delivery => delivery.order, { cascade: true, onDelete: 'CASCADE' })
  deliveries: Delivery[]

  @OneToMany(() => EdoDocumentSync, sync => sync.order, { cascade: true, onDelete: 'CASCADE' })
  edoSync: EdoDocumentSync[]
}
```

**Step 6: Create OrderItem entity**

Create `/Users/zafar/Documents/evercold/src/entities/OrderItem.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Order } from './Order'
import { Product } from './Product'
import { CustomerBranch } from './CustomerBranch'
import { DeliveryItem } from './DeliveryItem'

@Entity('OrderItem')
export class OrderItem {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  orderId: string

  @Column('uuid')
  productId: string

  @Column('uuid', { nullable: true })
  branchId?: string

  @Column('integer')
  quantity: number

  @Column('decimal', { precision: 12, scale: 2 })
  unitPrice: number

  @Column('text', { nullable: true })
  sapCode?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Order, order => order.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order

  @ManyToOne(() => Product, product => product.orderItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product

  @ManyToOne(() => CustomerBranch, branch => branch.orderItems, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch?: CustomerBranch

  @OneToMany(() => DeliveryItem, item => item.orderItem, { cascade: true })
  deliveryItems: DeliveryItem[]
}
```

**Step 7: Create Email entity**

Create `/Users/zafar/Documents/evercold/src/entities/Email.ts`:

```typescript
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('Email')
export class Email {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  email: string

  @Column('text')
  gmailMessageId: string

  @Column('text', { nullable: true })
  subject?: string

  @Column('text', { nullable: true })
  from?: string

  @CreateDateColumn()
  createdAt: Date
}
```

**Step 8: Test entities load correctly**

```bash
cd /Users/zafar/Documents/evercold
npm run build
```

Expected: TypeScript compilation succeeds without errors in src/entities/

**Step 9: Commit**

```bash
cd /Users/zafar/Documents/evercold
git add src/entities/Customer.ts src/entities/CustomerBranch.ts src/entities/Product.ts src/entities/CustomerProductPrice.ts src/entities/Order.ts src/entities/OrderItem.ts src/entities/Email.ts
git commit -m "feat: create core entity models (Customer, Order, Product domain)"
```

---

### Task 4: Create Delivery & Logistics Entity Models (Part 2)

**Files:**
- Create: `src/entities/Delivery.ts`
- Create: `src/entities/DeliveryRoute.ts`
- Create: `src/entities/RouteStop.ts`
- Create: `src/entities/DeliveryChecklist.ts`
- Create: `src/entities/DeliveryPhoto.ts`
- Create: `src/entities/DeliveryItem.ts`

**Step 1: Create Delivery entity**

Create `/Users/zafar/Documents/evercold/src/entities/Delivery.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Order } from './Order'
import { Driver } from './Driver'
import { Vehicle } from './Vehicle'
import { DeliveryRoute } from './DeliveryRoute'
import { DeliveryChecklist } from './DeliveryChecklist'
import { DeliveryItem } from './DeliveryItem'

export enum DeliveryStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('Delivery')
export class Delivery {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  orderId: string

  @Column('uuid', { nullable: true })
  driverId?: string

  @Column('uuid', { nullable: true })
  vehicleId?: string

  @Column('uuid', { nullable: true })
  routeId?: string

  @Column('enum', { enum: DeliveryStatus, default: DeliveryStatus.PENDING })
  status: DeliveryStatus

  @Column('date')
  scheduledDate: Date

  @Column('time', { nullable: true })
  scheduledTime?: string

  @Column('text', { nullable: true })
  deliveryAddress?: string

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  totalDelivered?: number

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Order, order => order.deliveries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order

  @ManyToOne(() => Driver, driver => driver.deliveries, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver?: Driver

  @ManyToOne(() => Vehicle, vehicle => vehicle.deliveries, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle?: Vehicle

  @ManyToOne(() => DeliveryRoute, route => route.deliveries, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'routeId' })
  route?: DeliveryRoute

  @OneToMany(() => DeliveryChecklist, checklist => checklist.delivery, { cascade: true })
  checklists: DeliveryChecklist[]

  @OneToMany(() => DeliveryItem, item => item.delivery, { cascade: true })
  deliveryItems: DeliveryItem[]
}
```

**Step 2: Create DeliveryRoute entity**

Create `/Users/zafar/Documents/evercold/src/entities/DeliveryRoute.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Driver } from './Driver'
import { Vehicle } from './Vehicle'
import { Delivery } from './Delivery'
import { RouteStop } from './RouteStop'

@Entity('DeliveryRoute')
export class DeliveryRoute {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid', { nullable: true })
  driverId?: string

  @Column('uuid', { nullable: true })
  vehicleId?: string

  @Column('text')
  routeName: string

  @Column('date')
  routeDate: Date

  @Column('integer')
  stops: number

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  totalDistance: number

  @Column('text', { nullable: true })
  optimizationMethod?: string

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Driver, driver => driver.routes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver?: Driver

  @ManyToOne(() => Vehicle, vehicle => vehicle.routes, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle?: Vehicle

  @OneToMany(() => Delivery, delivery => delivery.route, { cascade: true })
  deliveries: Delivery[]

  @OneToMany(() => RouteStop, stop => stop.route, { cascade: true })
  routeStops: RouteStop[]
}
```

**Step 3: Create RouteStop entity**

Create `/Users/zafar/Documents/evercold/src/entities/RouteStop.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DeliveryRoute } from './DeliveryRoute'
import { Delivery } from './Delivery'

export enum RouteStopStatus {
  PENDING = 'PENDING',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

@Entity('RouteStop')
export class RouteStop {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  routeId: string

  @Column('uuid', { nullable: true })
  deliveryId?: string

  @Column('integer')
  stopNumber: number

  @Column('enum', { enum: RouteStopStatus, default: RouteStopStatus.PENDING })
  status: RouteStopStatus

  @Column('text', { nullable: true })
  address?: string

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude?: number

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude?: number

  @Column('time', { nullable: true })
  scheduledTime?: string

  @Column('time', { nullable: true })
  eta?: string

  @Column('time', { nullable: true })
  actualArrival?: string

  @Column('time', { nullable: true })
  actualDeparture?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => DeliveryRoute, route => route.routeStops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'routeId' })
  route: DeliveryRoute

  @ManyToOne(() => Delivery, delivery => delivery.deliveryItems, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deliveryId' })
  delivery?: Delivery
}
```

**Step 4: Create DeliveryChecklist entity**

Create `/Users/zafar/Documents/evercold/src/entities/DeliveryChecklist.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Delivery } from './Delivery'
import { DeliveryPhoto } from './DeliveryPhoto'

@Entity('DeliveryChecklist')
export class DeliveryChecklist {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  deliveryId: string

  @Column('boolean', { default: false })
  itemsVerified: boolean

  @Column('boolean', { default: false })
  photosCollected: boolean

  @Column('boolean', { default: false })
  signatureCollected: boolean

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Delivery, delivery => delivery.checklists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliveryId' })
  delivery: Delivery

  @OneToMany(() => DeliveryPhoto, photo => photo.checklist, { cascade: true })
  photos: DeliveryPhoto[]
}
```

**Step 5: Create DeliveryPhoto entity**

Create `/Users/zafar/Documents/evercold/src/entities/DeliveryPhoto.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm'
import { DeliveryChecklist } from './DeliveryChecklist'

@Entity('DeliveryPhoto')
export class DeliveryPhoto {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  checklistId: string

  @Column('text')
  photoUrl: string

  @Column('text', { nullable: true })
  caption?: string

  @CreateDateColumn()
  createdAt: Date

  @ManyToOne(() => DeliveryChecklist, checklist => checklist.photos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklistId' })
  checklist: DeliveryChecklist
}
```

**Step 6: Create DeliveryItem entity**

Create `/Users/zafar/Documents/evercold/src/entities/DeliveryItem.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Delivery } from './Delivery'
import { OrderItem } from './OrderItem'

export enum RejectionReason {
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DAMAGED = 'DAMAGED',
  WRONG_ITEM = 'WRONG_ITEM',
  CUSTOMER_REFUSED = 'CUSTOMER_REFUSED',
  ADDRESS_ISSUE = 'ADDRESS_ISSUE',
  QUANTITY_MISMATCH = 'QUANTITY_MISMATCH',
  OTHER = 'OTHER',
}

@Entity('DeliveryItem')
export class DeliveryItem {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  deliveryId: string

  @Column('uuid')
  orderItemId: string

  @Column('integer')
  deliveredQuantity: integer

  @Column('enum', { enum: RejectionReason, nullable: true })
  rejectionReason?: RejectionReason

  @Column('text', { nullable: true })
  rejectionNotes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Delivery, delivery => delivery.deliveryItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliveryId' })
  delivery: Delivery

  @ManyToOne(() => OrderItem, item => item.deliveryItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: OrderItem
}
```

**Step 7: Test entities compile**

```bash
cd /Users/zafar/Documents/evercold
npm run build
```

Expected: TypeScript compilation succeeds

**Step 8: Commit**

```bash
cd /Users/zafar/Documents/evercold
git add src/entities/Delivery.ts src/entities/DeliveryRoute.ts src/entities/RouteStop.ts src/entities/DeliveryChecklist.ts src/entities/DeliveryPhoto.ts src/entities/DeliveryItem.ts
git commit -m "feat: create delivery & logistics entity models"
```

---

### Task 5: Create Driver & Fleet Entity Models (Part 3)

**Files:**
- Create: `src/entities/Driver.ts`
- Create: `src/entities/DriverSession.ts`
- Create: `src/entities/Vehicle.ts`

**Step 1: Create Driver entity**

Create `/Users/zafar/Documents/evercold/src/entities/Driver.ts`:

```typescript
import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { DriverSession } from './DriverSession'
import { Vehicle } from './Vehicle'
import { Delivery } from './Delivery'
import { DeliveryRoute } from './DeliveryRoute'

export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

export enum DriverLocationStatus {
  OFFLINE = 'OFFLINE',
  IDLE = 'IDLE',
  IN_TRANSIT = 'IN_TRANSIT',
  AT_DELIVERY = 'AT_DELIVERY',
}

@Entity('Driver')
export class Driver {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  name: string

  @Column('text', { unique: true })
  phone: string

  @Column('text', { unique: true })
  licenseNumber: string

  @Column('enum', { enum: DriverStatus, default: DriverStatus.ACTIVE })
  status: DriverStatus

  @Column('text', { nullable: true })
  licenseExpiry?: string

  @Column('text', { nullable: true })
  address?: string

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude?: number

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude?: number

  @Column('enum', { enum: DriverLocationStatus, default: DriverLocationStatus.OFFLINE })
  locationStatus: DriverLocationStatus

  @Column('timestamp', { nullable: true })
  lastLocationUpdate?: Date

  @Column('integer', { default: 0 })
  deliveryCount: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => DriverSession, session => session.driver, { cascade: true })
  sessions: DriverSession[]

  @OneToMany(() => Vehicle, vehicle => vehicle.driver, { cascade: true })
  vehicles: Vehicle[]

  @OneToMany(() => Delivery, delivery => delivery.driver, { cascade: true })
  deliveries: Delivery[]

  @OneToMany(() => DeliveryRoute, route => route.driver, { cascade: true })
  routes: DeliveryRoute[]
}
```

**Step 2: Create DriverSession entity**

Create `/Users/zafar/Documents/evercold/src/entities/DriverSession.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Driver } from './Driver'

@Entity('DriverSession')
export class DriverSession {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  driverId: string

  @Column('text', { unique: true })
  token: string

  @Column('timestamp')
  expiresAt: Date

  @Column('text', { nullable: true })
  deviceInfo?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Driver, driver => driver.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'driverId' })
  driver: Driver
}
```

**Step 3: Create Vehicle entity**

Create `/Users/zafar/Documents/evercold/src/entities/Vehicle.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Driver } from './Driver'
import { Delivery } from './Delivery'
import { DeliveryRoute } from './DeliveryRoute'

export enum VehicleType {
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  DECOMMISSIONED = 'DECOMMISSIONED',
}

@Entity('Vehicle')
export class Vehicle {
  @PrimaryColumn('uuid')
  id: string

  @Column('text', { unique: true })
  plateNumber: string

  @Column('text')
  model: string

  @Column('enum', { enum: VehicleType })
  type: VehicleType

  @Column('decimal', { precision: 12, scale: 2 })
  capacity: number

  @Column('enum', { enum: VehicleStatus, default: VehicleStatus.ACTIVE })
  status: VehicleStatus

  @Column('uuid', { nullable: true })
  driverId?: string

  @Column('text', { nullable: true })
  registrationNumber?: string

  @Column('date', { nullable: true })
  registrationExpiry?: Date

  @Column('date', { nullable: true })
  lastServiceDate?: Date

  @Column('integer', { default: 0 })
  totalKilometers: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Driver, driver => driver.vehicles, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'driverId' })
  driver?: Driver

  @OneToMany(() => Delivery, delivery => delivery.vehicle, { cascade: true })
  deliveries: Delivery[]

  @OneToMany(() => DeliveryRoute, route => route.vehicle, { cascade: true })
  routes: DeliveryRoute[]
}
```

**Step 4: Test compilation**

```bash
cd /Users/zafar/Documents/evercold
npm run build
```

Expected: Succeeds

**Step 5: Commit**

```bash
cd /Users/zafar/Documents/evercold
git add src/entities/Driver.ts src/entities/DriverSession.ts src/entities/Vehicle.ts
git commit -m "feat: create driver & fleet entity models"
```

---

### Task 6: Create Technician & Service Entity Models (Part 4)

**Files:**
- Create: `src/entities/Technician.ts`
- Create: `src/entities/TechnicianBranchAssignment.ts`
- Create: `src/entities/ServiceTicket.ts`
- Create: `src/entities/ServiceCompletion.ts`
- Create: `src/entities/IssueCategory.ts`
- Create: `src/entities/IssueSubcategory.ts`

**Step 1: Create Technician entity**

Create `/Users/zafar/Documents/evercold/src/entities/Technician.ts`:

```typescript
import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { TechnicianBranchAssignment } from './TechnicianBranchAssignment'
import { ServiceTicket } from './ServiceTicket'
import { ServiceCompletion } from './ServiceCompletion'

export enum TechnicianStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
}

@Entity('Technician')
export class Technician {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  name: string

  @Column('text', { unique: true })
  phone: string

  @Column('enum', { enum: TechnicianStatus, default: TechnicianStatus.ACTIVE })
  status: TechnicianStatus

  @Column('text', { nullable: true })
  specialization?: string

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  latitude?: number

  @Column('decimal', { precision: 10, scale: 7, nullable: true })
  longitude?: number

  @Column('timestamp', { nullable: true })
  lastLocationUpdate?: Date

  @Column('integer', { default: 0 })
  ticketsCompleted: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => TechnicianBranchAssignment, assignment => assignment.technician, { cascade: true })
  branchAssignments: TechnicianBranchAssignment[]

  @OneToMany(() => ServiceTicket, ticket => ticket.assignedTechnician, { cascade: true })
  assignedTickets: ServiceTicket[]

  @OneToMany(() => ServiceCompletion, completion => completion.technician, { cascade: true })
  completions: ServiceCompletion[]
}
```

**Step 2: Create TechnicianBranchAssignment entity**

Create `/Users/zafar/Documents/evercold/src/entities/TechnicianBranchAssignment.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Technician } from './Technician'
import { CustomerBranch } from './CustomerBranch'

@Entity('TechnicianBranchAssignment')
export class TechnicianBranchAssignment {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  technicianId: string

  @Column('uuid')
  branchId: string

  @Column('boolean', { default: false })
  isPrimary: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => Technician, tech => tech.branchAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'technicianId' })
  technician: Technician

  @ManyToOne(() => CustomerBranch, branch => branch.technicianAssignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branchId' })
  branch: CustomerBranch
}
```

**Step 3: Create IssueCategory entity**

Create `/Users/zafar/Documents/evercold/src/entities/IssueCategory.ts`:

```typescript
import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { IssueSubcategory } from './IssueSubcategory'
import { ServiceTicket } from './ServiceTicket'

@Entity('IssueCategory')
export class IssueCategory {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  name: string

  @Column('text', { nullable: true })
  description?: string

  @Column('integer', { default: 0 })
  ticketCount: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => IssueSubcategory, sub => sub.category, { cascade: true })
  subcategories: IssueSubcategory[]

  @OneToMany(() => ServiceTicket, ticket => ticket.category, { cascade: true })
  tickets: ServiceTicket[]
}
```

**Step 4: Create IssueSubcategory entity**

Create `/Users/zafar/Documents/evercold/src/entities/IssueSubcategory.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { IssueCategory } from './IssueCategory'

@Entity('IssueSubcategory')
export class IssueSubcategory {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  categoryId: string

  @Column('text')
  name: string

  @Column('integer')
  slaResponseHours: number

  @Column('integer')
  slaResolutionHours: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => IssueCategory, category => category.subcategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: IssueCategory
}
```

**Step 5: Create ServiceTicket entity**

Create `/Users/zafar/Documents/evercold/src/entities/ServiceTicket.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { IssueCategory } from './IssueCategory'
import { IssueSubcategory } from './IssueSubcategory'
import { Technician } from './Technician'
import { CustomerBranch } from './CustomerBranch'
import { ServiceCompletion } from './ServiceCompletion'

export enum TicketStatus {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('ServiceTicket')
export class ServiceTicket {
  @PrimaryColumn('uuid')
  id: string

  @Column('text', { unique: true })
  ticketNumber: string

  @Column('uuid')
  categoryId: string

  @Column('uuid', { nullable: true })
  subcategoryId?: string

  @Column('uuid', { nullable: true })
  branchId?: string

  @Column('uuid', { nullable: true })
  assignedTechnicianId?: string

  @Column('enum', { enum: TicketStatus, default: TicketStatus.NEW })
  status: TicketStatus

  @Column('enum', { enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority

  @Column('text')
  description: string

  @Column('timestamp', { nullable: true })
  resolvedAt?: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => IssueCategory, category => category.tickets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: IssueCategory

  @ManyToOne(() => IssueSubcategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subcategoryId' })
  subcategory?: IssueSubcategory

  @ManyToOne(() => CustomerBranch, branch => branch.serviceTickets, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'branchId' })
  branch?: CustomerBranch

  @ManyToOne(() => Technician, tech => tech.assignedTickets, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedTechnicianId' })
  assignedTechnician?: Technician

  @OneToMany(() => ServiceCompletion, completion => completion.ticket, { cascade: true })
  completions: ServiceCompletion[]
}
```

**Step 6: Create ServiceCompletion entity**

Create `/Users/zafar/Documents/evercold/src/entities/ServiceCompletion.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { ServiceTicket } from './ServiceTicket'
import { Technician } from './Technician'

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('ServiceCompletion')
export class ServiceCompletion {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  ticketId: string

  @Column('uuid')
  technicianId: string

  @Column('text')
  workDescription: string

  @Column('decimal', { precision: 12, scale: 2 })
  laborCost: number

  @Column('text', { nullable: true })
  photos?: string

  @Column('enum', { enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  approvalStatus: ApprovalStatus

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => ServiceTicket, ticket => ticket.completions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  ticket: ServiceTicket

  @ManyToOne(() => Technician, tech => tech.completions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'technicianId' })
  technician: Technician
}
```

**Step 7: Test compilation**

```bash
cd /Users/zafar/Documents/evercold
npm run build
```

Expected: Succeeds

**Step 8: Commit**

```bash
cd /Users/zafar/Documents/evercold
git add src/entities/Technician.ts src/entities/TechnicianBranchAssignment.ts src/entities/IssueCategory.ts src/entities/IssueSubcategory.ts src/entities/ServiceTicket.ts src/entities/ServiceCompletion.ts
git commit -m "feat: create technician & service entity models"
```

---

### Task 7: Create User & Integration Entity Models (Part 5)

**Files:**
- Create: `src/entities/User.ts`
- Create: `src/entities/EdoIntegration.ts`
- Create: `src/entities/EdoDocumentSync.ts`

**Step 1: Create User entity**

Create `/Users/zafar/Documents/evercold/src/entities/User.ts`:

```typescript
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  VIEWER = 'VIEWER',
}

@Entity('User')
export class User {
  @PrimaryColumn('uuid')
  id: string

  @Column('text', { unique: true })
  email: string

  @Column('text')
  passwordHash: string

  @Column('enum', { enum: UserRole, default: UserRole.VIEWER })
  role: UserRole

  @Column('text', { nullable: true })
  name?: string

  @Column('boolean', { default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
```

**Step 2: Create EdoIntegration entity**

Create `/Users/zafar/Documents/evercold/src/entities/EdoIntegration.ts`:

```typescript
import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { EdoDocumentSync } from './EdoDocumentSync'

@Entity('EdoIntegration')
export class EdoIntegration {
  @PrimaryColumn('uuid')
  id: string

  @Column('text')
  providerName: string

  @Column('text')
  apiKey: string

  @Column('text', { nullable: true })
  apiSecret?: string

  @Column('text', { nullable: true })
  endpoint?: string

  @Column('boolean', { default: false })
  isActive: boolean

  @Column('text', { nullable: true })
  notes?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @OneToMany(() => EdoDocumentSync, sync => sync.integration, { cascade: true })
  syncs: EdoDocumentSync[]
}
```

**Step 3: Create EdoDocumentSync entity**

Create `/Users/zafar/Documents/evercold/src/entities/EdoDocumentSync.ts`:

```typescript
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { Order } from './Order'
import { EdoIntegration } from './EdoIntegration'

export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  RETRY = 'RETRY',
}

@Entity('EdoDocumentSync')
export class EdoDocumentSync {
  @PrimaryColumn('uuid')
  id: string

  @Column('uuid')
  integrationId: string

  @Column('uuid')
  orderId: string

  @Column('text', { unique: true })
  externalId: string

  @Column('enum', { enum: SyncStatus, default: SyncStatus.PENDING })
  status: SyncStatus

  @Column('text', { nullable: true })
  documentType?: string

  @Column('text', { nullable: true })
  externalLink?: string

  @Column('integer', { default: 0 })
  retryCount: number

  @Column('text', { nullable: true })
  errorMessage?: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @ManyToOne(() => EdoIntegration, integration => integration.syncs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'integrationId' })
  integration: EdoIntegration

  @ManyToOne(() => Order, order => order.edoSync, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order
}
```

**Step 4: Test all entities compile**

```bash
cd /Users/zafar/Documents/evercold
npm run build
```

Expected: TypeScript compilation succeeds. All 28 entity models should be created.

**Step 5: Update DataSource to export all entities**

The `/src/lib/database.ts` already imports all entities in Task 2. Verify it has all 28.

**Step 6: Commit**

```bash
cd /Users/zafar/Documents/evercold
git add src/entities/User.ts src/entities/EdoIntegration.ts src/entities/EdoDocumentSync.ts
git commit -m "feat: create user & integration entity models (all 28 entities complete)"
```

---

## Phase 3: Repository Pattern Layer (Database Access Abstraction)

### Task 8: Create Base Repository Class & Order Repository

**Files:**
- Create: `src/repositories/BaseRepository.ts`
- Create: `src/repositories/OrderRepository.ts`
- Create: `src/repositories/index.ts`

**Step 1: Create BaseRepository abstract class**

Create `/Users/zafar/Documents/evercold/src/repositories/BaseRepository.ts`:

```typescript
import { Repository, FindOptionsWhere, FindOptionsRelations, SaveOptions } from 'typeorm'
import { getDataSource } from '@/lib/database'

export abstract class BaseRepository<T> {
  protected repository: Repository<T>

  constructor(private entityClass: any) {}

  protected getRepository(): Repository<T> {
    const dataSource = getDataSource()
    return dataSource.getRepository(this.entityClass)
  }

  async findById(id: string, relations?: FindOptionsRelations<T>): Promise<T | null> {
    return this.getRepository().findOne({
      where: { id } as FindOptionsWhere<T>,
      relations,
    })
  }

  async findAll(relations?: FindOptionsRelations<T>): Promise<T[]> {
    return this.getRepository().find({ relations })
  }

  async find(where: FindOptionsWhere<T>, relations?: FindOptionsRelations<T>): Promise<T[]> {
    return this.getRepository().find({ where, relations })
  }

  async findOne(where: FindOptionsWhere<T>, relations?: FindOptionsRelations<T>): Promise<T | null> {
    return this.getRepository().findOne({ where, relations })
  }

  async create(entity: Partial<T>): Promise<T> {
    return this.getRepository().save(entity as T)
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.getRepository().update(id, data)
    return this.findById(id)
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.getRepository().delete(id)
    return (result.affected || 0) > 0
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.getRepository().count({ where })
  }
}
```

**Step 2: Create OrderRepository**

Create `/Users/zafar/Documents/evercold/src/repositories/OrderRepository.ts`:

```typescript
import { In, Between, Like, ILike } from 'typeorm'
import { Order, OrderStatus, SourceType } from '@/entities/Order'
import { BaseRepository } from './BaseRepository'
import { getDataSource } from '@/lib/database'

export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super(Order)
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.findOne({ orderNumber: orderNumber as any })
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Order | null> {
    return this.findOne({ invoiceNumber: invoiceNumber as any })
  }

  async findByCustomerIdWithItems(customerId: string): Promise<Order[]> {
    return this.find(
      { customerId: customerId as any },
      { orderItems: { product: true }, customer: true }
    )
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.find(
      { status: status as any },
      { customer: true, orderItems: { product: true } }
    )
  }

  async findByStatusMultiple(statuses: OrderStatus[]): Promise<Order[]> {
    const dataSource = getDataSource()
    return dataSource.getRepository(Order).find({
      where: { status: In(statuses) as any },
      relations: { customer: true, orderItems: { product: true } },
      order: { orderDate: 'DESC' },
    })
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    const dataSource = getDataSource()
    return dataSource.getRepository(Order).find({
      where: { orderDate: Between(startDate, endDate) as any },
      relations: { customer: true },
      order: { orderDate: 'DESC' },
    })
  }

  async searchByCustomerName(searchTerm: string): Promise<Order[]> {
    const dataSource = getDataSource()
    return dataSource
      .createQueryBuilder(Order, 'order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .leftJoinAndSelect('orderItems.product', 'product')
      .where('customer.name ILIKE :search', { search: `%${searchTerm}%` })
      .or('customer.customerCode ILIKE :search', { search: `%${searchTerm}%` })
      .orderBy('order.orderDate', 'DESC')
      .getMany()
  }

  async getOrdersWithDeliveries(limit: number = 50, offset: number = 0): Promise<[Order[], number]> {
    const dataSource = getDataSource()
    const [orders, total] = await dataSource.getRepository(Order).findAndCount({
      relations: { customer: true, orderItems: { product: true, branch: true }, deliveries: true },
      order: { orderDate: 'DESC' },
      take: limit,
      skip: offset,
    })
    return [orders, total]
  }

  async createOrderWithItems(orderData: Partial<Order>, items: any[]): Promise<Order> {
    const dataSource = getDataSource()
    const queryRunner = dataSource.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const order = await queryRunner.manager.save(Order, orderData)

      const orderItems = items.map(item => ({
        ...item,
        orderId: order.id,
      }))

      await queryRunner.manager.save('OrderItem', orderItems)

      await queryRunner.commitTransaction()
      return order
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }
}
```

**Step 3: Test OrderRepository methods work**

Create `/Users/zafar/Documents/evercold/test-repository.ts`:

```typescript
import 'reflect-metadata'
import { initializeDatabase } from '@/lib/database'
import { OrderRepository } from '@/repositories/OrderRepository'

async function testRepository() {
  try {
    await initializeDatabase()
    const orderRepo = new OrderRepository()

    // Test count
    const count = await orderRepo.count()
    console.log(`✅ Found ${count} orders in database`)

    // Test find all
    const orders = await orderRepo.findAll()
    console.log(`✅ Repository methods work`)
  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }
}

testRepository()
```

```bash
cd /Users/zafar/Documents/evercold
npx ts-node test-repository.ts
```

Expected: Shows count of existing orders and confirmation that repository works.

**Step 4: Clean up test file**

```bash
rm /Users/zafar/Documents/evercold/test-repository.ts
```

**Step 5: Commit**

```bash
cd /Users/zafar/Documents/evercold
git add src/repositories/BaseRepository.ts src/repositories/OrderRepository.ts
git commit -m "feat: create repository pattern base class and OrderRepository"
```

---

## Summary

This plan provides a phased TypeORM migration strategy:

1. **Phase 1** (Tasks 1-2): Install TypeORM, configure DataSource with PostgreSQL connection pooling
2. **Phase 2** (Tasks 3-7): Create all 28 entity models with proper relationships and enums
3. **Phase 3** (Task 8): Build repository pattern for database access abstraction

**Next Phase Tasks (Not in this plan, but following sequentially):**
- Phase 4: Create repositories for remaining 27 models (DeliveryRepository, CustomerRepository, etc.)
- Phase 5: Update all 38 API routes to use TypeORM repositories
- Phase 6: Convert 11 raw pg routes to TypeORM with QueryBuilder
- Phase 7: Update library files (tickets.ts, completions.ts, technicians.ts, auth.ts)
- Phase 8: Convert 7 transaction blocks to QueryRunner transactions
- Phase 9: Update enum imports in 16 files
- Phase 10: Comprehensive testing of all 72 API routes
- Phase 11: Deploy to production and monitor

**Key Implementation Notes:**
- All passwords and credentials handled via environment variables
- Connection pooling via pg driver with 10 connection pool size
- Transactions use QueryRunner for ACID compliance
- Cascading deletes configured at database level via @OneToMany relations
- Enums defined in entity files, exported for use throughout codebase
- Repository pattern provides abstraction layer for easy future ORM migration if needed
