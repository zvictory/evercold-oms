# EverCold CRM - Complete System Overview

## Executive Summary

**EverCold CRM** is a comprehensive enterprise resource planning (ERP) and customer relationship management (CRM) system designed for ice manufacturing and distribution business. The primary customer is **Korzinka**, a supermarket chain with 31+ retail branches across Tashkent, Uzbekistan.

**Core Capabilities:**
- Order management with Excel/Image import
- Fleet management with route optimization
- Real-time delivery tracking with GPS
- Service ticket system for equipment maintenance
- Telegram bot for order placement
- EDO (Electronic Document Circulation) integration
- Russian tax invoice generation (Schet-Faktura)
- Multi-branch delivery coordination

---

## 1. Technology Stack

### Frontend
- **Framework**: Next.js 16.0.10 with React 19.2.1
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with PostCSS
- **UI Libraries**:
  - Lucide React (icons)
  - @tanstack/react-table 8.21.3 (data tables)
  - signature_pad 5.1.3 (digital signatures)
  - react-webcam 7.2.0 (photo capture)
  - flatpickr 4.6.13 (date picker)

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma 7.1.0 with @prisma/adapter-pg
- **Database Client**: pg 8.16.3

### Maps & Geolocation
- **Yandex Maps**: Primary provider (routing, traffic, matrix API)
- **Google Maps**: @react-google-maps/api 2.20.7
- **Leaflet**: 1.9.4 + react-leaflet 5.0.0
- **MapLibre GL**: 5.14.0
- **Geospatial**:
  - node-geocoder 4.4.1 (address → coordinates)
  - haversine 1.1.1 (distance calculation)
  - @turf/turf 7.3.1 (geometric analysis)

### File Processing
- **Excel**:
  - exceljs 4.4.0 (creation/formatting)
  - xlsx 0.18.5 (parsing)
  - xml2js 0.6.2 (XML parsing)
- **Images**:
  - sharp 0.34.5 (optimization)
  - tesseract.js 7.0.0 (OCR for Russian/English)

### Integrations
- **Telegram**: telegraf 4.16.3
- **EDO**: didox 0.0.6 (Electronic Document Circulation)
- **HTTP Client**: axios 1.13.2
- **Date Libraries**: date-fns 4.1.0, dayjs 1.11.19
- **Caching**: lru-cache 11.2.4
- **UUID**: uuid 13.0.0

### Development
- **Testing**: Jest 29.7.0 with @testing-library/react
- **Linting**: ESLint 9
- **Type Checking**: TypeScript 5
- **Dev Tools**: ts-node 10.9.2, tsx 4.21.0

---

## 2. Database Schema

### Core Business Entities

#### Customer
Company organization (e.g., Korzinka supermarket chain)

**Fields:**
- `id`, `name`, `customerCode` (unique identifier)
- `contactPerson`, `email`, `phone`, `tg` (Telegram)
- `headquartersAddress`
- `contractNumber`, `contractDate`
- `inn` (Tax ID), `vatRegistrationCode`, `hasVat` (boolean)
- `bankAccount`, `mfo` (bank routing code)
- `isActive`, `notes`, `createdAt`, `updatedAt`

**Relations:**
- One-to-many: `branches[]`, `orders[]`, `productPrices[]`

---

#### CustomerBranch
Individual retail locations (31+ Korzinka stores)

**Fields:**
- `id`, `customerId`, `branchName`, `branchCode` (unique, e.g., "K013")
- `oldBranchCode`, `oldBranchName`, `fullName`
- `deliveryAddress`, `contactPerson`, `phone`, `email`
- `latitude`, `longitude`, `region`, `city`
- `operatingHours`, `isActive`, `notes`
- `createdAt`, `updatedAt`

**Relations:**
- Many-to-one: `customer`
- One-to-many: `orderItems[]`, `serviceTickets[]`, `technicianAssignments[]`

**Indexes:** `customerId`, `branchCode`

