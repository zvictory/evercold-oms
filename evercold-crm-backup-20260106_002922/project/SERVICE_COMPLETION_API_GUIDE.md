# Service Completion API Guide

This document describes the Service Completion API endpoints for the EverCold CRM system.

## Overview

The Service Completion API handles the workflow for completing service repairs, including:
- Creating service completion records with parts, labor costs, and photos
- Managing approval workflow (approve/reject)
- Tracking service costs and repair details

## Architecture

### Files Created

1. **src/lib/completions.ts** - Service business logic layer
   - `createCompletion()` - Create a new service completion
   - `getCompletion()` - Get completion details
   - `listCompletions()` - List completions with filters
   - `approveCompletion()` - Approve a pending completion
   - `rejectCompletion()` - Reject a completion with reason

2. **src/app/api/tickets/[id]/complete/route.ts** - POST endpoint
   - Technicians submit completed work via this endpoint
   - Validates parts, photos, and labor costs
   - Updates ticket status to COMPLETED

3. **src/app/api/completions/[id]/approve/route.ts** - Approval endpoint
   - GET - Retrieve completion details
   - POST - Approve or reject completion

## Data Models

### ServiceCompletion
```
{
  id: string
  ticketId: string (unique)
  completedBy: string (technician ID)
  completedAt: DateTime
  workDescription: string
  laborHours: number
  laborCostPerHour: number
  partsJson: string (JSON array)
  photosJson: string (JSON array)
  partsCost: number (calculated)
  laborCost: number (calculated)
  totalCost: number (calculated)
  signatureUrl: string? (optional)
  signedBy: string? (optional)
  signedAt: DateTime? (optional)
  approvalStatus: PENDING | APPROVED | REJECTED
  approvalNotes: string? (optional)
}
```

### Part Object
```
{
  name: string
  quantity: number
  unitCost: number
  total: number (quantity * unitCost)
}
```

### Photo Object
```
{
  url: string
  type: "before" | "after" | "work"
  caption?: string
}
```

## API Endpoints

### 1. Create Service Completion
**POST** `/api/tickets/{id}/complete`

Technician submits completed work for a ticket.

#### Request Body
```json
{
  "completedBy": "TECHNICIAN_ID",
  "workDescription": "Replaced faulty compressor, tested cooling system",
  "laborHours": 2.5,
  "laborCostPerHour": 50000,
  "partsUsed": [
    {
      "name": "Compressor Unit",
      "quantity": 1,
      "unitCost": 500000,
      "total": 500000
    },
    {
      "name": "Cooling Liquid",
      "quantity": 2,
      "unitCost": 15000,
      "total": 30000
    }
  ],
  "photos": [
    {
      "url": "https://example.com/photos/before-compressor.jpg",
      "type": "before",
      "caption": "Damaged compressor before replacement"
    },
    {
      "url": "https://example.com/photos/after-compressor.jpg",
      "type": "after",
      "caption": "New compressor installed"
    },
    {
      "url": "https://example.com/photos/work-process.jpg",
      "type": "work",
      "caption": "Installation process"
    }
  ]
}
```

#### Response (201 Created)
```json
{
  "id": "completion_123",
  "ticketId": "ticket_456",
  "completedBy": "TECHNICIAN_ID",
  "completedAt": "2024-01-15T10:30:00Z",
  "workDescription": "Replaced faulty compressor, tested cooling system",
  "laborHours": 2.5,
  "laborCostPerHour": 50000,
  "partsCost": 530000,
  "laborCost": 125000,
  "totalCost": 655000,
  "approvalStatus": "PENDING",
  "createdAt": "2024-01-15T10:35:00Z"
}
```

#### Error Responses

**400 Bad Request** - Missing or invalid fields
```json
{
  "error": "completedBy (technician ID) is required"
}
```

**400 Bad Request** - Invalid ticket status
```json
{
  "error": "Ticket must be IN_PROGRESS or ASSIGNED to complete. Current status: NEW"
}
```

### 2. Get Completion Details
**GET** `/api/completions/{id}/approve`

Retrieve full details of a service completion.

