# Service Ticket System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete service ticket management system for cooling equipment repairs with auto-assignment, SLA tracking, photo documentation, and store manager approval.

**Architecture:**
- Independent domain (no Order/Delivery modifications)
- Database: 6 new Prisma models (Technician, TechnicianBranchAssignment, ServiceTicket, IssueCategory, IssueSubcategory, ServiceCompletion)
- API: RESTful endpoints for ticket CRUD, assignments, completion workflow
- UI: Three interfaces (store manager, technician mobile, dispatcher dashboard)
- Notifications: SMS/Telegram/in-app via existing infrastructure
- SLA: Automated escalation via cron job checking overdue tickets

**Tech Stack:**
- Prisma (PostgreSQL ORM)
- Next.js API routes
- React/TypeScript for UI
- TailwindCSS for styling
- Existing Telegram bot infrastructure
- Location tracking (GPS coordinates)

---

## Phase 1: Database & Models

### Task 1: Add Technician model to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma` (add after User model)

**Step 1: Add Technician model**

Add to `prisma/schema.prisma` after line 194 (after User model):

```prisma
// Technician for cooling system service
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

**Step 2: Run Prisma format to check syntax**

```bash
cd /Users/user/Documents/evercold-crm
npx prisma format
```

Expected: No errors, schema properly formatted

**Step 3: Create migration**

```bash
npx prisma migrate dev --name add_technician_model
```

Expected: Migration created successfully, schema updated

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Technician model and TechnicianStatus enum"
```

---

### Task 2: Add TechnicianBranchAssignment model

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/schema.prisma` (update CustomerBranch)

**Step 1: Add TechnicianBranchAssignment model**

Add to schema after Technician model:

```prisma
// Maps technicians to branches (service territories)
model TechnicianBranchAssignment {
  id                    String    @id @default(cuid())
  technicianId          String
  branchId              String

  isPrimary             Boolean   @default(true)
  serviceTerritory      String?

  assignedDate          DateTime  @default(now())
  startDate             DateTime?
  endDate               DateTime?

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

**Step 2: Update CustomerBranch model**

Find CustomerBranch model (around line 39) and add these lines at the end (before closing brace):

```prisma
  technicianAssignments TechnicianBranchAssignment[]
  serviceTickets        ServiceTicket[]
```

So the closing brace and index lines look like:

```prisma
  technicianAssignments TechnicianBranchAssignment[]
  serviceTickets        ServiceTicket[]

  @@index([customerId])
  @@index([branchCode])
}
```

**Step 3: Run Prisma format**

```bash
npx prisma format
```

Expected: No errors

**Step 4: Create migration**

```bash
npx prisma migrate dev --name add_technician_branch_assignment
```

Expected: Migration created successfully

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add TechnicianBranchAssignment model and link to CustomerBranch"
```

---

### Task 3: Add IssueCategory and IssueSubcategory models

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add IssueCategory model**

Add after TechnicianBranchAssignment:

```prisma
// Issue type classification
model IssueCategory {
  id                    String    @id @default(cuid())
  name                  String    @unique
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
  name                  String

  description           String?

  // SLA Response times (in minutes) by priority
  slaResponseCritical   Int       @default(60)
  slaResponseHigh       Int       @default(240)
  slaResponseNormal     Int       @default(1440)
  slaResponseLow        Int       @default(2880)

  // SLA Resolution times (in minutes) by priority
  slaResolutionCritical Int      @default(240)
  slaResolutionHigh     Int      @default(1440)
  slaResolutionNormal   Int      @default(2880)
  slaResolutionLow      Int      @default(4320)

  category              IssueCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  tickets               ServiceTicket[]

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([categoryId])
}
```

**Step 2: Run format and migrate**

```bash
npx prisma format && npx prisma migrate dev --name add_issue_categories
```

Expected: Migration created successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add IssueCategory and IssueSubcategory models"
```

---

### Task 4: Add ServiceTicket model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add enums for ticket**

Add before any new models:

```prisma
enum TicketStatus {
  NEW
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CLOSED
}

enum TicketPriority {
  CRITICAL
  HIGH
  NORMAL
  LOW
}
```

**Step 2: Add ServiceTicket model**

Add after IssueSubcategory:

```prisma
// Service ticket/request
model ServiceTicket {
  id                    String    @id @default(cuid())
  ticketNumber          String    @unique
  externalId            String?

  // Branch reference
  branchId              String
  branch                CustomerBranch @relation(fields: [branchId], references: [id], onDelete: Cascade)

  // Contact info
  contactName           String?
  contactRole           String?
  contactPhone          String?

  // Issue
  categoryId            String
  subcategoryId         String
  category              IssueCategory @relation(fields: [categoryId], references: [id])
  subcategory           IssueSubcategory @relation(fields: [subcategoryId], references: [id])
  description           String

  // Assignment
  assignedTechnicianId  String?
  assignedTechnician    Technician? @relation(fields: [assignedTechnicianId], references: [id], onDelete: SetNull)
  dispatcherId          String?

  // Status
  status                TicketStatus @default(NEW)
  priority              TicketPriority @default(NORMAL)

  // SLA Tracking
  createdAt             DateTime  @default(now())
  firstResponseAt       DateTime?
  completedAt           DateTime?
  closedAt              DateTime?

  // Notes
  internalNotes         String?
  storeNotes            String?

  // Relationships
  completion            ServiceCompletion?

  updatedAt             DateTime  @updatedAt

  @@index([status])
  @@index([priority])
  @@index([branchId])
  @@index([assignedTechnicianId])
  @@index([createdAt])
}
```

**Step 3: Format and migrate**

```bash
npx prisma format && npx prisma migrate dev --name add_service_ticket_model
```

Expected: Migration successful

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ServiceTicket model with status and priority enums"
```

---

### Task 5: Add ServiceCompletion model

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add ApprovalStatus enum**

Add with other enums:

```prisma
enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}
```

**Step 2: Add ServiceCompletion model**

Add after ServiceTicket:

```prisma
// Service completion and documentation
model ServiceCompletion {
  id                    String    @id @default(cuid())
  ticketId              String    @unique

  completedBy           String
  completedAt           DateTime

  // Work details
  workDescription       String
  laborHours            Float
  laborCostPerHour      Float

  // Parts (JSON)
  partsJson             String

  // Calculated
  partsCost             Float
  laborCost             Float
  totalCost             Float

  // Photos (JSON)
  photosJson            String

  // Signature
  signatureUrl          String?
  signedBy              String?
  signedAt              DateTime?

  // Approval
  approvalStatus        ApprovalStatus @default(PENDING)
  approvalNotes         String?

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  ticket                ServiceTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@index([ticketId])
  @@index([approvalStatus])
}
```

**Step 3: Format and migrate**

```bash
npx prisma format && npx prisma migrate dev --name add_service_completion_model
```

Expected: Migration successful

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add ServiceCompletion model with approval workflow"
```

