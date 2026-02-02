# Service Completion API - Integration Guide

## System Architecture

### Service Completion System Components

```
┌─────────────────────────────────────────────────────┐
│           EverCold CRM Service Completion System     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Frontend Client                                    │
│  ├─ Technician App (Create Completion)             │
│  └─ Manager Dashboard (Approve/Reject)             │
│         ↓                                            │
│  API Endpoints                                      │
│  ├─ POST /api/tickets/{id}/complete                │
│  └─ POST/GET /api/completions/{id}/approve         │
│         ↓                                            │
│  Business Logic (src/lib/completions.ts)           │
│  ├─ createCompletion()                             │
│  ├─ approveCompletion()                            │
│  ├─ rejectCompletion()                             │
│  ├─ getCompletion()                                │
│  └─ listCompletions()                              │
│         ↓                                            │
│  Database Models                                    │
│  ├─ ServiceCompletion                              │
│  ├─ ServiceTicket (updated)                        │
│  └─ Technician (linked)                            │
│         ↓                                            │
│  PostgreSQL Database                               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Data Flow

### Creating a Service Completion

```
1. Technician submits work
   POST /api/tickets/TICKET-001/complete
   {
     completedBy: "tech_123",
     workDescription: "...",
     laborHours: 2.5,
     laborCostPerHour: 50000,
     partsUsed: [...],
     photos: [...]
   }

2. Route Handler (route.ts)
   └─ Validates input
   └─ Calls createCompletion()

3. Business Logic (completions.ts)
   ├─ Verify ticket exists
   ├─ Verify ticket status (IN_PROGRESS/ASSIGNED)
   ├─ Calculate costs
   ├─ Create ServiceCompletion record
   └─ Update ticket status → COMPLETED

4. Database
   ├─ INSERT INTO ServiceCompletion
   └─ UPDATE ServiceTicket SET status='COMPLETED'

5. Response
   {
     id: "completion_456",
     ticketId: "TICKET-001",
     approvalStatus: "PENDING",
     totalCost: 655000,
     ...
   }
```

### Approving a Service Completion

```
1. Manager clicks "Approve"
   POST /api/completions/completion_456/approve
   { action: "approve" }

2. Route Handler
   └─ Calls approveCompletion()

3. Business Logic
   ├─ Verify completion exists
   ├─ Verify status is PENDING
   ├─ Update approval status → APPROVED
   └─ Update ticket status → CLOSED
   └─ Set closedAt timestamp

4. Database
   ├─ UPDATE ServiceCompletion SET approvalStatus='APPROVED'
   └─ UPDATE ServiceTicket SET status='CLOSED'

5. Response
   {
     id: "completion_456",
     approvalStatus: "APPROVED"
   }
```

### Rejecting a Service Completion

```
1. Manager clicks "Reject" with reason
   POST /api/completions/completion_456/approve
   {
     action: "reject",
     reason: "Need to replace glass window"
   }

2. Route Handler
   └─ Calls rejectCompletion()

3. Business Logic
   ├─ Verify completion exists
   ├─ Verify status is PENDING
   ├─ Update approval status → REJECTED
   ├─ Store rejection reason
   └─ Revert ticket status → IN_PROGRESS

4. Database
   ├─ UPDATE ServiceCompletion SET approvalStatus='REJECTED', approvalNotes='...'
   └─ UPDATE ServiceTicket SET status='IN_PROGRESS'

5. Response
   {
     id: "completion_456",
     approvalStatus: "REJECTED",
     approvalNotes: "Need to replace glass window"
   }

6. Technician can now:
   └─ Resubmit completion with fixes
```

## Database Schema Integration

### ServiceCompletion Table

```sql
CREATE TABLE "ServiceCompletion" (
  id                STRING PRIMARY KEY,
  ticketId          STRING UNIQUE NOT NULL,
  completedBy       STRING NOT NULL,        -- Technician ID
  completedAt       TIMESTAMP NOT NULL,
  workDescription   TEXT NOT NULL,
  laborHours        FLOAT NOT NULL,
  laborCostPerHour  FLOAT NOT NULL,
  partsJson         TEXT,                   -- JSON array of parts
  photosJson        TEXT,                   -- JSON array of photos
  partsCost         FLOAT NOT NULL,         -- Calculated
  laborCost         FLOAT NOT NULL,         -- Calculated
  totalCost         FLOAT NOT NULL,         -- Calculated
  signatureUrl      STRING,                 -- Optional
  signedBy          STRING,                 -- Optional
  signedAt          TIMESTAMP,              -- Optional
  approvalStatus    ENUM('PENDING', 'APPROVED', 'REJECTED'),
  approvalNotes     TEXT,
  createdAt         TIMESTAMP DEFAULT NOW(),
  updatedAt         TIMESTAMP DEFAULT NOW(),
  technicianId      STRING,                 -- FK to Technician

  FOREIGN KEY (ticketId) REFERENCES "ServiceTicket"(id),
  FOREIGN KEY (technicianId) REFERENCES "Technician"(id),
  INDEX idx_ticketId (ticketId),
  INDEX idx_approvalStatus (approvalStatus)
);
```

### Related Tables Updated

#### ServiceTicket
```sql
-- Added fields:
completedAt      TIMESTAMP    -- When service was completed
closedAt         TIMESTAMP    -- When service was closed/approved

-- Status values:
NEW, ASSIGNED, IN_PROGRESS, COMPLETED, CLOSED