#### Response (200 OK)
```json
{
  "id": "completion_123",
  "ticketId": "ticket_456",
  "completedBy": "tech_001",
  "completedAt": "2024-01-15T10:30:00Z",
  "workDescription": "Replaced faulty compressor, tested cooling system",
  "laborHours": 2.5,
  "laborCostPerHour": 50000,
  "partsJson": "[{\"name\":\"Compressor Unit\",\"quantity\":1,\"unitCost\":500000,\"total\":500000}]",
  "photosJson": "[{\"url\":\"...\",\"type\":\"before\",\"caption\":\"...\"}]",
  "partsCost": 530000,
  "laborCost": 125000,
  "totalCost": 655000,
  "approvalStatus": "PENDING",
  "ticket": {
    "id": "ticket_456",
    "ticketNumber": "TKT-202401-00123",
    "status": "COMPLETED",
    "branch": {
      "id": "branch_789",
      "branchName": "Korzinka - Beruniy",
      "customer": {
        "id": "customer_001",
        "name": "Korzinka"
      }
    }
  }
}
```

#### Error Response

**404 Not Found**
```json
{
  "error": "Completion not found"
}
```

### 3. Approve Completion
**POST** `/api/completions/{id}/approve`

Store manager approves a completed service.

#### Request Body
```json
{
  "action": "approve"
}
```

#### Response (200 OK)
```json
{
  "id": "completion_123",
  "ticketId": "ticket_456",
  "approvalStatus": "APPROVED",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

**Effects:**
- Sets `approvalStatus` to `APPROVED`
- Updates associated ticket status to `CLOSED`
- Sets `closedAt` timestamp on ticket

### 4. Reject Completion
**POST** `/api/completions/{id}/approve`

Store manager rejects incomplete or incorrect service work.

#### Request Body
```json
{
  "action": "reject",
  "reason": "Need to replace glass window as well"
}
```

#### Response (200 OK)
```json
{
  "id": "completion_123",
  "ticketId": "ticket_456",
  "approvalStatus": "REJECTED",
  "approvalNotes": "Need to replace glass window as well",
  "updatedAt": "2024-01-15T11:00:00Z"
}
```

**Effects:**
- Sets `approvalStatus` to `REJECTED`
- Stores rejection reason in `approvalNotes`
- Reverts associated ticket status back to `IN_PROGRESS`
- Technician can then resubmit completion with fixes

#### Error Response

**400 Bad Request** - Missing reason field
```json
{
  "error": "reason is required when rejecting"
}
```

## Workflow Diagram

```
1. Create Service Completion (Technician)
   POST /api/tickets/{id}/complete
   ├─ Ticket status: IN_PROGRESS → COMPLETED
   └─ Completion status: PENDING

2. Approve Completion (Manager)
   POST /api/completions/{id}/approve
   ├─ Completion status: PENDING → APPROVED
   └─ Ticket status: COMPLETED → CLOSED

OR

2. Reject Completion (Manager)
   POST /api/completions/{id}/approve
   ├─ Completion status: PENDING → REJECTED
   └─ Ticket status: COMPLETED → IN_PROGRESS
       (Technician resubmits work)
```

## Cost Calculation

Service completion automatically calculates:

```
Parts Cost = Sum of (part.quantity * part.unitCost) for all parts
Labor Cost = laborHours * laborCostPerHour
Total Cost = Parts Cost + Labor Cost
```

Example:
```
Parts:
  - Compressor: 1 × 500,000 = 500,000
  - Liquid: 2 × 15,000 = 30,000
  Parts Total: 530,000

Labor:
  - Hours: 2.5
  - Rate: 50,000 per hour
  - Labor Total: 125,000

