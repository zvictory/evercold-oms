import { EdoConnector } from '../types';
import { DidoxConnector } from './didox';
import { HippoConnector } from './hippo';
import { FakturaConnector } from './faktura';

export type EdoProvider = 'didox' | 'hippo' | 'faktura';

export function createEdoConnector(provider: EdoProvider): EdoConnector {
  switch (provider) {
    case 'didox':
      return new DidoxConnector();
    case 'hippo':
      return new HippoConnector();
    case 'faktura':
      return new FakturaConnector();
    default:
      throw new Error(`Unknown EDO provider: ${provider}`);
  }
}