-- Relationships:
completion       ServiceCompletion  -- ONE-TO-ONE
```

## API Response Schema

### Success Response (201 Created)
```json
{
  "id": "string (cuid)",
  "ticketId": "string",
  "completedBy": "string",
  "completedAt": "ISO8601 datetime",
  "workDescription": "string",
  "laborHours": "number",
  "laborCostPerHour": "number",
  "partsJson": "JSON string",
  "photosJson": "JSON string",
  "partsCost": "number",
  "laborCost": "number",
  "totalCost": "number",
  "signatureUrl": "string (optional)",
  "signedBy": "string (optional)",
  "signedAt": "ISO8601 datetime (optional)",
  "approvalStatus": "PENDING | APPROVED | REJECTED",
  "approvalNotes": "string (optional)",
  "createdAt": "ISO8601 datetime",
  "updatedAt": "ISO8601 datetime"
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Human-readable error message"
}
```

## Validation Rules

### Input Validation (POST /api/tickets/{id}/complete)

```typescript
// Required fields
✓ completedBy (string, non-empty)
✓ workDescription (string, non-empty)
✓ laborHours (number > 0)
✓ laborCostPerHour (number > 0)
✓ partsUsed (array)
✓ photos (array)

// Each part must have
✓ name (string)
✓ quantity (number > 0)
✓ unitCost (number > 0)
✓ total (number = quantity * unitCost)

// Each photo must have
✓ url (string, valid URL)
✓ type (enum: "before" | "after" | "work")
✓ caption (string, optional)
```

### Business Logic Validation

```typescript
// Before creating completion:
✓ Ticket must exist
✓ Ticket status must be IN_PROGRESS or ASSIGNED
✓ No existing completion for this ticket

// Before approving:
✓ Completion must exist
✓ Approval status must be PENDING

// Before rejecting:
✓ Completion must exist
✓ Approval status must be PENDING
✓ Rejection reason must be provided
```

## Relationships

### One-to-One: Ticket ↔ Completion

```
ServiceTicket                ServiceCompletion
┌─────────────────┐          ┌──────────────────┐
│ id (PK)         │◇─────────│ id (PK)          │
│ ticketNumber    │          │ ticketId (FK,U)  │
│ status          │          │ approvalStatus   │
│ completedAt     │          │ totalCost        │
│ closedAt        │          │ ...              │
└─────────────────┘          └──────────────────┘
```

### Many-to-One: Completion ↔ Technician

```
ServiceCompletion            Technician
┌──────────────────┐         ┌────────────────┐
│ id (PK)          │◇────────│ id (PK)        │
│ technicianId (FK)│         │ name           │
│ completedBy      │         │ phone          │
│ ...              │         │ ...            │
└──────────────────┘         └────────────────┘
```

### Many-to-One: Completion ↔ Ticket

```
ServiceCompletion            ServiceTicket
┌──────────────────┐         ┌────────────────┐
│ id (PK)          │◇────────│ id (PK)        │
│ ticketId (FK,U)  │         │ ticketNumber   │
│ completedAt      │         │ branch         │
│ ...              │         │ ...            │
└──────────────────┘         └────────────────┘
       │                           │
       └─→ Includes:              │
           - ticket details        │
           - branch info          │
           - customer info        │
           - technician info      │
```

## Type Definitions

### TypeScript Interfaces

```typescript
// Input interfaces
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

interface CreateCompletionInput {
  ticketId: string;
  completedBy: string;
  workDescription: string;
  laborHours: number;
  laborCostPerHour: number;
  partsUsed: Part[];
  photos: Photo[];
}

// Database model (from Prisma)
interface ServiceCompletion {
  id: string;
  ticketId: string;
  completedBy: string;
  completedAt: Date;
  workDescription: string;
  laborHours: number;
  laborCostPerHour: number;
  partsJson: string | null;
  photosJson: string | null;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  signatureUrl: string | null;
  signedBy: string | null;
  signedAt: Date | null;
  approvalStatus: ApprovalStatus;
  approvalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  ticket: ServiceTicket;
  technician?: Technician;
}

enum ApprovalStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED"
}
```

## Error Handling Strategy

```
HTTP 400 Bad Request
├─ Missing required field
├─ Invalid field type
├─ Invalid enum value
├─ Validation failed (e.g., negative costs)
├─ Ticket not found
├─ Ticket wrong status
├─ Completion not found
├─ Completion wrong status
└─ Business logic violation

HTTP 404 Not Found
├─ Ticket not found
├─ Completion not found
└─ Resource doesn't exist

HTTP 500 Server Error
└─ Database error
   Query error
   Connection error
```

## Deployment Checklist

- [ ] Database migrations applied
- [ ] ServiceCompletion table created
- [ ] API routes accessible
- [ ] Prisma client regenerated
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Error logging configured
- [ ] API documentation updated
- [ ] Tests written and passing
- [ ] Security validation implemented

## Testing Guide

### Unit Tests (Recommended)
```typescript
describe('Service Completion', () => {
  // Test createCompletion
  // Test approveCompletion
  // Test rejectCompletion
  // Test validation rules
  // Test cost calculation
});
```

### Integration Tests
```typescript
describe('Service Completion API', () => {
  // Test full workflow: create → approve
  // Test full workflow: create → reject → resubmit → approve
  // Test error cases
  // Test permission checks
});
```

### Manual Testing
1. Create a ticket and assign technician
2. Update ticket status to IN_PROGRESS
3. Submit completion with parts and photos
4. Verify costs calculated correctly
5. Test approval and rejection flows
6. Verify ticket status transitions

## Performance Considerations

- ServiceCompletion queries indexed by `ticketId` (unique)
- ApprovalStatus queries indexed for filtering
- Batch operations for bulk approvals
- JSON fields (parts, photos) stored efficiently
- Consider archiving old completions

## Security Considerations

- Validate all input from external sources
- Verify user permissions before approval
- Log all approvals and rejections
- Store audit trail for compliance
- Encrypt sensitive data (photos)
- Validate file URLs before storing
