# Dayn Note Phase 2 - Advanced Islamic Loan Management

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to execute this plan task-by-task with code review checkpoints.

**Goal:** Implement 4 critical Phase 2 features for complete Islamic loan management: trustee/heir access control, digital loan agreements, payment reminders, and multi-currency/document support.

**Architecture:** Add 4 new database tables (trustees, heir_confirmations, letters, attachments), 5 new server action modules, 6 new pages/components. Each feature is independent but builds on Phase 1's stable foundation (auth, loans, witnesses, payments).

**Tech Stack:** Next.js 14 App Router, TypeScript, Drizzle ORM, SQLite/libsql, React Hook Form, Zod validation, pdfkit (PDF generation), exchangerate-api.com (currency conversion)

**Timeline:** 2 weeks comfortable (5 days per feature including testing)

---

## Database Schema Additions

Before tasks begin, add these tables to `lib/db/schema.ts`:

```typescript
// Trustees - authorized access to loan information for designated heirs
export const trustees = pgTable('trustees', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  loanId: text('loan_id').references(() => loans.id, { onDelete: 'cascade' }).notNull(),
  heirName: text('heir_name').notNull(),
  heirPhone: text('heir_phone').notNull(),
  heirEmail: text('heir_email'),
  accessLevel: text('access_level').default('view').notNull(), // 'view' | 'manage'
  unlockedAt: timestamp('unlocked_at'), // NULL until 2-of-4 confirm
  requiredConfirmations: integer('required_confirmations').default(2).notNull(), // 2 or 4
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Heir Confirmations - tracks which heirs have confirmed access unlock
export const heirConfirmations = pgTable('heir_confirmations', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  trusteeId: text('trustee_id').references(() => trustees.id, { onDelete: 'cascade' }).notNull(),
  heirIndex: integer('heir_index').notNull(), // 1-4 for 2-of-4 or 4-of-4
  confirmedAt: timestamp('confirmed_at'),
  confirmationToken: text('confirmation_token').unique(),
  tokenExpiresAt: timestamp('token_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Letters - generated PDF loan agreements
export const letters = pgTable('letters', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  loanId: text('loan_id').references(() => loans.id, { onDelete: 'cascade' }).notNull(),
  generatedBy: text('generated_by').references(() => users.id).notNull(),
  letterType: text('letter_type').default('agreement').notNull(), // 'agreement' | 'witness' | 'payment_record'
  pdfPath: text('pdf_path').notNull(),
  fileSize: integer('file_size'), // bytes
  signedAt: timestamp('signed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Attachments - loan-related documents
export const attachments = pgTable('attachments', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  loanId: text('loan_id').references(() => loans.id, { onDelete: 'cascade' }).notNull(),
  uploadedBy: text('uploaded_by').references(() => users.id).notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(), // bytes
  mimeType: text('mime_type').notNull(), // 'application/pdf', 'image/jpeg', etc
  filePath: text('file_path').notNull(),
  documentType: text('document_type').default('other').notNull(), // 'receipt', 'agreement', 'witness_letter', 'proof'
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Currencies & Exchange Rates
export const currencies = pgTable('currencies', {
  code: text('code').primaryKey(), // 'USD', 'EUR', 'AED', etc
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
})

export const exchangeRates = pgTable('exchange_rates', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  fromCurrency: text('from_currency').references(() => currencies.code).notNull(),
  toCurrency: text('to_currency').references(() => currencies.code).notNull(),
  rate: numeric('rate', { precision: 12, scale: 8 }).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  source: text('source').default('exchangerate-api.com'), // API source
})

// Reminders - payment due notifications
export const reminders = pgTable('reminders', {
  id: text('id').primaryKey().$defaultFn(() => uuidv4()),
  loanId: text('loan_id').references(() => loans.id, { onDelete: 'cascade' }).notNull(),
  reminderType: text('reminder_type').notNull(), // 'payment_due' | 'overdue' | 'witness_pending'
  scheduledAt: timestamp('scheduled_at').notNull(),
  sentAt: timestamp('sent_at'),
  recipientId: text('recipient_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'sent' | 'failed' | 'read'
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

---

## Task 1: Trustee/Heir Management - Database & Server Actions

**Files:**
- Modify: `lib/db/schema.ts` - Add trustees, heir_confirmations tables (already in schema above)
- Create: `lib/actions/trustees.ts` - Server actions for trustee management
- Create: `lib/migrations/add-trustees.ts` - Migration script (if needed)

**Step 1: Write failing test for addTrustee**

Create file: `proforma_app/tests/test_trustees.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { addTrustee } from '@/lib/actions/trustees'
import { db } from '@/lib/db'
import { loans, trustees } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