---

#### Product
Ice products in catalog

**Fields:**
- `id`, `name`, `sku`, `barcode` (unique), `sapCode` (unique)
- `unitPrice`, `unit` (default "ШТ"), `vatRate` (default 12.0)
- `description`, `isActive`
- `createdAt`, `updatedAt`

**Relations:**
- One-to-many: `customerPrices[]`, `orderItems[]`

**Indexes:** `barcode`, `sapCode`

---

#### CustomerProductPrice
Custom pricing per customer

**Fields:**
- `id`, `customerId`, `productId`, `unitPrice`
- `createdAt`, `updatedAt`

**Unique Constraint:** `[customerId, productId]`

---

### Order Management

#### Order
Sales orders from customers

**Fields:**
- `id`, `orderNumber` (unique), `invoiceNumber` (unique, nullable)
- `orderDate`, `customerId`, `contractInfo`
- **Status Enum:** `NEW`, `CONFIRMED`, `PICKING`, `PACKING`, `READY`, `SHIPPED`, `COMPLETED`, `INVOICED`, `PAID`, `CANCELLED`
- `subtotal`, `vatAmount`, `totalAmount`, `notes`
- `emailId`, `batchId`, `sourceType` (DETAILED or REGISTRY)
- `createdAt`, `updatedAt`

**Relations:**
- Many-to-one: `customer`, `email`
- One-to-many: `orderItems[]`, `edoSync[]`
- One-to-one: `delivery`

**Indexes:** `orderNumber`, `customerId`, `orderDate`, `status`, `batchId`

---

#### OrderItem
Line items in orders

**Fields:**
- `id`, `orderId`, `branchId`, `productId`, `productName`
- `barcode`, `sapCode`, `quantity`, `unitPrice`
- `subtotal`, `vatRate`, `vatAmount`, `totalAmount`
- **Delivery Status:** `PENDING`, `IN_TRANSIT`, `DELIVERED`, `FAILED`, `CANCELLED`
- `deliveryDate`, `notes`
- `createdAt`, `updatedAt`

**Relations:**
- Many-to-one: `order`, `product`, `branch`

**Indexes:** `orderId`, `branchId`, `productId`

---

### Delivery & Logistics

#### Delivery
Order fulfillment tracking

**Fields:**
- `id`, `orderId` (unique), `driverId`, `vehicleId`
- **Status:** `PENDING`, `IN_TRANSIT`, `DELIVERED`, `FAILED`, `CANCELLED`
- `scheduledDate`, `pickupTime`, `deliveryTime`
- `notes`, `createdAt`, `updatedAt`

**Relations:**
- One-to-one: `order`
- Many-to-one: `driver`, `vehicle`
- One-to-one: `checklist`, `routeStop`

**Indexes:** `status`, `driverId`, `vehicleId`, `scheduledDate`

---

#### Driver
Fleet personnel

**Fields:**
- `id`, `name`, `phone`, `email`
- `licenseNumber` (unique), `licenseExpiry`
- **Status:** `ACTIVE`, `INACTIVE`, `ON_LEAVE`
- `notes`, `createdAt`, `updatedAt`

**Relations:**
- One-to-many: `deliveries[]`, `routes[]`, `vehicles[]`

**Index:** `status`

---

#### Vehicle
Fleet assets

**Fields:**
- `id`, `plateNumber` (unique), `model`
- **Type:** `VAN`, `TRUCK`, `REFRIGERATED_VAN`, `REFRIGERATED_TRUCK`
- `capacity`, `driverId`
- **Status:** `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `RETIRED`
- `notes`, `createdAt`, `updatedAt`

**Relations:**
- Many-to-one: `driver`
- One-to-many: `deliveries[]`, `routes[]`

**Indexes:** `status`, `driverId`

---

#### DeliveryRoute
Optimized delivery routes

**Fields:**
- `id`, `routeName`, `driverId`, `vehicleId`, `scheduledDate`
- **Status:** `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `totalDistance`, `estimatedDuration`, `estimatedDurationWithTraffic`
- `actualStartTime`, `actualEndTime`
- **Optimization Method:** `haversine`, `yandex`
- `trafficDataTimestamp`, `routeGeometry` (encoded polyline)
- `trafficLevel`, `notes`
- `createdAt`, `updatedAt`