---

### Task 6: Add Prisma Client regeneration and seed initial data

**Files:**
- Create: `scripts/seed-issue-categories.ts`

**Step 1: Create seed script**

```typescript
// scripts/seed-issue-categories.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create main category
  const category = await prisma.issueCategory.upsert({
    where: { name: "Cooling Equipment Problems" },
    update: {},
    create: {
      name: "Cooling Equipment Problems",
      description: "Issues related to cooling equipment and refrigeration systems",
    },
  });

  // Create subcategories
  const subcategories = [
    {
      name: "Cold Chambers",
      description: "Problems with cold storage chambers",
    },
    {
      name: "Glass Repair",
      description: "Glass door or window damage/replacement",
    },
    {
      name: "Temperature Control",
      description: "Temperature regulation and thermostat issues",
    },
    {
      name: "Leaking Water",
      description: "Water leaks from cooling equipment",
    },
    {
      name: "Equipment Not Working",
      description: "Equipment failure or not powering on",
    },
    {
      name: "Noise/Vibration",
      description: "Abnormal noise or vibration from equipment",
    },
  ];

  for (const sub of subcategories) {
    await prisma.issueSubcategory.upsert({
      where: { categoryId_name: { categoryId: category.id, name: sub.name } },
      update: { description: sub.description },
      create: {
        categoryId: category.id,
        name: sub.name,
        description: sub.description,
        slaResponseCritical: 60,
        slaResponseHigh: 240,
        slaResponseNormal: 1440,
        slaResponseLow: 2880,
        slaResolutionCritical: 240,
        slaResolutionHigh: 1440,
        slaResolutionNormal: 2880,
        slaResolutionLow: 4320,
      },
    });
  }

  console.log("✓ Issue categories seeded");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

**Step 2: Add seed command to package.json**

Find `"scripts"` section and add:

```json
"seed": "ts-node scripts/seed-issue-categories.ts"
```

**Step 3: Run seed**

```bash
npm run seed
```

Expected: Output shows "✓ Issue categories seeded"

**Step 4: Verify with Prisma Studio**

```bash
npx prisma studio
```

Then open browser and verify IssueCategory and IssueSubcategory tables have data

**Step 5: Commit**

```bash
git add scripts/seed-issue-categories.ts package.json
git commit -m "feat: add issue categories seed data"
```

---

## Phase 2: API Endpoints

### Task 7: Create ticket API routes structure

**Files:**
- Create: `src/app/api/tickets/route.ts`
- Create: `src/app/api/tickets/[id]/route.ts`
- Create: `src/lib/tickets.ts` (service layer)

**Step 1: Create lib/tickets.ts service layer**

```typescript
// src/lib/tickets.ts
import { prisma } from "@/lib/prisma";

