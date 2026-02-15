import { prisma } from '@/lib/prisma';
import { createEdoConnector } from './connectors/factory';
import { EdoDocument } from './types';

export class EdoService {
  /**
   * Sync an order to an EDO system
   */
  static async syncOrderToEdo(orderId: string, integrationId: string) {
    // Get order with items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        orderItems: {
          include: {
            product: true,
            branch: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Get integration config
    const integration = await prisma.edoIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.isActive) {
      throw new Error('Integration not found or inactive');
    }

    // Create sync record
    const syncRecord = await prisma.edoDocumentSync.create({
      data: {
        integrationId,
        orderId,
        documentType: 'order',
        documentNumber: order.orderNumber,
        status: 'pending',
        direction: 'upload',
      },
    });

    try {
      // Update status to syncing
      await prisma.edoDocumentSync.update({
        where: { id: syncRecord.id },
        data: { status: 'syncing' },
      });

      // Convert order to EDO document
      const edoDocument: EdoDocument = {
        type: 'order',
        number: order.orderNumber,
        date: order.orderDate,
        customer: {
          name: order.customer.name,
          tin: order.customer.customerCode || undefined,
          address: order.customer.headquartersAddress || undefined,
        },
        items: order.orderItems.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          vatRate: item.vatRate,
          vatAmount: item.vatAmount,
          totalAmount: item.totalAmount,
        })),
        subtotal: order.subtotal,
        vatAmount: order.vatAmount,
        totalAmount: order.totalAmount,
        metadata: {
          branchCodes: [...new Set(order.orderItems.map((i) => i.branch?.branchCode).filter(Boolean))],
        },
      };

      // Create connector and upload
      const connector = createEdoConnector(integration.provider as any);
      await connector.initialize({
        apiUrl: integration.apiUrl,
        apiKey: integration.apiKey || undefined,
        apiSecret: integration.apiSecret || undefined,
        username: integration.username || undefined,
        password: integration.password || undefined,
        organizationId: integration.organizationId || undefined,
      });

      const result = await connector.uploadDocument(edoDocument);

      if (result.success) {
        // Update sync record as successful
        await prisma.edoDocumentSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'synced',
            externalId: result.externalId,
            documentData: edoDocument as any,
            syncedAt: new Date(),
          },
        });

        // Update integration last sync time
        await prisma.edoIntegration.update({
          where: { id: integrationId },
          data: { lastSyncAt: new Date() },
        });

        return { success: true, syncId: syncRecord.id, externalId: result.externalId };
      } else {
        // Update sync record as failed
        await prisma.edoDocumentSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'failed',
            errorMessage: result.error,
          },
        });

        return { success: false, error: result.error };
      }
    } catch (error: any) {
      // Update sync record as failed
      await prisma.edoDocumentSync.update({
        where: { id: syncRecord.id },
        data: {
          status: 'failed',
          errorMessage: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Download documents from EDO system
   */
  static async downloadFromEdo(
    integrationId: string,
    filters?: {
      fromDate?: Date;
      toDate?: Date;
      documentType?: string;
    }
  ) {
    const integration = await prisma.edoIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration || !integration.isActive) {
      throw new Error('Integration not found or inactive');
    }

    // Create connector and download
    const connector = createEdoConnector(integration.provider as any);
    await connector.initialize({
      apiUrl: integration.apiUrl,
      apiKey: integration.apiKey || undefined,
      apiSecret: integration.apiSecret || undefined,
      username: integration.username || undefined,
      password: integration.password || undefined,
      organizationId: integration.organizationId || undefined,
    });

    const result = await connector.downloadDocuments(filters);

    if (result.success && result.documents) {
      // Create sync records for downloaded documents
      for (const doc of result.documents) {
        await prisma.edoDocumentSync.create({
          data: {
            integrationId,
            documentType: doc.type,
            documentNumber: doc.number,
            status: 'synced',
            direction: 'download',
            documentData: doc as any,
            syncedAt: new Date(),
          },
        });
      }

      // Update integration last sync time
      await prisma.edoIntegration.update({
        where: { id: integrationId },
        data: { lastSyncAt: new Date() },
      });

      return { success: true, documents: result.documents };
    }

    return { success: false, error: result.error };
  }

  /**
   * Test EDO connection
   */
  static async testConnection(integrationId: string) {
    const integration = await prisma.edoIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    const connector = createEdoConnector(integration.provider as any);
    await connector.initialize({
      apiUrl: integration.apiUrl,
      apiKey: integration.apiKey || undefined,
      apiSecret: integration.apiSecret || undefined,
      username: integration.username || undefined,
      password: integration.password || undefined,
      organizationId: integration.organizationId || undefined,
    });

    return await connector.testConnection();
  }
}