**Relations:**
- Many-to-one: `driver`, `vehicle`
- One-to-many: `stops[]`

**Indexes:** `driverId`, `vehicleId`, `scheduledDate`, `status`

---

#### RouteStop
Individual stops in delivery route

**Fields:**
- `id`, `routeId`, `deliveryId` (unique), `stopNumber`
- `distanceFromPrev`, `estimatedArrival`, `actualArrival`, `completedAt`
- **Status:** `PENDING`, `EN_ROUTE`, `ARRIVED`, `COMPLETED`, `SKIPPED`, `FAILED`
- `estimatedDurationWithTraffic`, `turnByTurnInstructions`
- `liveETA`, `originalETA`, `alternativeRoutes`
- `notes`, `createdAt`, `updatedAt`

**Relations:**
- Many-to-one: `route`, `delivery`

**Indexes:** `routeId`, `deliveryId`, `status`

---

#### DeliveryChecklist
Delivery completion verification

**Fields:**
- `id`, `deliveryId` (unique)
- `itemsVerified` (boolean), `verifiedItems` (JSON)
- `signatureUrl`, `signedBy`, `signedAt`
- `photos` (JSON array), `notes`, `issueCategory`
- `createdAt`, `updatedAt`

**Relations:**
- One-to-one: `delivery`
- One-to-many: `photos_rel[]`

**Index:** `deliveryId`

---

#### DeliveryPhoto
Photo attachments for deliveries

**Fields:**
- `id`, `checklistId`, `photoUrl`, `photoType`, `caption`, `uploadedAt`

**Relations:**
- Many-to-one: `checklist`

**Index:** `checklistId`

---

### Service/Technical Support

#### ServiceTicket
Service requests for equipment maintenance

**Fields:**
- `id`, `ticketNumber` (unique, format: `TKT-YYYYMM-00001`)
- `externalId`, `branchId`, `categoryId`, `subcategoryId`
- `contactName`, `contactRole`, `contactPhone`, `description`
- `assignedTechnicianId`, `dispatcherId`
- **Status:** `NEW`, `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CLOSED`
- **Priority:** `CRITICAL`, `HIGH`, `NORMAL`, `LOW`
- `createdAt`, `firstResponseAt`, `completedAt`, `closedAt`
- `internalNotes`, `storeNotes`, `updatedAt`

**Relations:**
- Many-to-one: `assignedTechnician`, `branch`, `category`, `subcategory`
- One-to-one: `completion`

**Indexes:** `status`, `priority`, `branchId`, `assignedTechnicianId`, `createdAt`

---

#### Technician
Service technicians

**Fields:**
- `id`, `name`, `phone`, `email`
- **Status:** `ACTIVE`, `INACTIVE`, `ON_LEAVE`
- `latitude`, `longitude`, `lastLocationUpdate`
- `createdAt`, `updatedAt`

**Relations:**
- One-to-many: `completedServices[]`, `assignedTickets[]`, `branchAssignments[]`

**Index:** `status`

---

#### TechnicianBranchAssignment
Territory assignments for technicians

**Fields:**
- `id`, `technicianId`, `branchId`, `isPrimary` (boolean, default true)
- `serviceTerritory`, `assignedDate`, `startDate`, `endDate`
- `createdAt`, `updatedAt`

**Unique Constraint:** `[technicianId, branchId, isPrimary]`

**Relations:**
- Many-to-one: `technician`, `branch`

**Indexes:** `technicianId`, `branchId`, `isPrimary`

---

#### ServiceCompletion
Work completion records