export async function generateTicketNumber(): Promise<string> {
  const date = new Date();
  const yearMonth = date.toISOString().slice(0, 7).replace("-", "");

  // Get count of tickets this month
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const count = await prisma.serviceTicket.count({
    where: {
      createdAt: {
        gte: firstDay,
      },
    },
  });

  const sequence = String(count + 1).padStart(5, "0");
  return `TKT-${yearMonth}-${sequence}`;
}

export async function createTicket(data: {
  branchId: string;
  categoryId: string;
  subcategoryId: string;
  description: string;
  priority?: string;
  externalId?: string;
  dispatcherId?: string;
}) {
  // Get branch info for contact details
  const branch = await prisma.customerBranch.findUnique({
    where: { id: data.branchId },
    include: { customer: true },
  });

  if (!branch) {
    throw new Error("Branch not found");
  }

  const ticketNumber = await generateTicketNumber();

  // Get primary technician for this branch
  const primaryAssignment = await prisma.technicianBranchAssignment.findFirst({
    where: {
      branchId: data.branchId,
      isPrimary: true,
      endDate: null,
    },
    include: { technician: true },
  });

  // Create ticket
  const ticket = await prisma.serviceTicket.create({
    data: {
      ticketNumber,
      externalId: data.externalId,
      branchId: data.branchId,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      description: data.description,
      priority: data.priority || "NORMAL",
      contactName: branch.contactPerson,
      contactPhone: branch.phone,
      contactRole: "Store Manager",
      assignedTechnicianId: primaryAssignment?.technician.id,
      dispatcherId: data.dispatcherId,
      status: primaryAssignment ? "ASSIGNED" : "NEW",
    },
    include: {
      category: true,
      subcategory: true,
      assignedTechnician: true,
      branch: true,
    },
  });

  return ticket;
}

export async function getTicket(ticketId: string) {
  return prisma.serviceTicket.findUnique({
    where: { id: ticketId },
    include: {
      category: true,
      subcategory: true,
      assignedTechnician: true,
      branch: true,
      completion: true,
    },
  });
}

