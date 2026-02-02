# Service Ticket System Design

**Date**: 2025-12-30
**Purpose**: Manage cooling system service requests from Korzinka market branches
**Status**: Design Approved

---

## Overview

A separate, independent ticket management system for EverCold's cooling equipment service operations. Tickets are created manually by staff and auto-assigned to technicians based on pre-configured branch-technician relationships. The system tracks service completion with photo evidence, store manager signatures, and cost data.

---

## Core Principles

- **Separate Domain**: Completely independent from existing Order/Delivery/Product system
- **Branch-Based**: Uses existing CustomerBranch as service location reference
- **Auto-Assignment**: Primary technician → escalate to secondary if SLA missed
- **Location-Aware**: Track technician locations for smart dispatch and real-time tracking
- **Full Documentation**: Photo evidence, signatures, cost tracking for every service

---

## Data Models

### Technician

Represents service technicians who complete repairs.

```prisma
model Technician {
  id                    String    @id @default(cuid())
  name                  String
  phone                 String
  email                 String?
  status                TechnicianStatus @default(ACTIVE)

  // Location tracking
  latitude              Float?
  longitude             Float?
  lastLocationUpdate    DateTime?

  // Relationships
  branchAssignments     TechnicianBranchAssignment[]
  assignedTickets       ServiceTicket[]
  completedServices     ServiceCompletion[]

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([status])
}

enum TechnicianStatus {
  ACTIVE
  INACTIVE
  ON_LEAVE
}
```

### TechnicianBranchAssignment

Maps technicians to branches (service territories). Defines primary/secondary responsibility.

```prisma
model TechnicianBranchAssignment {
  id                    String    @id @default(cuid())
  technicianId          String
  branchId              String

  isPrimary             Boolean   @default(true)  // true = primary, false = secondary
  serviceTerritory      String?   // Optional description of service area

  assignedDate          DateTime  @default(now())
  startDate             DateTime?
  endDate               DateTime? // When technician stops serving this branch

  technician            Technician @relation(fields: [technicianId], references: [id], onDelete: Cascade)
  branch                CustomerBranch @relation(fields: [branchId], references: [id], onDelete: Cascade)

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@unique([technicianId, branchId, isPrimary])
  @@index([technicianId])
  @@index([branchId])
  @@index([isPrimary])
}
```

### ServiceTicket

Main ticket entity for service requests.

```prisma
model ServiceTicket {
  id                    String    @id @default(cuid())
  ticketNumber          String    @unique  // Auto: TKT-YYYYMM-XXXXX
  externalId            String?   // From incoming message (e.g., "96931")

  // Branch reference (service location only)
  branchId              String
  branch                CustomerBranch @relation(fields: [branchId], references: [id])

  // Contact info (from branch, stored locally for audit trail)
  contactName           String?
  contactRole           String?   // "Manager", "Supervisor"
  contactPhone          String?

  // Issue classification
  categoryId            String
  subcategoryId         String
  category              IssueCategory @relation(fields: [categoryId], references: [id])
  subcategory           IssueSubcategory @relation(fields: [subcategoryId], references: [id])
  description           String    // Detailed issue description

  // Assignment
  assignedTechnicianId  String?
  assignedTechnician    Technician? @relation(fields: [assignedTechnicianId], references: [id], onDelete: SetNull)
  dispatcherId          String?   // Staff member who created/manages ticket

  // Status & Priority
  status                TicketStatus @default(NEW)
  priority              TicketPriority @default(NORMAL)

  // SLA Tracking
  createdAt             DateTime  @default(now())
  firstResponseAt       DateTime? // When tech accepts/responds
  completedAt           DateTime? // When service work finished
  closedAt              DateTime? // When store approves/closes

  // Notes
  internalNotes         String?   // Dispatcher notes
  storeNotes            String?   // Feedback from store

  // Relationships
  completion            ServiceCompletion?

  updatedAt             DateTime  @updatedAt

  @@index([status])
  @@index([priority])
  @@index([branchId])
  @@index([assignedTechnicianId])
  @@index([createdAt])
}

enum TicketStatus {
  NEW               // Just created
  ASSIGNED          // Assigned to technician
  IN_PROGRESS       // Technician started work
  COMPLETED         // Work done, awaiting approval
  CLOSED            // Approved and closed
}

enum TicketPriority {
  CRITICAL          // Equipment not working, food safety risk
  HIGH              // Degraded performance, temperature issues
  NORMAL            // Standard repairs
  LOW               // Preventive, consultations
}
```