**Fields:**
- `id`, `ticketId` (unique), `completedBy`, `completedAt`
- `workDescription`, `laborHours`, `laborCostPerHour`
- `partsJson` (JSON), `partsCost`, `laborCost`, `totalCost`
- `photosJson` (JSON), `signatureUrl`, `signedBy`, `signedAt`
- **Approval Status:** `PENDING`, `APPROVED`, `REJECTED`
- `approvalNotes`, `technicianId`
- `createdAt`, `updatedAt`

**Relations:**
- One-to-one: `ticket`
- Many-to-one: `technician`

**Indexes:** `ticketId`, `approvalStatus`

---

#### IssueCategory & IssueSubcategory
Support taxonomy with SLA definitions

**IssueCategory Fields:**
- `id`, `name` (unique), `createdAt`, `updatedAt`

**IssueSubcategory Fields:**
- `id`, `categoryId`, `name`
- SLA Response Times (minutes):
  - `criticalResponseTime`, `highResponseTime`, `normalResponseTime`, `lowResponseTime`
- SLA Resolution Times (minutes):
  - `criticalResolutionTime`, `highResolutionTime`, `normalResolutionTime`, `lowResolutionTime`
- `createdAt`, `updatedAt`

**Relations:**
- Category → Many subcategories
- Subcategory → Many tickets

---

### Integration & Email

#### Email
Incoming email tracking for order imports

**Fields:**
- `id`, `gmailMessageId` (unique), `subject`, `fromEmail`, `receivedDate`
- `attachmentFilename`, `processed`, `processedAt`
- `errorMessage`, `rawContent`, `createdAt`

**Relations:**
- One-to-many: `orders[]`

---

#### EdoIntegration
EDO (Electronic Document Circulation) system connections

**Fields:**
- `id`, `name`, `provider` (DIDOX, Hippo, Faktura)
- `apiUrl`, `apiKey`, `apiSecret`, `username`, `password`
- `organizationId`, `isActive`, `lastSyncAt`
- `syncInterval` (seconds), `autoSync` (boolean)
- `createdAt`, `updatedAt`

**Relations:**
- One-to-many: `documents[]`

**Indexes:** `provider`, `isActive`

---

#### EdoDocumentSync
Document synchronization log

**Fields:**
- `id`, `integrationId`, `orderId`
- `documentType` (order, invoice, etc.), `documentNumber`, `externalId`
- **Status:** `pending`, `syncing`, `synced`, `failed`
- **Direction:** `upload`, `download`
- `documentData` (JSON), `errorMessage`, `syncedAt`
- `createdAt`, `updatedAt`

**Unique Constraint:** `[integrationId, externalId]`

**Relations:**
- Many-to-one: `integration`, `order`

**Indexes:** `integrationId`, `orderId`, `status`, `externalId`

---

#### User
System users

**Fields:**
- `id`, `name`, `email` (unique), `passwordHash`
- **Role:** `ADMIN`, `MANAGER`, `VIEWER`
- `isActive`, `createdAt`, `updatedAt`

---

## 3. API Endpoints (61 Total)

### Orders (8 endpoints)
- `GET /api/orders` - List all orders with filters
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get order details
- `PATCH /api/orders/[id]` - Update order
- `GET /api/orders/[id]/items` - Get order items
- `POST /api/orders/[id]/schet-faktura` - Generate invoice for order
- `POST /api/orders/bulk-schet-faktura` - Bulk invoice generation
- `GET /api/orders/export` - Export orders to CSV/Excel