export async function listTickets(filters?: {
  status?: string;
  branchId?: string;
  technicianId?: string;
  priority?: string;
}) {
  return prisma.serviceTicket.findMany({
    where: {
      status: filters?.status,
      branchId: filters?.branchId,
      assignedTechnicianId: filters?.technicianId,
      priority: filters?.priority,
    },
    include: {
      category: true,
      subcategory: true,
      assignedTechnician: true,
      branch: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  timestamp?: Date
) {
  const data: any = { status };

  if (status === "ASSIGNED" && !timestamp) {
    data.firstResponseAt = new Date();
  } else if (status === "COMPLETED") {
    data.completedAt = new Date();
  } else if (status === "CLOSED") {
    data.closedAt = new Date();
  }

  return prisma.serviceTicket.update({
    where: { id: ticketId },
    data,
    include: {
      category: true,
      subcategory: true,
      assignedTechnician: true,
      branch: true,
    },
  });
}

export async function assignTechnician(
  ticketId: string,
  technicianId: string
) {
  return prisma.serviceTicket.update({
    where: { id: ticketId },
    data: {
      assignedTechnicianId: technicianId,
      status: "ASSIGNED",
      firstResponseAt: new Date(),
    },
    include: {
      category: true,
      assignedTechnician: true,
      branch: true,
    },
  });
}
```

**Step 2: Create route handler for POST /api/tickets**

```typescript
// src/app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createTicket, listTickets } from "@/lib/tickets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const ticket = await createTicket({
      branchId: body.branchId,
      categoryId: body.categoryId,
      subcategoryId: body.subcategoryId,
      description: body.description,
      priority: body.priority,
      externalId: body.externalId,
      dispatcherId: body.dispatcherId,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tickets = await listTickets({
      status: searchParams.get("status") || undefined,
      branchId: searchParams.get("branchId") || undefined,
      technicianId: searchParams.get("technicianId") || undefined,
      priority: searchParams.get("priority") || undefined,
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

**Step 3: Create route handler for GET/PATCH /api/tickets/[id]**

```typescript
// src/app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getTicket,
  updateTicketStatus,
  assignTechnician,
} from "@/lib/tickets";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticket = await getTicket(params.id);
    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(ticket);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    if (body.status) {
      const ticket = await updateTicketStatus(params.id, body.status);
      return NextResponse.json(ticket);
    }

    if (body.assignedTechnicianId) {
      const ticket = await assignTechnician(params.id, body.assignedTechnicianId);
      return NextResponse.json(ticket);
    }

    return NextResponse.json(
      { error: "No valid update provided" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

**Step 4: Test endpoints with curl**

```bash
# Test create
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "branchId": "<actual-branch-id>",
    "categoryId": "<actual-category-id>",
    "subcategoryId": "<actual-subcategory-id>",
    "description": "Cold chamber not working",
    "priority": "CRITICAL"
  }'
```

Expected: Returns created ticket with 201 status

**Step 5: Commit**

```bash
git add src/lib/tickets.ts src/app/api/tickets/
git commit -m "feat: add core ticket CRUD API endpoints"
```

---

### Task 8: Create technician API routes

**Files:**
- Create: `src/lib/technicians.ts`
- Create: `src/app/api/technicians/route.ts`
- Create: `src/app/api/technicians/[id]/route.ts`

**Step 1: Create technicians service layer**

```typescript
// src/lib/technicians.ts
import { prisma } from "@/lib/prisma";

export async function createTechnician(data: {
  name: string;
  phone: string;
  email?: string;
}) {
  return prisma.technician.create({
    data,
  });
}

export async function getTechnician(id: string) {
  return prisma.technician.findUnique({
    where: { id },
    include: {
      branchAssignments: { include: { branch: true } },
      assignedTickets: true,
    },
  });
}

export async function listTechnicians() {
  return prisma.technician.findMany({
    include: {
      branchAssignments: { include: { branch: true } },
    },
  });
}

export async function updateTechnicianLocation(
  id: string,
  latitude: number,
  longitude: number
) {
  return prisma.technician.update({
    where: { id },
    data: {
      latitude,
      longitude,
      lastLocationUpdate: new Date(),
    },
  });
}

export async function assignTechnicianToBranch(data: {
  technicianId: string;
  branchId: string;
  isPrimary: boolean;
}) {
  return prisma.technicianBranchAssignment.create({
    data,
    include: {
      technician: true,
      branch: true,
    },
  });
}

export async function getPrimaryTechnicianForBranch(branchId: string) {
  return prisma.technicianBranchAssignment.findFirst({
    where: {
      branchId,
      isPrimary: true,
      endDate: null,
    },
    include: { technician: true },
  });
}

export async function getSecondaryTechnicianForBranch(branchId: string) {
  return prisma.technicianBranchAssignment.findFirst({
    where: {
      branchId,
      isPrimary: false,
      endDate: null,
    },
    include: { technician: true },
  });
}
```

**Step 2: Create GET /api/technicians and POST**

```typescript
// src/app/api/technicians/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createTechnician, listTechnicians } from "@/lib/technicians";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const technician = await createTechnician({
      name: body.name,
      phone: body.phone,
      email: body.email,
    });
    return NextResponse.json(technician, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const technicians = await listTechnicians();
    return NextResponse.json(technicians);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

**Step 3: Create GET /api/technicians/[id] and PATCH**

```typescript
// src/app/api/technicians/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getTechnician,
  updateTechnicianLocation,
} from "@/lib/technicians";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const technician = await getTechnician(params.id);
    if (!technician) {
      return NextResponse.json(
        { error: "Technician not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(technician);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    if (body.latitude !== undefined && body.longitude !== undefined) {
      const technician = await updateTechnicianLocation(
        params.id,
        body.latitude,
        body.longitude
      );
      return NextResponse.json(technician);
    }

    return NextResponse.json(
      { error: "No valid update provided" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

**Step 4: Create POST /api/technicians/[id]/assign for branch assignment**

```typescript
// src/app/api/technicians/[id]/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assignTechnicianToBranch } from "@/lib/technicians";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const assignment = await assignTechnicianToBranch({
      technicianId: params.id,
      branchId: body.branchId,
      isPrimary: body.isPrimary ?? true,
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

**Step 5: Commit**

```bash
git add src/lib/technicians.ts src/app/api/technicians/
git commit -m "feat: add technician management and assignment APIs"
```

---

### Task 9: Create completion API endpoints

**Files:**
- Create: `src/lib/completions.ts`
- Create: `src/app/api/tickets/[id]/complete/route.ts`
- Create: `src/app/api/completions/[id]/approve/route.ts`

**Step 1: Create completions service layer**

```typescript
// src/lib/completions.ts
import { prisma } from "@/lib/prisma";

interface Part {
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface Photo {
  url: string;
  type: "before" | "after" | "work";
  caption?: string;
}

export async function createCompletion(data: {
  ticketId: string;
  completedBy: string;
  workDescription: string;
  laborHours: number;
  laborCostPerHour: number;
  partsUsed: Part[];
  photos: Photo[];
}) {
  const partsCost = data.partsUsed.reduce((sum, p) => sum + p.total, 0);
  const laborCost = data.laborHours * data.laborCostPerHour;
  const totalCost = partsCost + laborCost;

  const completion = await prisma.serviceCompletion.create({
    data: {
      ticketId: data.ticketId,
      completedBy: data.completedBy,
      completedAt: new Date(),
      workDescription: data.workDescription,
      laborHours: data.laborHours,
      laborCostPerHour: data.laborCostPerHour,
      partsJson: JSON.stringify(data.partsUsed),
      photosJson: JSON.stringify(data.photos),
      partsCost,
      laborCost,
      totalCost,
      approvalStatus: "PENDING",
    },
  });

  // Update ticket status to COMPLETED
  await prisma.serviceTicket.update({
    where: { id: data.ticketId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  return completion;
}

export async function getCompletion(id: string) {
  return prisma.serviceCompletion.findUnique({
    where: { id },
    include: { ticket: { include: { branch: true } } },
  });
}

export async function approveCompletion(id: string) {
  const completion = await prisma.serviceCompletion.update({
    where: { id },
    data: { approvalStatus: "APPROVED" },
  });

  // Close the ticket
  await prisma.serviceTicket.update({
    where: { id: completion.ticketId },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  return completion;
}

export async function rejectCompletion(id: string, reason: string) {
  return prisma.serviceCompletion.update({
    where: { id },
    data: {
      approvalStatus: "REJECTED",
      approvalNotes: reason,
    },
  });
}
```

**Step 2: Create POST completion endpoint**

```typescript
// src/app/api/tickets/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createCompletion } from "@/lib/completions";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const completion = await createCompletion({
      ticketId: params.id,
      completedBy: body.completedBy,
      workDescription: body.workDescription,
      laborHours: body.laborHours,
      laborCostPerHour: body.laborCostPerHour,
      partsUsed: body.partsUsed,
      photos: body.photos,
    });

    return NextResponse.json(completion, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

**Step 3: Create approval endpoints**

```typescript
// src/app/api/completions/[id]/approve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { approveCompletion, rejectCompletion } from "@/lib/completions";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    if (body.action === "approve") {
      const completion = await approveCompletion(params.id);
      return NextResponse.json(completion);
    }

    if (body.action === "reject") {
      const completion = await rejectCompletion(params.id, body.reason);
      return NextResponse.json(completion);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

**Step 4: Commit**

```bash
git add src/lib/completions.ts src/app/api/tickets/[id]/complete/ src/app/api/completions/
git commit -m "feat: add service completion and approval workflow"
```

---

## Phase 3: SLA Escalation & Background Jobs

### Task 10: Create SLA escalation service

**Files:**
- Create: `src/lib/sla.ts`
- Create: `src/app/api/cron/escalate-tickets/route.ts`

**Step 1: Create SLA service**

```typescript
// src/lib/sla.ts
import { prisma } from "@/lib/prisma";
import {
  getPrimaryTechnicianForBranch,
  getSecondaryTechnicianForBranch,
} from "./technicians";

export async function getResponseSLAMinutes(
  subcategoryId: string,
  priority: string
): Promise<number> {
  const subcategory = await prisma.issueSubcategory.findUnique({
    where: { id: subcategoryId },
  });

  if (!subcategory) return 1440; // default 24h

  switch (priority) {
    case "CRITICAL":
      return subcategory.slaResponseCritical;
    case "HIGH":
      return subcategory.slaResponseHigh;
    case "NORMAL":
      return subcategory.slaResponseNormal;
    case "LOW":
      return subcategory.slaResponseLow;
    default:
      return 1440;
  }
}

export async function escalateOverdueTickets() {
  // Find all ASSIGNED tickets that missed SLA response
  const tickets = await prisma.serviceTicket.findMany({
    where: {
      status: "ASSIGNED",
      firstResponseAt: null,
      createdAt: {
        lte: new Date(Date.now() - 1 * 60 * 1000), // At least 1 minute old
      },
    },
    include: {
      subcategory: true,
      branch: true,
      assignedTechnician: true,
    },
  });

  const escalated = [];

  for (const ticket of tickets) {
    const slaMinutes = await getResponseSLAMinutes(
      ticket.subcategoryId,
      ticket.priority
    );
    const slaTimeLimit = new Date(
      ticket.createdAt.getTime() + slaMinutes * 60 * 1000
    );

    if (new Date() > slaTimeLimit) {
      // SLA missed - escalate to secondary
      const secondary = await getSecondaryTechnicianForBranch(ticket.branchId);

      if (secondary) {
        const updated = await prisma.serviceTicket.update({
          where: { id: ticket.id },
          data: {
            assignedTechnicianId: secondary.technician.id,
          },
          include: { assignedTechnician: true, branch: true },
        });
        escalated.push(updated);
      }
    }
  }

  return escalated;
}
```

**Step 2: Create cron endpoint for escalation**

```typescript
// src/app/api/cron/escalate-tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { escalateOverdueTickets } from "@/lib/sla";

// Protect with cron secret
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const escalated = await escalateOverdueTickets();
    return NextResponse.json({
      success: true,
      escalatedCount: escalated.length,
      escalated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**Step 3: Add CRON_SECRET to .env**

Add to `.env`:
```
CRON_SECRET=your-secret-key-here
```

**Step 4: Commit**

```bash
git add src/lib/sla.ts src/app/api/cron/
git commit -m "feat: add SLA escalation logic and cron endpoint"
```

---

## Phase 4: UI Components

### Task 11: Create ticket creation form (dispatcher)

**Files:**
- Create: `src/app/tickets/create/page.tsx`
- Create: `src/components/TicketCreateForm.tsx`

**Step 1: Create form component**

```typescript
// src/components/TicketCreateForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TicketCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    branchId: "",
    categoryId: "",
    subcategoryId: "",
    description: "",
    priority: "NORMAL",
    externalId: "",
  });

  // Load initial data
  useState(() => {
    fetchBranches();
    fetchCategories();
  }, []);

  async function fetchBranches() {
    const res = await fetch("/api/customer-branches");
    const data = await res.json();
    setBranches(data);
  }

  async function fetchCategories() {
    const res = await fetch("/api/issue-categories");
    const data = await res.json();
    setCategories(data);
  }

  async function handleCategoryChange(categoryId: string) {
    setFormData({ ...formData, categoryId, subcategoryId: "" });
    if (categoryId) {
      const res = await fetch(
        `/api/issue-categories/${categoryId}/subcategories`
      );
      const data = await res.json();
      setSubcategories(data);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create ticket");

      const ticket = await res.json();
      router.push(`/dispatcher/tickets/${ticket.id}`);
    } catch (error) {
      console.error(error);
      alert("Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow"
    >
      <h2 className="text-2xl font-bold mb-6">Create Service Ticket</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Branch</label>
          <select
            value={formData.branchId}
            onChange={(e) =>
              setFormData({ ...formData, branchId: e.target.value })
            }
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select branch...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchCode} - {b.branchName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Issue Category
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {subcategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Sub-category
            </label>
            <select
              value={formData.subcategoryId}
              onChange={(e) =>
                setFormData({ ...formData, subcategoryId: e.target.value })
              }
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select sub-category...</option>
              {subcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            rows={4}
            className="w-full border rounded px-3 py-2"
            placeholder="Describe the issue..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            External ID (optional)
          </label>
          <input
            type="text"
            value={formData.externalId}
            onChange={(e) =>
              setFormData({ ...formData, externalId: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., 96931"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Ticket"}
        </button>
      </div>
    </form>
  );
}
```

**Step 2: Create page**

```typescript
// src/app/tickets/create/page.tsx
import TicketCreateForm from "@/components/TicketCreateForm";

export default function CreateTicketPage() {
  return (
    <div className="container mx-auto py-8">
      <TicketCreateForm />
    </div>
  );
}
```

**Step 3: Add missing API endpoint for categories and branches**

```typescript
// src/app/api/issue-categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.issueCategory.findMany();
  return NextResponse.json(categories);
}
```

```typescript
// src/app/api/issue-categories/[id]/subcategories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const subcategories = await prisma.issueSubcategory.findMany({
    where: { categoryId: params.id },
  });
  return NextResponse.json(subcategories);
}
```

```typescript
// src/app/api/customer-branches/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const branches = await prisma.customerBranch.findMany({
    where: { isActive: true },
    orderBy: { branchCode: "asc" },
  });
  return NextResponse.json(branches);
}
```

**Step 4: Commit**

```bash
git add src/components/TicketCreateForm.tsx src/app/tickets/create/ src/app/api/issue-categories/ src/app/api/customer-branches/
git commit -m "feat: add ticket creation form and supporting APIs"
```

---

## Phase 5: Dispatcher Dashboard

### Task 12: Create dispatcher tickets dashboard

**Files:**
- Create: `src/app/dispatcher/tickets/page.tsx`
- Create: `src/components/TicketsTable.tsx`

[Continue with detailed implementation for tickets table, filtering, reassignment...]

---

## Phase 6: Technician Mobile Interface

### Task 13: Create technician dashboard

**Files:**
- Create: `src/app/tech/dashboard/page.tsx`
- Create: `src/components/TechnicianTicketQueue.tsx`

[Continue with ticket queue, location tracking, accept/decline...]

---

## Phase 7: Service Completion Workflow

### Task 14: Implement complete service form

**Files:**
- Create: `src/app/tech/tickets/[id]/complete/page.tsx`
- Create: `src/components/CompleteServiceForm.tsx`

[Continue with photo upload, parts tracking, signature capture...]

---

## Phase 8: Store Manager Approval

### Task 15: Create approval interface

**Files:**
- Create: `src/app/tickets/[id]/approve/page.tsx`
- Create: `src/components/TicketApprovalForm.tsx`

[Continue with photo review, cost breakdown, signature, approval...]

---

## Phase 9: Analytics & Reports

### Task 16: Add SLA metrics dashboard

**Files:**
- Create: `src/app/dispatcher/analytics/page.tsx`
- Create: `src/components/SLAMetrics.tsx`

[Continue with SLA graphs, technician performance, cost analysis...]

---

## Phase 10: Integration & Testing

### Task 17: Integrate notifications with Telegram bot

**Files:**
- Modify: `src/lib/telegram.ts`
- Create: `src/lib/ticket-notifications.ts`

[Continue with notification logic for ticket creation, escalation, completion...]

### Task 18: Add end-to-end tests

**Files:**
- Create: `src/tests/tickets.test.ts`

[Continue with test scenarios...]

---

## Deployment Checklist

- [ ] All database migrations applied
- [ ] Environment variables configured (CRON_SECRET, etc.)
- [ ] Seed data loaded (issue categories)
- [ ] API endpoints tested
- [ ] SLA cron job configured
- [ ] Telegram bot notifications working
- [ ] All UI pages responsive
- [ ] Production build successful
- [ ] Database backups configured