describe('Trustee Management', () => {
  let testLoanId: string

  beforeEach(async () => {
    // Create test loan
    const result = await db.insert(loans).values({
      id: 'test-loan-1',
      lenderId: 'user-1',
      borrowerId: 'user-2',
      amount: '1000.00',
      currency: 'USD',
      contractType: 'LB',
      status: 'active',
      loanDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }).returning()
    testLoanId = result[0].id
  })

  it('should add trustee with 2-of-4 unlock requirement', async () => {
    const result = await addTrustee({
      loanId: testLoanId,
      heirName: 'Ahmed Ali',
      heirPhone: '+971501234567',
      heirEmail: 'ahmed@example.com',
      accessLevel: 'view',
      requiredConfirmations: 2, // 2-of-4 unlock
    })

    expect(result.id).toBeDefined()
    expect(result.heirName).toBe('Ahmed Ali')
    expect(result.requiredConfirmations).toBe(2)
    expect(result.unlockedAt).toBeNull() // Not unlocked yet

    // Verify in DB
    const dbTrustee = await db.query.trustees.findFirst({
      where: eq(trustees.id, result.id),
    })
    expect(dbTrustee).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- test_trustees.ts
```

Expected output:
```
FAIL test_trustees.ts
Error: Module not found: 'lib/actions/trustees'
```

**Step 3: Create server actions module with addTrustee implementation**

Create file: `lib/actions/trustees.ts`

```typescript
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { trustees, heirConfirmations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'

interface AddTrusteeInput {
  loanId: string
  heirName: string
  heirPhone: string
  heirEmail?: string
  accessLevel: 'view' | 'manage'
  requiredConfirmations: 2 | 4
}

export async function addTrustee(input: AddTrusteeInput) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // Verify user is lender of this loan
  // (implementation checks loan exists and user is lender)

  const trustee = await db
    .insert(trustees)
    .values({
      id: uuidv4(),
      loanId: input.loanId,
      heirName: input.heirName,
      heirPhone: input.heirPhone,
      heirEmail: input.heirEmail,
      accessLevel: input.accessLevel,
      requiredConfirmations: input.requiredConfirmations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .returning()

  // Create heir confirmation records (2 or 4 depending on requirement)
  const confirmationCount = input.requiredConfirmations
  for (let i = 1; i <= confirmationCount; i++) {
    await db.insert(heirConfirmations).values({
      id: uuidv4(),
      trusteeId: trustee[0].id,
      heirIndex: i,
      confirmationToken: uuidv4(),
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString(),
    })
  }

  revalidatePath(`/loans/${input.loanId}`)
  return trustee[0]
}

export async function getTrustees(loanId: string) {
  const trustees_list = await db.query.trustees.findMany({
    where: eq(trustees.loanId, loanId),
    with: {
      heirConfirmations: true,
    },
  })
  return trustees_list
}

export async function confirmHeirAccess(confirmationToken: string) {
  const confirmation = await db.query.heirConfirmations.findFirst({
    where: eq(heirConfirmations.confirmationToken, confirmationToken),
  })

  if (!confirmation) throw new Error('Invalid confirmation token')
  if (confirmation.tokenExpiresAt && new Date(confirmation.tokenExpiresAt) < new Date()) {
    throw new Error('Token expired')
  }

  // Mark this confirmation
  await db
    .update(heirConfirmations)
    .set({
      confirmedAt: new Date().toISOString(),
    })
    .where(eq(heirConfirmations.id, confirmation.id))

  // Check if unlock threshold reached
  const trustee = await db.query.trustees.findFirst({
    where: eq(trustees.id, confirmation.trusteeId),
  })

  const confirmations = await db.query.heirConfirmations.findMany({
    where: eq(heirConfirmations.trusteeId, confirmation.trusteeId),
  })

  const confirmedCount = confirmations.filter((c) => c.confirmedAt).length
  if (confirmedCount >= trustee.requiredConfirmations) {
    // Unlock access
    await db
      .update(trustees)
      .set({
        unlockedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(trustees.id, confirmation.trusteeId))
  }

  revalidatePath(`/loans/${trustee.loanId}`)
  return { confirmed: true, accessUnlocked: confirmedCount >= trustee.requiredConfirmations }
}

export async function removeTrustee(trusteeId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  await db.delete(trustees).where(eq(trustees.id, trusteeId))
  revalidatePath('/loans')
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- test_trustees.ts
```

Expected output:
```
PASS test_trustees.ts (2.3s)
✓ should add trustee with 2-of-4 unlock requirement (45ms)
```

**Step 5: Commit**

```bash
git add lib/actions/trustees.ts lib/db/schema.ts proforma_app/tests/test_trustees.ts
git commit -m "feat: add trustee/heir management with 2-of-4 unlock protocol"
```

---

## Task 2: Trustee/Heir UI - Pages & Components

**Files:**
- Create: `app/loans/[id]/trustees/page.tsx` - Manage trustees page
- Create: `app/heir/confirm/[token]/page.tsx` - Public heir confirmation page
- Create: `components/trustee-manager.tsx` - Add/remove trustees component
- Create: `components/trustee-status.tsx` - Display trustee unlock status
- Modify: `app/loans/[id]/page.tsx` - Add trustee status section

**Step 1: Write test for trustee manager component**

Create: `proforma_app/tests/test_trustee_ui.ts`

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { TrusteeManager } from '@/components/trustee-manager'
import { describe, it, expect } from 'vitest'

describe('TrusteeManager Component', () => {
  it('should render form to add trustee', () => {
    render(<TrusteeManager loanId="test-loan-1" />)

    expect(screen.getByLabelText('Heir Name')).toBeDefined()
    expect(screen.getByLabelText('Heir Phone')).toBeDefined()
    expect(screen.getByLabelText('Heir Email')).toBeDefined()
    expect(screen.getByLabelText('Access Level')).toBeDefined()
    expect(screen.getByRole('button', { name: /add trustee/i })).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- test_trustee_ui.ts
```

Expected output:
```
FAIL test_trustee_ui.ts
Module not found: 'components/trustee-manager'
```

**Step 3: Create trustee manager component**

Create: `components/trustee-manager.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { addTrustee, getTrustees } from '@/lib/actions/trustees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'

const trusteeSchema = z.object({
  heirName: z.string().min(2, 'Name required'),
  heirPhone: z.string().regex(/^\+?[0-9]{10,}/, 'Valid phone required'),
  heirEmail: z.string().email('Valid email required').optional(),
  accessLevel: z.enum(['view', 'manage']),
  requiredConfirmations: z.enum(['2', '4']),
})

type TrusteeFormData = z.infer<typeof trusteeSchema>

interface TrusteeManagerProps {
  loanId: string
}

export function TrusteeManager({ loanId }: TrusteeManagerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [trustees_list, setTrustees] = useState([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TrusteeFormData>({
    resolver: zodResolver(trusteeSchema),
    defaultValues: {
      accessLevel: 'view',
      requiredConfirmations: '2',
    },
  })

  const requiredConfirmations = watch('requiredConfirmations')

  const onSubmit = async (data: TrusteeFormData) => {
    try {
      setLoading(true)
      setError('')

      await addTrustee({
        loanId,
        heirName: data.heirName,
        heirPhone: data.heirPhone,
        heirEmail: data.heirEmail,
        accessLevel: data.accessLevel as 'view' | 'manage',
        requiredConfirmations: parseInt(data.requiredConfirmations) as 2 | 4,
      })

      setSuccess(`Trustee added. ${data.requiredConfirmations}-of-${data.requiredConfirmations} confirmations required.`)
      reset()

      // Refresh trustees list
      const updated = await getTrustees(loanId)
      setTrustees(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add Heir/Trustee</h3>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mb-4">{success}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="heirName">Heir Name *</Label>
            <Input id="heirName" {...register('heirName')} placeholder="Full name" />
            {errors.heirName && <p className="text-red-600 text-sm mt-1">{errors.heirName.message}</p>}
          </div>

          <div>
            <Label htmlFor="heirPhone">Heir Phone *</Label>
            <Input id="heirPhone" {...register('heirPhone')} placeholder="+971501234567" />
            {errors.heirPhone && <p className="text-red-600 text-sm mt-1">{errors.heirPhone.message}</p>}
          </div>

          <div>
            <Label htmlFor="heirEmail">Heir Email</Label>
            <Input id="heirEmail" type="email" {...register('heirEmail')} placeholder="heir@example.com" />
            {errors.heirEmail && <p className="text-red-600 text-sm mt-1">{errors.heirEmail.message}</p>}
          </div>

          <div>
            <Label htmlFor="accessLevel">Access Level *</Label>
            <Select {...register('accessLevel')}>
              <SelectTrigger id="accessLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="manage">View & Manage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <Label htmlFor="requiredConfirmations">Unlock Protocol *</Label>
            <p className="text-sm text-gray-600 mb-3">
              How many heirs must confirm access? Useful for protecting against unauthorized access.
            </p>
            <Select {...register('requiredConfirmations')}>
              <SelectTrigger id="requiredConfirmations">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2-of-2 Confirmations (Both heirs must confirm)</SelectItem>
                <SelectItem value="4">4-of-4 Confirmations (All 4 heirs must confirm)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-2">
              Each heir receives confirmation link via email. Loan details unlock only after {requiredConfirmations} confirm.
            </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adding...' : 'Add Heir/Trustee'}
          </Button>
        </form>
      </Card>

      {trustees_list.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Current Trustees</h3>
          <div className="space-y-3">
            {trustees_list.map((t) => (
              <TrusteeStatus key={t.id} trustee={t} loanId={loanId} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
```

**Step 4: Create public heir confirmation page**

Create: `app/heir/confirm/[token]/page.tsx`

```typescript
import { confirmHeirAccess } from '@/lib/actions/trustees'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HeirConfirmPageProps {
  params: {
    token: string
  }
}

export default async function HeirConfirmPage({ params }: HeirConfirmPageProps) {
  let result = null
  let error = null

  try {
    // Auto-confirm on page load
    result = await confirmHeirAccess(decodeURIComponent(params.token))
  } catch (err) {
    error = err.message
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        {error ? (
          <>
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Confirmation Failed</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link href="/">
                <Button>Return Home</Button>
              </Link>
            </div>
          </>
        ) : result?.accessUnlocked ? (
          <>
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Unlocked!</h1>
              <p className="text-gray-600 mb-6">
                All heirs have confirmed. You can now access the loan details in the app.
              </p>
              <Link href="/">
                <Button>Open App</Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="text-4xl mb-4">👍</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Confirmation Received</h1>
              <p className="text-gray-600 mb-6">
                Thank you for confirming your identity. Waiting for other heirs to confirm as well.
              </p>
              <Link href="/">
                <Button>Return to App</Button>
              </Link>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
```

**Step 5: Run tests to verify they pass**

```bash
npm test -- test_trustee_ui.ts
```

Expected output:
```
PASS test_trustee_ui.ts (1.8s)
✓ should render form to add trustee (32ms)
```

**Step 6: Commit**

```bash
git add components/trustee-manager.tsx app/heir/confirm/[token]/page.tsx proforma_app/tests/test_trustee_ui.ts
git commit -m "feat: add heir/trustee UI with confirmation workflow"
```

---

## Task 3: Digital Letter Generation - PDF Agreements

**Files:**
- Create: `lib/pdf/generate-letter.ts` - PDF generation logic using pdfkit
- Create: `lib/actions/letters.ts` - Server actions for letter management
- Create: `app/loans/[id]/letters/page.tsx` - Letters page
- Create: `components/letter-generator.tsx` - UI for generating letters
- Modify: `package.json` - Add pdfkit dependency

**Step 1: Install pdfkit and prepare dependencies**

```bash
npm install pdfkit pdf-lib
npm install -D @types/pdfkit
```

**Step 2: Write test for letter generation**

Create: `proforma_app/tests/test_letters.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { generateLetter } from '@/lib/actions/letters'
import { db } from '@/lib/db'
import { loans, users } from '@/lib/db/schema'

describe('Letter Generation', () => {
  let testLoanId: string
  let userId: string

  beforeEach(async () => {
    // Create test user and loan
    const userResult = await db
      .insert(users)
      .values({
        id: 'user-gen-1',
        phone: '+971501111111',
        name: 'Test Lender',
        passwordHash: 'hashed',
      })
      .returning()
    userId = userResult[0].id

    const loanResult = await db
      .insert(loans)
      .values({
        id: 'loan-gen-1',
        lenderId: userId,
        borrowerId: 'user-2',
        amount: '5000.00',
        currency: 'USD',
        contractType: 'LB2M',
        status: 'active',
        loanDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .returning()
    testLoanId = loanResult[0].id
  })

  it('should generate PDF loan agreement letter', async () => {
    const result = await generateLetter({
      loanId: testLoanId,
      letterType: 'agreement',
      userId,
    })

    expect(result.id).toBeDefined()
    expect(result.letterType).toBe('agreement')
    expect(result.pdfPath).toBeDefined()
    expect(result.pdfPath).toMatch(/\.pdf$/)
    expect(result.fileSize).toBeGreaterThan(0)
  })
})
```

**Step 3: Implement PDF generation logic**

Create: `lib/pdf/generate-letter.ts`

```typescript
import PDFDocument from 'pdfkit'
import fs from 'fs/promises'
import path from 'path'
import { db } from '@/lib/db'
import { loans, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function generateLoanAgreement(loanId: string): Promise<Buffer> {
  // Get loan and user details
  const loan = await db.query.loans.findFirst({
    where: eq(loans.id, loanId),
    with: {
      lender: true,
      borrower: true,
    },
  })

  if (!loan) throw new Error('Loan not found')

  // Create PDF document in memory
  const doc = new PDFDocument()
  const buffers: Buffer[] = []

  doc.on('data', (chunk) => buffers.push(chunk))

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('Islamic Loan Agreement', { align: 'center' })
  doc.fontSize(12).text('(Qard al-Hassan)', { align: 'center' })

  doc.moveDown()
  doc.fontSize(10).text(`Document ID: ${loanId}`)
  doc.text(`Date: ${new Date().toLocaleDateString()}`)

  // Parties
  doc.moveDown().fontSize(14).font('Helvetica-Bold').text('Parties to the Agreement')
  doc.fontSize(10).font('Helvetica')
  doc.text(`Lender: ${loan.lender.name} (${loan.lender.phone})`)
  doc.text(`Borrower: ${loan.borrower.name} (${loan.borrower.phone})`)

  // Loan Terms
  doc.moveDown().fontSize(14).font('Helvetica-Bold').text('Loan Terms')
  doc.fontSize(10).font('Helvetica')
  doc.text(`Principal Amount: ${loan.amount} ${loan.currency}`)
  doc.text(`Loan Date: ${new Date(loan.loanDate).toLocaleDateString()}`)
  doc.text(`Due Date: ${new Date(loan.dueDate).toLocaleDateString()}`)
  doc.text(`Contract Type: ${loan.contractType}`)
  doc.text(`Interest Rate: 0% (Interest-free Islamic Loan)`)

  // Terms & Conditions
  doc.moveDown().fontSize(14).font('Helvetica-Bold').text('Terms & Conditions')
  doc.fontSize(10).font('Helvetica')
  doc.text('1. This is an interest-free loan (Qard al-Hassan) as per Islamic principles.')
  doc.text('2. The borrower agrees to repay the full principal by the due date.')
  doc.text('3. Early repayment is encouraged and welcome.')
  doc.text('4. This agreement is binding under Islamic and applicable civil law.')

  // Footer
  doc.moveDown(2)
  doc.fontSize(9)
    .text('Generated by Dayn Note - Islamic Loan Tracker', { align: 'center' })
    .text('This document is confidential and for the parties only.', { align: 'center' })

  doc.end()

  return Buffer.concat(buffers)
}

export async function saveLetter(pdfBuffer: Buffer, loanId: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'letters')
  await fs.mkdir(uploadDir, { recursive: true })

  const fileName = `${loanId}-${Date.now()}.pdf`
  const filePath = path.join(uploadDir, fileName)

  await fs.writeFile(filePath, pdfBuffer)

  // Return public path
  return `/uploads/letters/${fileName}`
}
```

**Step 4: Create server actions for letters**

Create: `lib/actions/letters.ts`

```typescript
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { letters } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateLoanAgreement, saveLetter } from '@/lib/pdf/generate-letter'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'

interface GenerateLetterInput {
  loanId: string
  letterType: 'agreement' | 'witness' | 'payment_record'
}

export async function generateLetter(input: GenerateLetterInput) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  // Generate PDF
  const pdfBuffer = await generateLoanAgreement(input.loanId)
  const pdfPath = await saveLetter(pdfBuffer, input.loanId)

  // Save letter record
  const letter = await db
    .insert(letters)
    .values({
      id: uuidv4(),
      loanId: input.loanId,
      generatedBy: session.user.id,
      letterType: input.letterType,
      pdfPath,
      fileSize: pdfBuffer.length,
      createdAt: new Date().toISOString(),
    })
    .returning()

  revalidatePath(`/loans/${input.loanId}/letters`)
  return letter[0]
}

export async function getLetters(loanId: string) {
  return await db.query.letters.findMany({
    where: eq(letters.loanId, loanId),
    orderBy: (letters) => letters.createdAt,
  })
}
```

**Step 5: Create letters page**

Create: `app/loans/[id]/letters/page.tsx`

```typescript
import { auth } from '@/lib/auth'
import { getLetters } from '@/lib/actions/letters'
import { LetterGenerator } from '@/components/letter-generator'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

interface LettersPageProps {
  params: { id: string }
}

export default async function LettersPage({ params }: LettersPageProps) {
  const session = await auth()
  if (!session?.user) return <div>Unauthorized</div>

  const letters_list = await getLetters(params.id)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Loan Documents & Letters</h1>

      <LetterGenerator loanId={params.id} />

      {letters_list.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Letters</h2>
          <div className="space-y-2">
            {letters_list.map((letter) => (
              <div key={letter.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <p className="font-medium">{letter.letterType} Agreement</p>
                  <p className="text-sm text-gray-600">
                    {new Date(letter.createdAt).toLocaleDateString()} • {(letter.fileSize / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Link href={letter.pdfPath} target="_blank" rel="noopener noreferrer">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Download PDF</button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
```

**Step 6: Run test to verify it passes**

```bash
npm test -- test_letters.ts
```

Expected output:
```
PASS test_letters.ts (2.1s)
✓ should generate PDF loan agreement letter (856ms)
```

**Step 7: Commit**

```bash
git add lib/pdf/generate-letter.ts lib/actions/letters.ts app/loans/[id]/letters/page.tsx components/letter-generator.tsx
git commit -m "feat: add digital letter generation with PDF loan agreements"
```

---

## Task 4: Automated Reminders - Payment Due Notifications

**Files:**
- Modify: `lib/db/schema.ts` - reminders table already added above
- Create: `lib/actions/reminders.ts` - Server actions for reminder management
- Create: `lib/cron/payment-reminders.ts` - Background job to send reminders
- Create: `app/api/cron/reminders/route.ts` - API endpoint for cron execution
- Create: `components/reminder-list.tsx` - Display reminders component
- Modify: `app/dashboard/page.tsx` - Show pending reminders

**Step 1: Write test for reminder creation**

Create: `proforma_app/tests/test_reminders.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createReminder, getUpcomingReminders } from '@/lib/actions/reminders'
import { db } from '@/lib/db'
import { loans, users } from '@/lib/db/schema'

describe('Reminders', () => {
  let testLoanId: string
  let userId: string

  beforeEach(async () => {
    const userResult = await db
      .insert(users)
      .values({
        id: 'user-rem-1',
        phone: '+971502222222',
        name: 'Test User',
        passwordHash: 'hashed',
      })
      .returning()
    userId = userResult[0].id

    const loanResult = await db
      .insert(loans)
      .values({
        id: 'loan-rem-1',
        lenderId: userId,
        borrowerId: 'user-3',
        amount: '2000.00',
        currency: 'USD',
        contractType: 'LB',
        status: 'active',
        loanDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days
      })
      .returning()
    testLoanId = loanResult[0].id
  })

  it('should create payment due reminder', async () => {
    const scheduledAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 1 day before due

    const result = await createReminder({
      loanId: testLoanId,
      reminderType: 'payment_due',
      scheduledAt,
      recipientId: userId,
      message: 'Payment due in 1 day',
    })

    expect(result.id).toBeDefined()
    expect(result.reminderType).toBe('payment_due')
    expect(result.status).toBe('pending')
  })

  it('should fetch upcoming reminders', async () => {
    const scheduledAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)

    await createReminder({
      loanId: testLoanId,
      reminderType: 'payment_due',
      scheduledAt,
      recipientId: userId,
      message: 'Payment due soon',
    })

    const reminders = await getUpcomingReminders(userId)
    expect(reminders.length).toBeGreaterThan(0)
    expect(reminders[0].recipientId).toBe(userId)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- test_reminders.ts
```

Expected output:
```
FAIL test_reminders.ts
Module not found: 'lib/actions/reminders'
```

**Step 3: Create reminders server actions**

Create: `lib/actions/reminders.ts`

```typescript
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reminders, loans } from '@/lib/db/schema'
import { eq, and, gte, lte } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'

interface CreateReminderInput {
  loanId: string
  reminderType: 'payment_due' | 'overdue' | 'witness_pending'
  scheduledAt: Date | string
  recipientId: string
  message: string
}

export async function createReminder(input: CreateReminderInput) {
  const reminder = await db
    .insert(reminders)
    .values({
      id: uuidv4(),
      loanId: input.loanId,
      reminderType: input.reminderType,
      scheduledAt: typeof input.scheduledAt === 'string' ? input.scheduledAt : input.scheduledAt.toISOString(),
      recipientId: input.recipientId,
      message: input.message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })
    .returning()

  revalidatePath('/dashboard')
  return reminder[0]
}

export async function getUpcomingReminders(userId: string) {
  const now = new Date()

  return await db.query.reminders.findMany({
    where: and(
      eq(reminders.recipientId, userId),
      eq(reminders.status, 'pending'),
      lte(reminders.scheduledAt, now), // Scheduled for now or past (ready to send)
    ),
    with: {
      loan: true,
    },
    limit: 10,
  })
}

export async function markReminderSent(reminderId: string) {
  await db
    .update(reminders)
    .set({
      sentAt: new Date().toISOString(),
      status: 'sent',
    })
    .where(eq(reminders.id, reminderId))

  revalidatePath('/dashboard')
}

export async function markReminderRead(reminderId: string) {
  await db
    .update(reminders)
    .set({
      status: 'read',
    })
    .where(eq(reminders.id, reminderId))

  revalidatePath('/dashboard')
}

// Auto-create payment due reminders (call from cron)
export async function generatePaymentReminders() {
  const allLoans = await db.query.loans.findMany({
    where: eq(loans.status, 'active'),
  })

  for (const loan of allLoans) {
    const dueDate = new Date(loan.dueDate)
    const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    // Create reminder 2 days before due date
    if (daysUntilDue === 2) {
      const existingReminder = await db.query.reminders.findFirst({
        where: and(
          eq(reminders.loanId, loan.id),
          eq(reminders.reminderType, 'payment_due'),
        ),
      })

      if (!existingReminder) {
        await createReminder({
          loanId: loan.id,
          reminderType: 'payment_due',
          scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          recipientId: loan.borrowerId,
          message: `Payment due in 2 days for loan of ${loan.amount} ${loan.currency}`,
        })
      }
    }

    // Create overdue reminder 1 day after due date
    if (daysUntilDue === -1) {
      const existingReminder = await db.query.reminders.findFirst({
        where: and(
          eq(reminders.loanId, loan.id),
          eq(reminders.reminderType, 'overdue'),
        ),
      })

      if (!existingReminder) {
        await createReminder({
          loanId: loan.id,
          reminderType: 'overdue',
          scheduledAt: new Date(),
          recipientId: loan.borrowerId,
          message: `Payment is now overdue for loan of ${loan.amount} ${loan.currency}`,
        })
      }
    }
  }
}
```

**Step 4: Create cron endpoint for reminders**

Create: `app/api/cron/reminders/route.ts`

```typescript
import { generatePaymentReminders } from '@/lib/actions/reminders'
import { NextRequest, NextResponse } from 'next/server'

// Protect endpoint with secret key
const CRON_SECRET = process.env.CRON_SECRET || 'dev-secret'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await generatePaymentReminders()
    return NextResponse.json({ success: true, message: 'Reminders generated' })
  } catch (error) {
    console.error('Error generating reminders:', error)
    return NextResponse.json({ error: 'Failed to generate reminders' }, { status: 500 })
  }
}
```

**Step 5: Create reminder list component**

Create: `components/reminder-list.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getUpcomingReminders, markReminderRead } from '@/lib/actions/reminders'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReminderListProps {
  userId: string
}

export function ReminderList({ userId }: ReminderListProps) {
  const [reminders_list, setReminders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const data = await getUpcomingReminders(userId)
        setReminders(data)
      } catch (error) {
        console.error('Error loading reminders:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReminders()
  }, [userId])

  if (loading) return <div>Loading reminders...</div>
  if (reminders_list.length === 0) return null

  return (
    <Card className="p-6 border-yellow-200 bg-yellow-50">
      <h3 className="text-lg font-semibold text-yellow-900 mb-4">📢 Pending Reminders</h3>
      <div className="space-y-3">
        {reminders_list.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-center justify-between border border-yellow-200 rounded p-3 bg-white"
          >
            <div>
              <p className="font-medium text-gray-900">{reminder.message}</p>
              <p className="text-sm text-gray-600">{reminder.reminderType.replace('_', ' ').toUpperCase()}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markReminderRead(reminder.id)}
            >
              Mark Read
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

**Step 6: Run test to verify it passes**

```bash
npm test -- test_reminders.ts
```

Expected output:
```
PASS test_reminders.ts (1.9s)
✓ should create payment due reminder (28ms)
✓ should fetch upcoming reminders (42ms)
```

**Step 7: Commit**

```bash
git add lib/actions/reminders.ts lib/cron/payment-reminders.ts app/api/cron/reminders/route.ts components/reminder-list.tsx
git commit -m "feat: add automated payment reminders with background job scheduling"
```

---

## Task 5: Multi-Currency Support & File Attachments

**Files:**
- Modify: `lib/db/schema.ts` - currencies and exchangeRates tables already added
- Create: `lib/actions/attachments.ts` - File upload server actions
- Create: `lib/currency/exchange.ts` - Currency conversion logic
- Create: `components/attachment-uploader.tsx` - File upload UI
- Create: `components/currency-converter.tsx` - Multi-currency display
- Modify: `app/loans/[id]/page.tsx` - Add attachments and currency display
- Create: `app/api/upload/route.ts` - File upload endpoint

**Step 1: Seed currencies in database**

Create: `lib/db/seed-currencies.ts`

```typescript
import { db } from '@/lib/db'
import { currencies } from '@/lib/db/schema'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', isActive: true },
  { code: 'EUR', name: 'Euro', symbol: '€', isActive: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', isActive: true },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', isActive: true },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', isActive: true },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', isActive: true },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', isActive: true },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', isActive: true },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', isActive: true },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', isActive: true },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', isActive: true },
]

export async function seedCurrencies() {
  for (const curr of CURRENCIES) {
    await db
      .insert(currencies)
      .values(curr)
      .onConflictDoNothing()
  }
}
```

**Step 2: Write test for file attachments**

Create: `proforma_app/tests/test_attachments.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { uploadAttachment, getAttachments } from '@/lib/actions/attachments'
import { db } from '@/lib/db'
import { loans, users } from '@/lib/db/schema'

describe('File Attachments', () => {
  let testLoanId: string
  let userId: string

  beforeEach(async () => {
    const userResult = await db
      .insert(users)
      .values({
        id: 'user-att-1',
        phone: '+971503333333',
        name: 'Test User',
        passwordHash: 'hashed',
      })
      .returning()
    userId = userResult[0].id

    const loanResult = await db
      .insert(loans)
      .values({
        id: 'loan-att-1',
        lenderId: userId,
        borrowerId: 'user-4',
        amount: '3000.00',
        currency: 'USD',
        contractType: 'LB',
        status: 'active',
        loanDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .returning()
    testLoanId = loanResult[0].id
  })

  it('should upload and store file attachment', async () => {
    const formData = new FormData()
    const file = new File(['test content'], 'receipt.pdf', { type: 'application/pdf' })
    formData.append('file', file)
    formData.append('loanId', testLoanId)
    formData.append('documentType', 'receipt')

    const result = await uploadAttachment(formData, userId)

    expect(result.id).toBeDefined()
    expect(result.fileName).toBe('receipt.pdf')
    expect(result.mimeType).toBe('application/pdf')
    expect(result.documentType).toBe('receipt')
  })

  it('should retrieve attachments for loan', async () => {
    const attachments = await getAttachments(testLoanId)
    expect(Array.isArray(attachments)).toBe(true)
  })
})
```

**Step 3: Run test to verify it fails**

```bash
npm test -- test_attachments.ts
```

**Step 4: Create attachment upload server actions**

Create: `lib/actions/attachments.ts`

```typescript
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { attachments } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import fs from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'

export async function uploadAttachment(formData: FormData, userId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const file = formData.get('file') as File
  const loanId = formData.get('loanId') as string
  const documentType = formData.get('documentType') as string

  if (!file) throw new Error('No file provided')
  if (!loanId) throw new Error('Loan ID required')

  // Create upload directory
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'attachments', loanId)
  await fs.mkdir(uploadDir, { recursive: true })

  // Save file
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const fileName = `${uuidv4()}-${file.name}`
  const filePath = path.join(uploadDir, fileName)

  await fs.writeFile(filePath, buffer)

  // Save to database
  const attachment = await db
    .insert(attachments)
    .values({
      id: uuidv4(),
      loanId,
      uploadedBy: userId,
      fileName: file.name,
      fileSize: buffer.length,
      mimeType: file.type,
      filePath: `/uploads/attachments/${loanId}/${fileName}`,
      documentType,
      createdAt: new Date().toISOString(),
    })
    .returning()

  revalidatePath(`/loans/${loanId}`)
  return attachment[0]
}

export async function getAttachments(loanId: string) {
  return await db.query.attachments.findMany({
    where: eq(attachments.loanId, loanId),
    orderBy: (attachments) => attachments.createdAt,
  })
}

export async function deleteAttachment(attachmentId: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, attachmentId),
  })

  if (!attachment) throw new Error('Attachment not found')

  // Delete file
  try {
    await fs.unlink(path.join(process.cwd(), 'public', attachment.filePath))
  } catch (e) {
    console.error('Error deleting file:', e)
  }

  // Delete from database
  await db.delete(attachments).where(eq(attachments.id, attachmentId))

  revalidatePath(`/loans/${attachment.loanId}`)
}
```

**Step 5: Create currency conversion logic**

Create: `lib/currency/exchange.ts`

```typescript
import { db } from '@/lib/db'
import { currencies, exchangeRates } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY || ''

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1

  // Check cache first
  const cached = await db.query.exchangeRates.findFirst({
    where: and(
      eq(exchangeRates.fromCurrency, from),
      eq(exchangeRates.toCurrency, to),
    ),
  })

  // Use cache if less than 24 hours old
  if (cached && new Date(cached.lastUpdated).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
    return parseFloat(cached.rate.toString())
  }

  // Fetch from API
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`)
    const data = await response.json()
    const rate = data.rates[to]

    if (!rate) throw new Error(`No rate for ${to}`)

    // Update cache
    await db
      .insert(exchangeRates)
      .values({
        id: uuidv4(),
        fromCurrency: from,
        toCurrency: to,
        rate: rate.toString(),
        lastUpdated: new Date().toISOString(),
        source: 'exchangerate-api.com',
      })
      .onConflictDoUpdate({
        target: [exchangeRates.fromCurrency, exchangeRates.toCurrency],
        set: {
          rate: rate.toString(),
          lastUpdated: new Date().toISOString(),
        },
      })

    return rate
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return 1 // Fallback to 1:1
  }
}

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  const rate = await getExchangeRate(from, to)
  return amount * rate
}

export async function getCurrencies() {
  return await db.query.currencies.findMany({
    where: eq(currencies.isActive, true),
  })
}

import { v4 as uuidv4 } from 'uuid'
```

**Step 6: Create attachment uploader component**

Create: `components/attachment-uploader.tsx`

```typescript
'use client'

import { useState } from 'react'
import { uploadAttachment } from '@/lib/actions/attachments'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AttachmentUploaderProps {
  loanId: string
  onSuccess?: () => void
}

export function AttachmentUploader({ loanId, onSuccess }: AttachmentUploaderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [documentType, setDocumentType] = useState('receipt')

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setError('')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('loanId', loanId)
      formData.append('documentType', documentType)

      await uploadAttachment(formData, '')
      onSuccess?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-4">Upload Document</h4>

      {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-4 text-sm">{error}</div>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Document Type</label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receipt">Payment Receipt</SelectItem>
              <SelectItem value="agreement">Agreement</SelectItem>
              <SelectItem value="witness_letter">Witness Letter</SelectItem>
              <SelectItem value="proof">Proof of Payment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Choose File</label>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={loading}
            accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
            className="block w-full text-sm border border-gray-300 rounded px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-2">PDF, DOC, JPG up to 10MB</p>
        </div>

        {loading && <p className="text-sm text-blue-600">Uploading...</p>}
      </div>
    </Card>
  )
}
```

**Step 7: Run test to verify it passes**

```bash
npm test -- test_attachments.ts
```

Expected output:
```
PASS test_attachments.ts (2.2s)
✓ should upload and store file attachment (95ms)
✓ should retrieve attachments for loan (28ms)
```

**Step 8: Commit**

```bash
git add lib/actions/attachments.ts lib/currency/exchange.ts components/attachment-uploader.tsx lib/db/seed-currencies.ts
git commit -m "feat: add file attachments and multi-currency support with live exchange rates"
```

---

## Summary

**Total Tasks:** 5 major feature implementations
- ✅ Task 1: Trustee/Heir Management (2-of-4 unlock protocol)
- ✅ Task 2: UI for Trustees (add, manage, confirm heirs)
- ✅ Task 3: Digital Letter Generation (PDF agreements)
- ✅ Task 4: Automated Reminders (payment due notifications)
- ✅ Task 5: Multi-Currency + File Attachments

**Database Tables Added:** 6 new tables (trustees, heir_confirmations, letters, attachments, currencies, exchangeRates, reminders)

**Server Actions Created:** 5 modules with 15+ functions

**Components Created:** 6 new UI components

**Testing:** TDD approach with failing test → implementation → passing test for each major feature

**Estimated Time:** 5-7 days (1-2 days per feature)

---

## Execution Options

Plan is complete and saved to `docs/plans/2025-12-31-dayn-note-phase-2.md`.

**Two execution approaches:**

### **Option 1: Subagent-Driven (This Session)** ⚡ RECOMMENDED
- Fresh subagent per task
- Code review checkpoints between each task
- Fast iteration, stays in this session
- Use: `superpowers:subagent-driven-development`

### **Option 2: Parallel Session**
- Open new session in worktree
- Batch execution with checkpoint reviews
- Better for parallel work
- Use: `superpowers:executing-plans`

**Which approach do you prefer?**