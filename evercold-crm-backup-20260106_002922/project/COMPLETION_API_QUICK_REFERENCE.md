# Service Completion API - Quick Reference

## Three Core Functions

### 1. Complete a Service (Technician)
```bash
POST /api/tickets/{TICKET_ID}/complete
```
Technician documents completed repair work.

**Quick Test:**
```bash
curl -X POST http://localhost:3000/api/tickets/YOUR_TICKET_ID/complete \
  -H "Content-Type: application/json" \
  -d '{
    "completedBy": "TECH_ID",
    "workDescription": "Fixed compressor",
    "laborHours": 2,
    "laborCostPerHour": 50000,
    "partsUsed": [{"name": "Compressor", "quantity": 1, "unitCost": 500000, "total": 500000}],
    "photos": [{"url": "https://example.com/photo.jpg", "type": "before"}]
  }'
```

### 2. Get Completion Details (Anyone)
```bash
GET /api/completions/{COMPLETION_ID}/approve
```
Retrieve completion record with full details.

**Quick Test:**
```bash
curl http://localhost:3000/api/completions/YOUR_COMPLETION_ID/approve
```

### 3. Approve/Reject (Manager)
```bash
POST /api/completions/{COMPLETION_ID}/approve
```

**Approve:**
```bash
curl -X POST http://localhost:3000/api/completions/YOUR_COMPLETION_ID/approve \
  -H "Content-Type: application/json" \
  -d '{"action": "approve"}'
```

**Reject:**
```bash
curl -X POST http://localhost:3000/api/completions/YOUR_COMPLETION_ID/approve \
  -H "Content-Type: application/json" \
  -d '{"action": "reject", "reason": "Need to replace glass"}'
```

## Status Flow

```
Ticket         ASSIGNED → IN_PROGRESS → COMPLETED → CLOSED
Completion              PENDING → APPROVED
                                 REJECTED → (back to IN_PROGRESS for redo)
```

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/completions.ts` | Business logic (5 functions) |
| `src/app/api/tickets/[id]/complete/route.ts` | POST create completion |
| `src/app/api/completions/[id]/approve/route.ts` | GET/POST approval |

## Required Fields

| Field | Type | Example |
|-------|------|---------|
| `completedBy` | string | "tech_001" |
| `workDescription` | string | "Replaced compressor" |
| `laborHours` | number | 2.5 |
| `laborCostPerHour` | number | 50000 |
| `partsUsed` | array | See below |
| `photos` | array | See below |

### Part Object Format
```json
{
  "name": "Compressor",
  "quantity": 1,
  "unitCost": 500000,
  "total": 500000
}
```

### Photo Object Format
```json
{
  "url": "https://example.com/photo.jpg",
  "type": "before|after|work",
  "caption": "Optional description"
}
```

## Cost Calculation (Automatic)
```
Parts Cost = Sum of all part totals
Labor Cost = laborHours × laborCostPerHour
Total Cost = Parts Cost + Labor Cost
```

Example:
- Parts: 530,000
- Labor: 2.5 hrs × 50,000 = 125,000
- **Total: 655,000**

## Approval Workflow

1. **Technician creates completion**
   - Status: PENDING
   - Ticket status: COMPLETED

2. **Manager reviews**
   - Can view with GET request
   - Check work description, photos, costs

3. **Manager approves**
   - Status: APPROVED
   - Ticket status: CLOSED
   - Service complete!

4. **OR Manager rejects**
   - Status: REJECTED
   - Reason stored in database
   - Ticket status: back to IN_PROGRESS
   - Technician can resubmit

## Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "completedBy is required" | Missing technician ID | Add `completedBy` field |
| "workDescription is required" | Missing description | Add `workDescription` field |
| "Ticket not found" | Wrong ticket ID | Verify ticket exists |
| "Ticket must be IN_PROGRESS" | Wrong ticket status | Assign and start ticket first |
| "Completion not found" | Wrong completion ID | Verify completion exists |
| "Can only approve PENDING" | Already approved/rejected | Cannot re-approve |

## Database Integration

Uses existing `ServiceCompletion` model with:
- Linked to `ServiceTicket` (1-to-1)
- Linked to `Technician` (optional)
- Stores JSON for parts and photos
- Calculated cost fields
- Approval status tracking

## Next Steps

1. **Test the endpoints** using curl or Postman
2. **Create a completion** for a sample ticket
3. **Approve it** to complete the workflow
4. **Check database** to verify costs calculated correctly
5. **Review photos** in the completion record

## File Paths (Absolute)

```
/Users/user/Documents/evercold-crm/src/lib/completions.ts
/Users/user/Documents/evercold-crm/src/app/api/tickets/[id]/complete/route.ts
/Users/user/Documents/evercold-crm/src/app/api/completions/[id]/approve/route.ts
```

## Git Commit

```
commit bade7a7
Author: Zafar <user@Users-MacBook-Pro.local>
Date:   [timestamp]

    feat: add service completion and approval workflow APIs

    - Created service completion business logic in src/lib/completions.ts
    - Added POST /api/tickets/{id}/complete endpoint
    - Added GET/POST /api/completions/{id}/approve endpoint
    - Automatic cost calculation (parts + labor)
    - Approval/rejection workflow with status transitions
```