### Customers (8 endpoints)
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PATCH /api/customers/[id]` - Update customer
- `GET /api/customers/[id]/branches` - List branches for customer
- `POST /api/customers/[id]/branches` - Create branch
- `GET /api/customers/[id]/branches/[branchId]` - Get branch
- `PATCH /api/customers/[id]/branches/[branchId]` - Update branch

### Branches (4 endpoints)
- `GET /api/branches` - List all branches
- `GET /api/branches/[id]` - Get branch details
- `GET /api/branches/[id]/technicians` - List assigned technicians
- `GET /api/customer-branches` - Unified branch listing

### Deliveries (5 endpoints)
- `GET /api/deliveries` - List deliveries (filter by status)
- `POST /api/deliveries` - Create delivery
- `GET /api/deliveries/[id]` - Get delivery details
- `PATCH /api/deliveries/[id]` - Update delivery
- `POST /api/deliveries/[id]/checklist/complete` - Complete delivery (signature, photos, verification)

### Routes (10 endpoints)
- `GET /api/routes` - List routes (filter by status, driver, date)
- `POST /api/routes/optimize` - Optimize delivery route
- `GET /api/routes/[routeId]` - Get route details
- `PATCH /api/routes/[routeId]` - Update route
- `POST /api/routes/[routeId]/start` - Start route execution
- `POST /api/routes/[routeId]/complete` - Complete route
- `POST /api/routes/[routeId]/reroute` - Recalculate with current traffic
- `GET /api/routes/[routeId]/alternatives` - Get alternative routes
- `POST /api/routes/[routeId]/eta-stream` - Stream live ETA updates
- `PATCH /api/routes/[routeId]/stops/[stopId]` - Update route stop status

### Drivers (4 endpoints)
- `GET /api/drivers` - List drivers
- `POST /api/drivers` - Create driver
- `GET /api/drivers/[id]` - Get driver details
- `PATCH /api/drivers/[id]` - Update driver

### Vehicles (4 endpoints)
- `GET /api/vehicles` - List vehicles
- `POST /api/vehicles` - Create vehicle
- `GET /api/vehicles/[id]` - Get vehicle details
- `PATCH /api/vehicles/[id]` - Update vehicle

### Technicians (5 endpoints)
- `GET /api/technicians` - List technicians
- `POST /api/technicians` - Create technician
- `GET /api/technicians/[id]` - Get technician details
- `PATCH /api/technicians/[id]` - Update technician
- `POST /api/technicians/[id]/assign` - Assign to branch

### Service Tickets (7 endpoints)
- `GET /api/tickets` - List tickets (filter by status, priority, branch, technician)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/[id]` - Get ticket details
- `PATCH /api/tickets/[id]` - Update ticket
- `POST /api/tickets/[id]/complete` - Mark ticket completed
- `GET /api/completions/[id]/approve` - Get approval details
- `PATCH /api/completions/[id]/approve` - Approve/reject completion

### Issue Categories (4 endpoints)
- `GET /api/issue-categories` - List categories
- `POST /api/issue-categories` - Create category
- `GET /api/issue-categories/[id]/subcategories` - List subcategories
- `POST /api/issue-categories/[id]/subcategories` - Create subcategory

### Yandex Maps (2 endpoints)
- `GET /api/yandex/routes` - Get single route with traffic data
- `GET /api/yandex/matrix` - Get distance/duration matrix

### EDO Integration (7 endpoints)
- `GET /api/edo/integrations` - List EDO integrations
- `POST /api/edo/integrations` - Create integration
- `GET /api/edo/integrations/[id]` - Get integration details
- `PATCH /api/edo/integrations/[id]` - Update integration
- `POST /api/edo/test-connection` - Test EDO connection
- `POST /api/edo/sync/upload` - Upload document to EDO
- `POST /api/edo/sync/download` - Download from EDO
- `GET /api/edo/sync/status` - Get sync status

### File Uploads (3 endpoints)
- `POST /api/upload-purchase-order` - Upload and parse Excel order file
- `POST /api/upload-image` - Upload image for OCR parsing
- `POST /api/upload` - Generic file upload

### Photos (3 endpoints)
- `POST /api/photos/upload` - Upload delivery photos
- `GET /api/photos/presigned-url` - Get S3/storage presigned URL
- `POST /api/photos/sync` - Sync photos from mobile

