import axios, { AxiosInstance } from 'axios';
import {
  EdoConfig,
  EdoConnector,
  EdoDocument,
  EdoUploadResult,
  EdoDownloadResult,
} from '../types';

export class DidoxConnector implements EdoConnector {
  private client: AxiosInstance | null = null;
  private config: EdoConfig | null = null;
  private accessToken: string | null = null;

  async initialize(config: EdoConfig): Promise<void> {
    this.config = config;

    this.client = axios.create({
      baseURL: config.apiUrl || 'https://api.didox.uz',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Authenticate if credentials provided
    if (config.username && config.password) {
      await this.authenticate();
    }
  }

  private async authenticate(): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Connector not initialized');
    }

    try {
      const response = await this.client.post('/auth/login', {
        username: this.config.username,
        password: this.config.password,
        organizationId: this.config.organizationId,
      });

      this.accessToken = response.data.accessToken || response.data.token;

      // Set token for future requests
      if (this.accessToken) {
        this.client.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;
      }
    } catch (error: any) {
      throw new Error(`Didox authentication failed: ${error.message}`);
    }
  }

  async uploadDocument(document: EdoDocument): Promise<EdoUploadResult> {
    if (!this.client) {
      throw new Error('Connector not initialized');
    }

    try {
      // Convert to Didox format
      const didoxDocument = this.convertToDidoxFormat(document);

      const response = await this.client.post('/documents/upload', didoxDocument);

      return {
        success: true,
        externalId: response.data.documentId || response.data.id,
        documentUrl: response.data.url,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async downloadDocuments(filters?: {
    fromDate?: Date;
    toDate?: Date;
    documentType?: string;
    status?: string;
  }): Promise<EdoDownloadResult> {
    if (!this.client) {
      throw new Error('Connector not initialized');
    }

    try {
      const params: any = {};

      if (filters?.fromDate) {
        params.fromDate = filters.fromDate.toISOString();
      }
      if (filters?.toDate) {
        params.toDate = filters.toDate.toISOString();
      }
      if (filters?.documentType) {
        params.type = filters.documentType;
      }
      if (filters?.status) {
        params.status = filters.status;
      }

      const response = await this.client.get('/documents', { params });

      const documents = response.data.documents || response.data.items || [];

      return {
        success: true,
        documents: documents.map((doc: any) => this.convertFromDidoxFormat(doc)),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getDocumentStatus(externalId: string): Promise<{
    status: string;
    details?: any;
  }> {
    if (!this.client) {
      throw new Error('Connector not initialized');
    }

    try {
      const response = await this.client.get(`/documents/${externalId}/status`);

      return {
        status: response.data.status,
        details: response.data,
      };
    } catch (error: any) {
      throw new Error(`Failed to get document status: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      throw new Error('Connector not initialized');
    }

    try {
      try {
        await this.client.get('/health');
      } catch {
        try {
          await this.client.get('/ping');
        } catch {
          await this.client.get('/api/status');
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private convertToDidoxFormat(document: EdoDocument): any {
    return {
      documentType: document.type,
      documentNumber: document.number,
      documentDate: document.date.toISOString(),
      contractor: {
        name: document.customer.name,
        tin: document.customer.tin,
        address: document.customer.address,
      },
      items: document.items.map((item, index) => ({
        lineNumber: index + 1,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.subtotal,
        vatRate: item.vatRate,
        vatAmount: item.vatAmount,
        totalAmount: item.totalAmount,
      })),
      totalAmount: document.subtotal,
      totalVat: document.vatAmount,
      grandTotal: document.totalAmount,
      metadata: document.metadata,
    };
  }

  private convertFromDidoxFormat(didoxDoc: any): EdoDocument {
    return {
      type: didoxDoc.documentType || 'invoice',
      number: didoxDoc.documentNumber,
      date: new Date(didoxDoc.documentDate),
      customer: {
        name: didoxDoc.contractor?.name || '',
        tin: didoxDoc.contractor?.tin,
        address: didoxDoc.contractor?.address,
      },
      items: (didoxDoc.items || []).map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.amount,
        vatRate: item.vatRate,
        vatAmount: item.vatAmount,
        totalAmount: item.totalAmount,
      })),
      subtotal: didoxDoc.totalAmount,
      vatAmount: didoxDoc.totalVat,
      totalAmount: didoxDoc.grandTotal,
      metadata: didoxDoc.metadata,
    };
  }
}
