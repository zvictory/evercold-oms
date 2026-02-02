export interface GeocodingRequest {
  address: string;
  city?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  displayName: string;
}

export interface GeocodingResponse {
  success: boolean;
  result?: GeocodingResult;
  error?: string;
}