### IssueCategory & IssueSubcategory

Issue type classification with SLA definitions.

```prisma
model IssueCategory {
  id                    String    @id @default(cuid())
  name                  String    // e.g., "Cooling Equipment Problems"
  description           String?

  subcategories         IssueSubcategory[]
  tickets               ServiceTicket[]

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([name])
}

model IssueSubcategory {
  id                    String    @id @default(cuid())
  categoryId            String

  name                  String    // e.g., "Cold Chambers", "Glass Repair"
  description           String?

  // SLA Response times (in minutes) by priority
  slaResponseCritical   Int       @default(60)    // CRITICAL: 1 hour
  slaResponseHigh       Int       @default(240)   // HIGH: 4 hours
  slaResponseNormal     Int       @default(1440)  // NORMAL: 24 hours
  slaResponseLow        Int       @default(2880)  // LOW: 48 hours

  // SLA Resolution times (in minutes) by priority
  slaResolutionCritical Int      @default(240)   // CRITICAL: 4 hours
  slaResolutionHigh     Int      @default(1440)  // HIGH: 24 hours
  slaResolutionNormal   Int      @default(2880)  // NORMAL: 48 hours
  slaResolutionLow      Int      @default(4320)  // LOW: 72 hours

  category              IssueCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  tickets               ServiceTicket[]

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([categoryId])
}
```

### ServiceCompletion

Service work documentation: photos, signature, parts, costs.

```prisma
model ServiceCompletion {
  id                    String    @id @default(cuid())
  ticketId              String    @unique

  completedBy           String    // Technician ID
  completedAt           DateTime

  // Work details
  workDescription       String    // What was done
  laborHours            Float     // e.g., 2.5
  laborCostPerHour      Float     // From technician/branch pricing

  // Parts used
  partsJson             String    // JSON: [{name, quantity, unitCost, total}]

  // Auto-calculated
  partsCost             Float
  laborCost             Float
  totalCost             Float

  // Photos
  photosJson            String    // JSON: [{url, type, caption}]

  // Signature
  signatureUrl          String?
  signedBy              String?   // Store manager name
  signedAt              DateTime?

  // Approval
  approvalStatus        ApprovalStatus @default(PENDING)
  approvalNotes         String?   // If rejected, reason

  // Audit
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  ticket                ServiceTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@index([ticketId])
  @@index([approvalStatus])
}

enum ApprovalStatus {
  PENDING       // Awaiting store manager review
  APPROVED      // Store manager approved
  REJECTED      // Need revision
}
```

### Extension to CustomerBranch

Add to existing model:

```prisma
// In CustomerBranch model, add:
technicianAssignments TechnicianBranchAssignment[]
serviceTickets        ServiceTicket[]
```

---

## Workflows

### Ticket Creation & Auto-Assignment

```
1. Staff creates ticket manually (via form)
   - Select branch (K197, K150, etc.)
   - Select issue category/subcategory
   - Enter issue description
   - Contact name/phone auto-fill from branch
   - System generates ticketNumber (TKT-202512-00001)
   - Status: NEW

2. System auto-looks up TechnicianBranchAssignment
   - Find technician where isPrimary=true for this branch
   - If found: assign ticket to this technician
   - Status: ASSIGNED
   - firstResponseAt = NULL (waiting for technician response)

3. Notifications sent:
   - To PRIMARY technician: SMS/Telegram/app notification
     "Ticket TKT-202512-00001 assigned. K197 - Cold chamber not working."
   - To STORE: SMS/Telegram notification
     "Service request #96931 assigned to technician [Name]. ETA: [time]"
   - To DISPATCHER: In-app notification
```

### SLA Escalation Workflow

```
ASSIGNED state:
- Start SLA timer (based on priority + issue subcategory)
  - CRITICAL: 60 minutes to respond
  - HIGH: 4 hours to respond
  - NORMAL: 24 hours to respond

IF technician doesn't respond (accept ticket) within SLA:
  - Auto-lookup SECONDARY technician (isPrimary=false)
  - Auto-reassign ticket to secondary
  - Send escalation notification to dispatcher & secondary tech
  - Dispatcher gets ALERT: "SLA missed - ticket escalated to [Tech]"

IF secondary also misses SLA:
  - Alert dispatcher for manual intervention
  - Show ticket in red in dashboard
```

### In-Progress & Completion