### Analytics (2 endpoints)
- `GET /api/analytics` - System analytics dashboard
- `GET /api/analytics/sla` - SLA metrics and reporting

### Admin (2 endpoints)
- `POST /api/admin/add-vehicles-drivers` - Bulk add fleet
- `POST /api/admin/customer-prices` - Bulk update pricing

### Telegram (1 endpoint)
- `POST /api/telegram/webhook` - Telegram bot webhook handler

### Cron Jobs (1 endpoint)
- `POST /api/cron/escalate-tickets` - Automatic ticket escalation

---

## 4. Core Features

### 1. Order Management
- **Multi-format Excel Import**:
  - Detailed Format: Single-branch orders with product rows
  - Registry Format: Multi-branch matrix with branch codes in columns
- **Image-based Order Entry**: OCR for extracting order data from photos
- **Order Status Workflow**: NEW → CONFIRMED → PICKING → PACKING → READY → SHIPPED → COMPLETED → INVOICED → PAID
- **Multi-branch Orders**: Orders can have items for different customer branches
- **Invoice Generation**: Schet-Faktura (Russian tax invoices) in Excel format
- **Bulk Operations**: Bulk invoice generation for multiple orders
- **Order Export**: CSV/Excel export with filtering

### 2. Customer Management
- **Customer Profiles**: Full company details with contract info, VAT status, bank accounts
- **Branch Management**: 31+ Korzinka branches with GPS coordinates and delivery addresses
- **Custom Pricing**: Per-customer/per-product price override system
- **Contact Tracking**: Contact persons, phone, email for each branch

### 3. Delivery & Fleet Management
- **Route Optimization**:
  - Nearest Neighbor algorithm with priority weighting
  - Haversine distance calculation
  - Yandex Maps integration for real-time traffic data
  - Alternative route suggestions
- **Real-time ETA**: Live estimated arrival times updated every 5 minutes
- **Turn-by-turn Navigation**: Driver navigation with visual/audio cues
- **Delivery Confirmation**:
  - GPS tracking
  - Item verification
  - Photo capture (multiple angles)
  - Digital signature collection
- **Fleet Management**: Vehicles with capacity tracking, maintenance status, driver assignment

### 4. Service/Technical Support
- **Ticket System**: Create, assign, track service requests
- **SLA Monitoring**: Response and resolution time tracking per priority level
- **Automatic Assignment**: Primary technician per branch automatically assigned
- **Escalation**: Auto-escalate tickets if no response within SLA
- **Work Completion**: Labor hours, parts costs, photos, signatures
- **Approval Workflow**: Manager approval of completed work

### 5. Maps & Navigation
- **Yandex Maps**:
  - Real-time traffic data
  - Route optimization with traffic
  - Distance/duration matrix API
  - Turn-by-turn instructions
  - Alternative routes
  - LRU cache (5-minute TTL for traffic, 24-hour for static routes)
- **Multi-provider Support**: Yandex, Google Maps, Leaflet
- **Geocoding**: Address to coordinates conversion

