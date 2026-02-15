import {
  EdoConfig,
  EdoConnector,
  EdoDocument,
  EdoUploadResult,
  EdoDownloadResult,
} from '../types';

export class FakturaConnector implements EdoConnector {
  private config: EdoConfig | null = null;

  async initialize(config: EdoConfig): Promise<void> {
    this.config = config;
    // TODO: Implement faktura.uz initialization once API docs are available
    console.log('Faktura connector initialized (placeholder)');
  }

  async uploadDocument(document: EdoDocument): Promise<EdoUploadResult> {
    // TODO: Implement faktura.uz document upload
    return {
      success: false,
      error: 'Faktura.uz integration not yet implemented. Contact Faktura for API credentials.',
    };
  }

  async downloadDocuments(filters?: any): Promise<EdoDownloadResult> {
    // TODO: Implement faktura.uz document download
    return {
      success: false,
      error: 'Faktura.uz integration not yet implemented. Contact Faktura for API credentials.',
    };
  }

  async getDocumentStatus(externalId: string): Promise<{ status: string; details?: any }> {
    // TODO: Implement faktura.uz status check
    throw new Error('Faktura.uz integration not yet implemented');
  }

  async testConnection(): Promise<boolean> {
    // TODO: Implement faktura.uz connection test
    return false;
  }
}