Total Service Cost: 655,000
```

## Validation Rules

### Creating a Completion
- `ticketId` - Must exist and ticket must be IN_PROGRESS or ASSIGNED
- `completedBy` - Required (technician ID)
- `workDescription` - Required (non-empty string)
- `laborHours` - Required (positive number)
- `laborCostPerHour` - Required (positive number)
- `partsUsed` - Required (array, can be empty)
- `photos` - Required (array, can be empty)

### Parts Array
- Each part must have: `name`, `quantity`, `unitCost`, `total`
- `total` = `quantity` × `unitCost`

### Photos Array
- Each photo must have: `url`, `type` (before|after|work)
- `caption` is optional

### Approving/Rejecting
- Completion must have status PENDING
- Cannot approve an already APPROVED or REJECTED completion
- Rejection requires a `reason` field

## Usage Examples

### Example 1: Complete a Service (cURL)
```bash
curl -X POST http://localhost:3000/api/tickets/ticket_123/complete \
  -H "Content-Type: application/json" \
  -d '{
    "completedBy": "tech_001",
    "workDescription": "Replaced compressor and tested system",
    "laborHours": 2.5,
    "laborCostPerHour": 50000,
    "partsUsed": [
      {
        "name": "Compressor",
        "quantity": 1,
        "unitCost": 500000,
        "total": 500000
      }
    ],
    "photos": [
      {
        "url": "https://example.com/photo1.jpg",
        "type": "before"
      }
    ]
  }'
```

### Example 2: Approve Completion (cURL)
```bash
curl -X POST http://localhost:3000/api/completions/completion_123/approve \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'
```

### Example 3: Reject Completion (cURL)
```bash
curl -X POST http://localhost:3000/api/completions/completion_123/approve \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "reason": "Parts incorrectly installed, need to redo"
  }'
```

### Example 4: TypeScript/Fetch Integration
```typescript
// Complete a service
async function completeService(ticketId: string) {
  const response = await fetch(`/api/tickets/${ticketId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      completedBy: 'tech_001',
      workDescription: 'Fixed cooling unit',
      laborHours: 3,
      laborCostPerHour: 50000,
      partsUsed: [
        { name: 'Compressor', quantity: 1, unitCost: 500000, total: 500000 }
      ],
      photos: [
        { url: 'https://...', type: 'before', caption: 'Before repair' }
      ]
    })
  });
  return response.json();
}

// Approve a completion
async function approveCompletion(completionId: string) {
  const response = await fetch(`/api/completions/${completionId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'approve' })
  });
  return response.json();
}
```

## Integration with Service Ticket System

The completion API integrates with the existing ticket system:

1. **Ticket Lifecycle**
   - NEW → ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED

2. **Service Completion Creates**
   - One `ServiceCompletion` record per ticket
   - Tickets are unique: `@@unique([ticketId])`

3. **Cost Tracking**
   - All service costs stored in completion record
   - Can generate invoices and billing reports

## Related Endpoints

- `GET /api/tickets` - List all tickets
- `GET /api/tickets/{id}` - Get ticket details
- `PATCH /api/tickets/{id}` - Update ticket status
- `POST /api/technicians/{id}/assign` - Assign technician to branch
- `GET /api/technicians` - List technicians

## Error Handling

All endpoints follow standard HTTP status codes:

- `200` - Success
- `201` - Resource created
- `400` - Bad request (validation error)
- `404` - Resource not found
- `500` - Server error

Error response format:
```json
{
  "error": "Human-readable error message"
}
```

## Database Schema Integration

The API uses Prisma ORM with the following key models:

```prisma
model ServiceCompletion {
  id               String         @id @default(cuid())
  ticketId         String         @unique
  completedBy      String
  completedAt      DateTime
  workDescription  String
  laborHours       Float
  laborCostPerHour Float
  partsJson        String?
  photosJson       String?
  partsCost        Float
  laborCost        Float
  totalCost        Float
  approvalStatus   ApprovalStatus @default(PENDING)
  approvalNotes    String?
  ticket           ServiceTicket
}
```

## Future Enhancements

Potential features to add:

1. **Digital Signatures** - `signatureUrl`, `signedBy`, `signedAt` fields
2. **Photo Gallery** - Store individual photo objects in separate model
3. **Part Inventory** - Link parts to inventory management system
4. **Billing Integration** - Generate invoices from completions
5. **Performance Metrics** - Track average repair time, costs by issue type
6. **Customer Feedback** - Add satisfaction rating after service
7. **Warranty Tracking** - Track warranty on replaced parts
8. **Cost Approval** - Require manager approval for high-cost repairs