### 6. EDO (Electronic Document Circulation)
- **Multi-provider**:
  - DIDOX (Russia's largest EDO)
  - Hippo
  - Faktura
- **Document Types**: Orders, invoices, delivery confirmations
- **Operations**: Upload, download, status tracking
- **Sync Management**: Automatic retry on failure

### 7. Telegram Bot
- **Order Creation**: Complete order flow via Telegram
- **Customer Lookup**: Phone-based customer identification
- **Product Selection**: Browse products with custom pricing
- **Order Confirmation**: Review and submit
- **Notifications**:
  - Ticket creation
  - Ticket assignment
  - Ticket escalation
  - Work completion

### 8. Image Processing
- **OCR**: Tesseract.js for Russian/English text extraction
- **Preprocessing**: Grayscale, normalization, sharpening via Sharp
- **Order Parsing**: Extract structured data from order images

### 9. Invoice Generation
- **Schet-Faktura Templates**: Russian tax invoice format
- **Features**:
  - Multi-copy printing (customer/supplier/accounting/archive)
  - VAT calculations
  - Signature/stamp areas
  - Custom headers with branch info
- **Bulk Generation**: Process multiple orders at once

---

## 5. Business Workflows

### Order Processing
1. **Upload/Import** → Excel or Image parsing
2. **Create Order** → Store with status=NEW
3. **Confirmation** → Status=CONFIRMED
4. **Picking** → Warehouse preparation (status=PICKING)
5. **Packing** → Status=PACKING
6. **Ready** → Status=READY
7. **Shipment** → Create delivery, assign driver/vehicle
8. **In Transit** → Driver confirms pickup
9. **Delivery** → Item verification, photos, signature
10. **Completed** → Status=COMPLETED
11. **Invoicing** → Generate Schet-Faktura
12. **Payment** → Status=PAID

### Route Optimization
1. **Input**: Deliveries with branch coordinates
2. **Algorithm**:
   - Start at warehouse depot (41.2995, 69.2401)
   - Nearest Neighbor with priority weighting
   - Distance via Haversine or Yandex Maps
3. **Output**:
   - Optimized stop sequence
   - Total distance and time
   - Turn-by-turn instructions
4. **Real-time Updates**:
   - Traffic monitoring every 5 minutes
   - ETA recalculation
   - Delay alerts if >15 minutes behind

### Service Ticket Lifecycle
1. **Creation** → Generate ticket number (TKT-YYYYMM-NNNNN)
2. **Auto-Assignment** → Primary technician for branch
3. **Notification** → Telegram alert to technician/dispatcher
4. **Response** → Technician accepts (firstResponseAt)
5. **Work** → Status=IN_PROGRESS
6. **Escalation** → If no response within SLA, escalate to backup
7. **Completion** → Submit work details, photos, signature
8. **Approval** → Manager review
9. **Closure** → Status=CLOSED
10. **SLA Tracking** → Monitor response/resolution times

### Telegram Bot Order Flow
1. User sends `/order`
2. Request phone number (contact button)
3. Lookup customer by phone
4. If new → ask company name and address
5. Show available branches
6. List products with pricing
7. Add items with quantities
8. Review order summary
9. Submit → creates Order in database
10. Confirmation with order number

---

## 6. Integration Points

### Yandex Maps API
- **Endpoints**:
  - `https://api.routing.yandex.net/v2/route` - Single route
  - `https://api.routing.yandex.net/v2/matrix` - Distance matrix
- **Features**:
  - Real-time traffic (duration_in_traffic)
  - Turn-by-turn instructions
  - Alternative routes
  - Polyline geometry
- **Rate Limits**:
  - 5 requests/second
  - 25,000 requests/day (free tier)
- **Caching**:
  - 5 minutes for traffic data
  - 24 hours for static routes

### Telegram Bot API
- **Library**: telegraf (Node.js)
- **Features**:
  - Inline keyboards
  - Contact button for phone
  - Message editing
  - Webhooks
- **Notifications**:
  - ticket_created
  - ticket_assigned
  - ticket_escalated
  - ticket_completed

### EDO Providers
- **DIDOX**: Russia's largest EDO
- **Hippo**: Alternative provider
- **Faktura**: Invoice-specific
- **Operations**:
  - Document upload/download
  - Status polling
  - Error tracking with retry

### Image Processing
- **Tesseract.js**: OCR (Russian/English)
- **Sharp**: Image preprocessing
  - Grayscale conversion
  - Normalization
  - Sharpening

---

## 7. Configuration

### Environment Variables
```env
DATABASE_URL=postgresql://user@localhost:5432/evercold_crm
YANDEX_MAPS_API_KEY=<key>
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=<key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<key>
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_DISPATCHER_CHAT_ID=<id>
TELEGRAM_ADMIN_CHAT_ID=<id>
TELEGRAM_TECHNICIAN_CHAT_ID=<id>
CRON_SECRET=<secret>
```

### Yandex Maps Config
- Depot Coordinates: (41.2995, 69.2401) - Tashkent warehouse
- Cache: 500 entries, 5-min TTL for traffic
- Rate Limit: 5 req/sec, 25k/day
- Traffic Update: 60 seconds
- ETA Recalc: 5 minutes

---

## 8. Business Context

**Company**: EverCold (ice manufacturing and distribution)
**Primary Customer**: Korzinka (supermarket chain, 31+ branches)
**Location**: Tashkent, Uzbekistan
**Products**: Packaged ice (1kg, 3kg units)
**Business Model**: B2B wholesale to retail chains

**Key Operations**:
1. Order management from multiple customer locations
2. Warehouse picking and packing
3. Route optimization for delivery efficiency
4. Real-time delivery tracking
5. Technician dispatch for refrigeration equipment maintenance
6. Russian tax invoice generation (Schet-Faktura)
7. EDO integration for electronic document exchange
8. Telegram bot for customer order placement

---

## 9. Project Structure

```
src/
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Main upload page
│   ├── api/                     # 61 API endpoints
│   ├── orders/                  # Order pages
│   ├── customers/               # Customer management
│   ├── dispatcher/              # Dispatcher dashboard
│   ├── driver/                  # Driver app
│   ├── tech/                    # Technician app
│   ├── routes/                  # Route management
│   ├── tickets/                 # Service tickets
│   ├── edo/                     # EDO integration
│   └── settings/                # Settings
│
├── lib/                         # Business logic
│   ├── parsers/                # File parsers
│   ├── routeOptimizer.ts       # Route optimization
│   ├── yandexRoutingService.ts # Yandex integration
│   ├── telegram/               # Telegram bot
│   ├── excel/                  # Invoice generation
│   └── edo/                    # EDO connectors
│
├── components/                  # React components
│   ├── Map/                    # Map components
│   ├── Driver/                 # Driver components
│   └── Navigation/             # Navigation
│
├── config/                      # Configuration
└── types/                       # TypeScript types

prisma/
├── schema.prisma               # Database schema
├── migrations/                 # Migrations
└── seed.ts                     # Seed data
```

---

## 10. Key Algorithms

### Order Amount Calculation
```
subtotal = SUM(quantity × unitPrice for each item)
vatAmount = subtotal × vatRate / 100
totalAmount = subtotal + vatAmount
```

### Route Optimization
```
Start at warehouse depot
While unvisited locations exist:
  Find nearest unvisited location
  Apply priority weighting
  Add to route
  Mark as visited
Calculate total distance and time
Return to depot (if returnToDepot=true)
```

### SLA Time Thresholds
- **CRITICAL**: 60 min response, 240 min resolution
- **HIGH**: 240 min response, 1440 min resolution
- **NORMAL**: 1440 min response, 2880 min resolution
- **LOW**: 2880 min response, 4320 min resolution

---

## 11. Current Status

- **Next.js App**: Running on http://localhost:3002
- **Telegram Bot**: Active via webhook at https://stupid-cups-love.loca.lt/api/telegram/webhook
- **Bot Token**: 8278817835:AAHAMW7BIYBmpPJagODSuwZovZjMgGb_EN8
- **Bot Username**: @evercoldbot
- **Database**: PostgreSQL (local)

---

## Summary

EverCold CRM is a comprehensive, production-ready system combining:
- **ERP capabilities** (order, inventory, delivery management)
- **CRM features** (customer/branch management, custom pricing)
- **Fleet optimization** (route planning with real-time traffic)
- **Service management** (ticket system with SLA tracking)
- **Multi-channel integration** (Telegram bot, EDO, email)
- **Document automation** (Russian tax invoices)

The system is built with modern technologies (Next.js, TypeScript, Prisma, PostgreSQL) and integrates with external services (Yandex Maps, Telegram, EDO providers) to provide a complete solution for B2B distribution operations.
