import { prisma } from '@/lib/prisma';
import {
  createTicket,
  getTicket,
  assignTechnician,
  updateTicketStatus,
  listTickets,
  completeTicket,
  escalateTicket,
  generateTicketNumber,
} from '@/lib/tickets';
import {
  createTechnician,
  assignTechnicianToBranch,
  getPrimaryTechnicianForBranch,
} from '@/lib/technicians';
import { createCompletion, approveCompletion, rejectCompletion } from '@/lib/completions';

describe('Service Ticket System Integration Tests', () => {
  let customerId: string;
  let branchId: string;
  let primaryTechnicianId: string;
  let secondaryTechnicianId: string;
  let ticketId: string;
  let categoryId: string;
  let subcategoryId: string;

  beforeAll(async () => {
    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '998901234567',
      },
    });
    customerId = customer.id;

    // Create test branch
    const branch = await prisma.customerBranch.create({
      data: {
        customerId,
        branchCode: 'TEST-001',
        branchName: 'Test Branch',
        fullName: 'Test Branch Full Name',
        contactPerson: 'Branch Manager',
        phone: '998901234567',
      },
    });
    branchId = branch.id;

    // Create test category and subcategory
    const category = await prisma.issueCategory.create({
      data: {
        name: 'Compressor Issues',
        code: 'COMP',
      },
    });
    categoryId = category.id;

    const subcategory = await prisma.issueSubcategory.create({
      data: {
        categoryId,
        name: 'Not Starting',
        code: 'NS',
      },
    });
    subcategoryId = subcategory.id;

    // Create test technicians
    const primaryTech = await createTechnician({
      name: 'Primary Technician',
      phone: '998901234567',
      email: 'primary@test.com',
    });
    primaryTechnicianId = primaryTech.id;

    const secondaryTech = await createTechnician({
      name: 'Secondary Technician',
      phone: '998901234568',
      email: 'secondary@test.com',
    });
    secondaryTechnicianId = secondaryTech.id;

    // Assign primary technician to branch
    await assignTechnicianToBranch({
      technicianId: primaryTechnicianId,
      branchId,
      isPrimary: true,
    });

    // Assign secondary technician to branch
    await assignTechnicianToBranch({
      technicianId: secondaryTechnicianId,
      branchId,
      isPrimary: false,
    });
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    try {
      // Delete service completions
      await prisma.serviceCompletion.deleteMany({
        where: {
          ticket: {
            branchId,
          },
        },
      });

      // Delete service tickets
      await prisma.serviceTicket.deleteMany({
        where: {
          branchId,
        },
      });

      // Delete technician assignments
      await prisma.technicianBranchAssignment.deleteMany({
        where: {
          branchId,
        },
      });

      // Delete technicians
      await prisma.technician.deleteMany({
        where: {
          id: {
            in: [primaryTechnicianId, secondaryTechnicianId],
          },
        },
      });

      // Delete subcategories
      await prisma.issueSubcategory.deleteMany({
        where: {
          categoryId,
        },
      });

      // Delete categories
      await prisma.issueCategory.deleteMany({
        where: {
          id: categoryId,
        },
      });

      // Delete branch
      await prisma.customerBranch.delete({
        where: {
          id: branchId,
        },
      });

      // Delete customer
      await prisma.customer.delete({
        where: {
          id: customerId,
        },
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('Ticket Number Generation', () => {
    test('should generate unique ticket numbers with YYYYMM format', async () => {
      const ticketNumber1 = await generateTicketNumber();
      const ticketNumber2 = await generateTicketNumber();

      expect(ticketNumber1).toMatch(/^TKT-\d{6}-\d{5}$/);
      expect(ticketNumber2).toMatch(/^TKT-\d{6}-\d{5}$/);
      expect(ticketNumber1).not.toBe(ticketNumber2);
    });
  });

  describe('Ticket Creation & Auto-Assignment', () => {
    test('should create a ticket with valid data', async () => {
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Compressor not starting - no power',
        priority: 'HIGH',
      });

      expect(ticket).toBeDefined();
      expect(ticket.ticketNumber).toMatch(/^TKT-/);
      expect(ticket.status).toBe('ASSIGNED');
      expect(ticket.assignedTechnicianId).toBe(primaryTechnicianId);
      expect(ticket.priority).toBe('HIGH');
      expect(ticket.description).toBe('Compressor not starting - no power');
      expect(ticket.contactName).toBe('Branch Manager');
      expect(ticket.contactPhone).toBe('998901234567');

      ticketId = ticket.id;
    });

    test('should create ticket with NORMAL priority by default', async () => {
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Routine maintenance',
      });

      expect(ticket.priority).toBe('NORMAL');
    });

    test('should throw error for invalid branch', async () => {
      await expect(
        createTicket({
          branchId: 'invalid-branch-id',
          categoryId,
          subcategoryId,
          description: 'Test',
        })
      ).rejects.toThrow('Branch not found');
    });

    test('should create ticket without auto-assignment if no primary technician', async () => {
      // Create branch without technician
      const isolatedBranch = await prisma.customerBranch.create({
        data: {
          customerId,
          branchCode: 'TEST-002',
          branchName: 'Isolated Branch',
          fullName: 'Isolated Branch Full Name',
        },
      });

      const ticket = await createTicket({
        branchId: isolatedBranch.id,
        categoryId,
        subcategoryId,
        description: 'No primary technician',
      });

      expect(ticket.status).toBe('NEW');
      expect(ticket.assignedTechnicianId).toBeNull();

      // Cleanup
      await prisma.serviceTicket.deleteMany({
        where: { branchId: isolatedBranch.id },
      });
      await prisma.customerBranch.delete({
        where: { id: isolatedBranch.id },
      });
    });
  });

  describe('Ticket Retrieval & Listing', () => {
    test('should get ticket details with relationships', async () => {
      const ticket = await getTicket(ticketId);

      expect(ticket).toBeDefined();
      expect(ticket?.id).toBe(ticketId);
      expect(ticket?.branch).toBeDefined();
      expect(ticket?.branch?.id).toBe(branchId);
      expect(ticket?.category).toBeDefined();
      expect(ticket?.category?.id).toBe(categoryId);
      expect(ticket?.subcategory).toBeDefined();
      expect(ticket?.assignedTechnician).toBeDefined();
      expect(ticket?.assignedTechnician?.id).toBe(primaryTechnicianId);
    });

    test('should return null for non-existent ticket', async () => {
      const ticket = await getTicket('non-existent-id');
      expect(ticket).toBeNull();
    });

    test('should list all tickets without filters', async () => {
      const tickets = await listTickets();

      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBeGreaterThan(0);
      // Check that our test ticket is in the list
      const testTicket = tickets.find(t => t.id === ticketId);
      expect(testTicket).toBeDefined();
    });

    test('should list tickets filtered by status', async () => {
      const assignedTickets = await listTickets({ status: 'ASSIGNED' });

      expect(Array.isArray(assignedTickets)).toBe(true);
      assignedTickets.forEach(ticket => {
        expect(ticket.status).toBe('ASSIGNED');
      });
    });

    test('should list tickets filtered by technician', async () => {
      const techTickets = await listTickets({ technicianId: primaryTechnicianId });

      expect(Array.isArray(techTickets)).toBe(true);
      techTickets.forEach(ticket => {
        expect(ticket.assignedTechnicianId).toBe(primaryTechnicianId);
      });
    });

    test('should list tickets filtered by priority', async () => {
      const highPriorityTickets = await listTickets({ priority: 'HIGH' });

      expect(Array.isArray(highPriorityTickets)).toBe(true);
      highPriorityTickets.forEach(ticket => {
        expect(ticket.priority).toBe('HIGH');
      });
    });

    test('should return tickets ordered by creation date descending', async () => {
      const tickets = await listTickets();

      for (let i = 0; i < tickets.length - 1; i++) {
        expect(new Date(tickets[i].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(tickets[i + 1].createdAt).getTime()
        );
      }
    });
  });

  describe('Ticket Assignment & Escalation', () => {
    test('should assign technician to ticket', async () => {
      const updated = await assignTechnician(ticketId, secondaryTechnicianId);

      expect(updated.assignedTechnicianId).toBe(secondaryTechnicianId);
      expect(updated.status).toBe('ASSIGNED');
      expect(updated.firstResponseAt).not.toBeNull();
    });

    test('should escalate ticket to another technician', async () => {
      const updated = await escalateTicket(ticketId, primaryTechnicianId);

      expect(updated.assignedTechnicianId).toBe(primaryTechnicianId);
      expect(updated.status).toBe('ASSIGNED');
    });
  });

  describe('Ticket Status Transitions', () => {
    test('should transition ticket from ASSIGNED to IN_PROGRESS', async () => {
      const updated = await updateTicketStatus(ticketId, 'IN_PROGRESS');

      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.firstResponseAt).not.toBeNull();
    });

    test('should set firstResponseAt when marking as ASSIGNED', async () => {
      const newTicket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Test ticket for assignment',
      });

      const ticket = await getTicket(newTicket.id);
      const beforeAssign = ticket?.firstResponseAt;

      const updated = await updateTicketStatus(newTicket.id, 'ASSIGNED');
      expect(updated.firstResponseAt).not.toBeNull();

      // Cleanup
      await prisma.serviceTicket.delete({
        where: { id: newTicket.id },
      });
    });

    test('should set completedAt when marking as COMPLETED', async () => {
      const updated = await updateTicketStatus(ticketId, 'COMPLETED');

      expect(updated.status).toBe('COMPLETED');
      expect(updated.completedAt).not.toBeNull();
    });

    test('should set closedAt when marking as CLOSED', async () => {
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Ticket to close',
      });

      const updated = await updateTicketStatus(ticket.id, 'CLOSED');

      expect(updated.status).toBe('CLOSED');
      expect(updated.closedAt).not.toBeNull();

      // Cleanup
      await prisma.serviceTicket.delete({
        where: { id: ticket.id },
      });
    });
  });

  describe('Service Completion Workflow', () => {
    let completionTicketId: string;

    beforeAll(async () => {
      // Create a fresh ticket for completion tests
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Compressor replacement needed',
        priority: 'HIGH',
      });
      completionTicketId = ticket.id;

      // Move to IN_PROGRESS
      await updateTicketStatus(completionTicketId, 'IN_PROGRESS');
    });

    test('should create service completion with parts and labor', async () => {
      const completion = await createCompletion({
        ticketId: completionTicketId,
        completedBy: primaryTechnicianId,
        workDescription: 'Replaced faulty compressor unit',
        laborHours: 2.5,
        laborCostPerHour: 50000,
        partsUsed: [
          {
            name: 'Compressor Unit',
            quantity: 1,
            unitCost: 500000,
            total: 500000,
          },
          {
            name: 'Refrigerant (R404A)',
            quantity: 10,
            unitCost: 5000,
            total: 50000,
          },
        ],
        photos: [
          {
            url: 'https://example.com/before.jpg',
            type: 'before',
            caption: 'Original faulty compressor',
          },
          {
            url: 'https://example.com/after.jpg',
            type: 'after',
            caption: 'New compressor installed',
          },
        ],
      });

      expect(completion).toBeDefined();
      expect(completion.ticketId).toBe(completionTicketId);
      expect(completion.completedBy).toBe(primaryTechnicianId);
      expect(completion.approvalStatus).toBe('PENDING');
      expect(completion.laborHours).toBe(2.5);
      expect(completion.laborCostPerHour).toBe(50000);
      expect(completion.partsCost).toBe(550000); // 500000 + 50000
      expect(completion.laborCost).toBe(125000); // 2.5 * 50000
      expect(completion.totalCost).toBe(675000); // 550000 + 125000
      expect(completion.workDescription).toContain('Replaced');

      // Verify ticket status was updated
      const updatedTicket = await getTicket(completionTicketId);
      expect(updatedTicket?.status).toBe('COMPLETED');
    });

    test('should throw error if ticket not IN_PROGRESS or ASSIGNED', async () => {
      const closedTicket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Already closed',
      });

      await updateTicketStatus(closedTicket.id, 'CLOSED');

      await expect(
        createCompletion({
          ticketId: closedTicket.id,
          completedBy: primaryTechnicianId,
          workDescription: 'Work done',
          laborHours: 1,
          laborCostPerHour: 10000,
          partsUsed: [],
          photos: [],
        })
      ).rejects.toThrow('Ticket must be IN_PROGRESS or ASSIGNED');

      // Cleanup
      await prisma.serviceTicket.delete({
        where: { id: closedTicket.id },
      });
    });

    test('should approve service completion', async () => {
      const ticket = await getTicket(completionTicketId);
      const completion = ticket?.completion;

      expect(completion).toBeDefined();
      if (!completion) throw new Error('No completion found');

      const approved = await approveCompletion(completion.id);

      expect(approved.approvalStatus).toBe('APPROVED');

      // Verify ticket was closed
      const closedTicket = await getTicket(completionTicketId);
      expect(closedTicket?.status).toBe('CLOSED');
      expect(closedTicket?.closedAt).not.toBeNull();
    });
  });

  describe('Completion Rejection & Rework', () => {
    let reworkTicketId: string;
    let completionId: string;

    beforeAll(async () => {
      // Create ticket for rejection test
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Requires rework',
      });
      reworkTicketId = ticket.id;

      await updateTicketStatus(reworkTicketId, 'IN_PROGRESS');

      // Create completion
      const completion = await createCompletion({
        ticketId: reworkTicketId,
        completedBy: primaryTechnicianId,
        workDescription: 'Initial repair attempt',
        laborHours: 1,
        laborCostPerHour: 25000,
        partsUsed: [
          {
            name: 'Test Part',
            quantity: 1,
            unitCost: 10000,
            total: 10000,
          },
        ],
        photos: [],
      });
      completionId = completion.id;
    });

    test('should reject completion and revert ticket status', async () => {
      const rejected = await rejectCompletion(
        completionId,
        'Work quality does not meet standards'
      );

      expect(rejected.approvalStatus).toBe('REJECTED');
      expect(rejected.approvalNotes).toContain('quality');

      // Verify ticket reverted to IN_PROGRESS
      const ticket = await getTicket(reworkTicketId);
      expect(ticket?.status).toBe('IN_PROGRESS');
    });

    test('should allow creating new completion after rejection', async () => {
      const newCompletion = await createCompletion({
        ticketId: reworkTicketId,
        completedBy: primaryTechnicianId,
        workDescription: 'Rework completed - issue fixed',
        laborHours: 2,
        laborCostPerHour: 25000,
        partsUsed: [],
        photos: [],
      });

      expect(newCompletion.approvalStatus).toBe('PENDING');
      expect(newCompletion.workDescription).toContain('Rework');

      // Approve the new completion
      const approved = await approveCompletion(newCompletion.id);
      expect(approved.approvalStatus).toBe('APPROVED');
    });

    afterAll(async () => {
      // Cleanup rework ticket
      await prisma.serviceCompletion.deleteMany({
        where: { ticketId: reworkTicketId },
      });
      await prisma.serviceTicket.delete({
        where: { id: reworkTicketId },
      });
    });
  });

  describe('Complete Ticket Workflow', () => {
    test('should complete full ticket lifecycle', async () => {
      // Step 1: Create ticket (auto-assigned to primary technician)
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Maintenance check required',
        priority: 'NORMAL',
      });

      let current = await getTicket(ticket.id);
      expect(current?.status).toBe('ASSIGNED');
      expect(current?.assignedTechnicianId).toBe(primaryTechnicianId);

      // Step 2: Technician acknowledges and marks as IN_PROGRESS
      current = await updateTicketStatus(ticket.id, 'IN_PROGRESS');
      expect(current.status).toBe('IN_PROGRESS');

      // Step 3: Technician completes work
      const completion = await createCompletion({
        ticketId: ticket.id,
        completedBy: primaryTechnicianId,
        workDescription: 'Performed preventive maintenance',
        laborHours: 1.5,
        laborCostPerHour: 40000,
        partsUsed: [
          {
            name: 'Filter',
            quantity: 1,
            unitCost: 15000,
            total: 15000,
          },
        ],
        photos: [
          {
            url: 'https://example.com/maintenance.jpg',
            type: 'after',
            caption: 'Maintenance completed',
          },
        ],
      });

      expect(completion.approvalStatus).toBe('PENDING');
      expect(completion.totalCost).toBe(75000); // 15000 + (1.5 * 40000)

      // Step 4: Manager/Admin approves completion
      const approved = await approveCompletion(completion.id);
      expect(approved.approvalStatus).toBe('APPROVED');

      // Step 5: Verify ticket is closed
      current = await getTicket(ticket.id);
      expect(current?.status).toBe('CLOSED');
      expect(current?.closedAt).not.toBeNull();
      expect(current?.completion?.approvalStatus).toBe('APPROVED');

      // Cleanup
      await prisma.serviceTicket.delete({
        where: { id: ticket.id },
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle missing required fields in createTicket', async () => {
      await expect(
        createTicket({
          branchId: '',
          categoryId: '',
          subcategoryId: '',
          description: '',
        })
      ).rejects.toThrow();
    });

    test('should handle invalid technician ID in assignment', async () => {
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Test assignment',
      });

      await expect(
        assignTechnician(ticket.id, 'invalid-technician-id')
      ).rejects.toThrow();

      // Cleanup
      await prisma.serviceTicket.delete({
        where: { id: ticket.id },
      });
    });

    test('should prevent approving non-pending completion', async () => {
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Test approval',
      });

      await updateTicketStatus(ticket.id, 'IN_PROGRESS');

      const completion = await createCompletion({
        ticketId: ticket.id,
        completedBy: primaryTechnicianId,
        workDescription: 'Work done',
        laborHours: 1,
        laborCostPerHour: 10000,
        partsUsed: [],
        photos: [],
      });

      // Approve first time
      await approveCompletion(completion.id);

      // Try to approve again - should fail
      await expect(approveCompletion(completion.id)).rejects.toThrow(
        'Can only approve PENDING completions'
      );

      // Cleanup
      await prisma.serviceTicket.delete({
        where: { id: ticket.id },
      });
    });

    test('should prevent rejecting non-pending completion', async () => {
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Test rejection',
      });

      await updateTicketStatus(ticket.id, 'IN_PROGRESS');

      const completion = await createCompletion({
        ticketId: ticket.id,
        completedBy: primaryTechnicianId,
        workDescription: 'Work done',
        laborHours: 1,
        laborCostPerHour: 10000,
        partsUsed: [],
        photos: [],
      });

      // Approve completion
      await approveCompletion(completion.id);

      // Try to reject approved completion - should fail
      await expect(
        rejectCompletion(completion.id, 'Should not work')
      ).rejects.toThrow('Can only reject PENDING completions');

      // Cleanup
      await prisma.serviceTicket.delete({
        where: { id: ticket.id },
      });
    });
  });

  describe('Data Relationships & Integrity', () => {
    test('should maintain data integrity across ticket lifecycle', async () => {
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Integrity test',
      });

      // Assign different technician
      await assignTechnician(ticket.id, secondaryTechnicianId);

      // Mark as in progress
      await updateTicketStatus(ticket.id, 'IN_PROGRESS');

      // Get full ticket data
      const finalTicket = await getTicket(ticket.id);

      expect(finalTicket?.ticketNumber).toMatch(/^TKT-/);
      expect(finalTicket?.branchId).toBe(branchId);
      expect(finalTicket?.categoryId).toBe(categoryId);
      expect(finalTicket?.subcategoryId).toBe(subcategoryId);
      expect(finalTicket?.assignedTechnicianId).toBe(secondaryTechnicianId);
      expect(finalTicket?.status).toBe('IN_PROGRESS');

      // Cleanup
      await prisma.serviceTicket.delete({
        where: { id: ticket.id },
      });
    });

    test('should preserve timestamps through status updates', async () => {
      const ticket = await createTicket({
        branchId,
        categoryId,
        subcategoryId,
        description: 'Timestamp test',
      });

      const originalCreatedAt = ticket.createdAt;

      // Wait a bit then update status
      await new Promise(resolve => setTimeout(resolve, 100));
      await updateTicketStatus(ticket.id, 'IN_PROGRESS');

      const updated = await getTicket(ticket.id);

      expect(updated?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
      expect(updated?.firstResponseAt?.getTime()).toBeGreaterThanOrEqual(
        originalCreatedAt.getTime()
      );

      // Cleanup
      await prisma.serviceTicket.delete({
        where: { id: ticket.id },
      });
    });
  });
});
