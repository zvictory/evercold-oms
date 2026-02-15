// EDO Integration Types

export interface EdoConfig {
  apiUrl: string;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  organizationId?: string;
}

export interface EdoDocument {
  type: 'order' | 'invoice' | 'act' | 'waybill';
  number: string;
  date: Date;
  customer: {
    name: string;
    tin?: string;
    address?: string;
  };
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
  }[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  metadata?: Record<string, any>;
}

export interface EdoUploadResult {
  success: boolean;
  externalId?: string;
  documentUrl?: string;
  error?: string;
}

export interface EdoDownloadResult {
  success: boolean;
  documents?: EdoDocument[];
  error?: string;
}

export interface EdoConnector {
  // Initialize connector with credentials
  initialize(config: EdoConfig): Promise<void>;

  // Upload document to EDO system
  uploadDocument(document: EdoDocument): Promise<EdoUploadResult>;

  // Download documents from EDO system
  downloadDocuments(filters?: {
    fromDate?: Date;
    toDate?: Date;
    documentType?: string;
    status?: string;
  }): Promise<EdoDownloadResult>;

  // Get document status
  getDocumentStatus(externalId: string): Promise<{
    status: string;
    details?: any;
  }>;

  // Test connection
  testConnection(): Promise<boolean>;
}