```
Technician accepts ticket → Status: IN_PROGRESS
  - Location tracking starts
  - Store can see technician location on map
  - Technician can contact store for access

Technician completes service → Complete Service workflow:
  1. Enter work description
  2. Upload 2+ photos (before/after, parts, work)
  3. Add parts used (name, qty, cost)
  4. Add labor hours
  5. System calculates total cost
  6. Technician signature (optional) or store signature
  7. Status: COMPLETED

Store manager reviews → Approval:
  - Receives notification: "Service completed. Review and approve?"
  - Can view: photos, description, cost breakdown
  - Options:
    a) APPROVE → Status: CLOSED (service done)
    b) REJECT + reason → Tech must revise
```

### SLA Metrics Calculation

```
response_time = firstResponseAt - createdAt
resolution_time = completedAt - createdAt
approval_time = closedAt - completedAt (wait for manager)

SLA_met = resolution_time <= slaResolution[priority][subcategory]
```

---

## API Endpoints (Backend)

### Tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets` - List tickets (filtered)
- `GET /api/tickets/:id` - Ticket detail
- `PATCH /api/tickets/:id` - Update status
- `PATCH /api/tickets/:id/assign` - Reassign to technician
- `PATCH /api/tickets/:id/escalate` - Manual escalation
- `POST /api/tickets/:id/complete` - Start completion workflow

### Technicians
- `GET /api/technicians` - List all
- `GET /api/technicians/:id/location` - Current location
- `PATCH /api/technicians/:id/location` - Update location
- `GET /api/technicians/:id/tickets` - My assigned tickets
- `PATCH /api/technicians/:id/tickets/:ticketId/accept` - Accept ticket
- `POST /api/technicians/:id/tickets/:ticketId/complete` - Submit completion

### Branch-Technician Assignments
- `POST /api/assignments` - Create assignment
- `GET /api/assignments?branchId=...` - Get assignments for branch
- `PATCH /api/assignments/:id` - Update assignment (primary/secondary)
- `DELETE /api/assignments/:id` - Remove assignment

### Service Completion
- `POST /api/completions/:ticketId/photos` - Upload photos
- `POST /api/completions/:ticketId/signature` - Store signature
- `GET /api/completions/:ticketId` - Get completion details
- `PATCH /api/completions/:ticketId/approve` - Manager approval

### Analytics
- `GET /api/analytics/sla` - SLA metrics
- `GET /api/analytics/technician-performance` - Technician stats
- `GET /api/analytics/cost-by-branch` - Cost breakdown
- `GET /api/analytics/issue-trends` - Issue type frequency

---

## UI Routes

### For Store Managers
- `/tickets/my-branch` - Tickets for my branch
- `/tickets/:id` - Ticket detail, photos, cost, sign-off

### For Technicians (Mobile-First)
- `/tech/dashboard` - My assigned tickets + queue
- `/tech/tickets/:id` - Ticket detail with branch location
- `/tech/tickets/:id/complete` - Complete service workflow
- `/tech/location` - Share live location

### For Dispatcher
- `/dispatcher/tickets` - All tickets dashboard (kanban or table)
- `/dispatcher/map` - Technician locations + assignments
- `/dispatcher/sla` - SLA violations and alerts
- `/dispatcher/analytics` - Reports and metrics
- `/dispatcher/assignments` - Manage branch-tech relationships

---

## Notifications

**Telegram Bot Integration** (existing infrastructure):
- Ticket creation alerts
- SLA escalation warnings
- Completion requests for store managers

**SMS** (for critical escalations):
- Technician phone: escalation alerts
- Store manager: completion approval requests

**In-App**:
- All user types see real-time updates
- Alerts for SLA violations

---

## Implementation Notes

- **Completely Independent**: No modifications to Order, OrderItem, Delivery, Product models
- **Reuse**: Customer, CustomerBranch, User models
- **Database**: Add new tables for Technician, TechnicianBranchAssignment, ServiceTicket, IssueCategory, IssueSubcategory, ServiceCompletion
- **No Breaking Changes**: Existing order system unaffected
- **Scaling**: SLA escalation can run via cron job or queue system

---

## Success Criteria

✅ Tickets created manually with full audit trail
✅ Auto-assignment to primary, escalate to secondary on SLA miss
✅ Complete service documentation with photos + signature
✅ Cost tracking (parts + labor) per ticket
✅ Real-time technician location tracking
✅ SLA metrics and alerts
✅ Store manager approval workflow
✅ All notifications (SMS/Telegram/in-app) working
