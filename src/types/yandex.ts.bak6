/**
 * TypeScript types for Yandex Maps and Routing APIs
 */

export interface YandexCoordinates {
  latitude: number;
  longitude: number;
}

export interface YandexLocation extends YandexCoordinates {
  id?: string;
  address?: string;
}

// Routes API Response
export interface YandexRoutesResponse {
  routes: Array<{
    distance: {
      value: number; // meters
      text: string;
    };
    duration: {
      value: number; // seconds
      text: string;
    };
    duration_in_traffic?: {
      value: number; // seconds
      text: string;
    };
    geometry: string; // encoded polyline
    legs: Array<{
      steps: YandexRouteStep[];
      distance: {
        value: number;
        text: string;
      };
      duration: {
        value: number;
        text: string;
      };
    }>;
  }>;
}

export interface YandexRouteStep {
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
  html_instructions: string;
  maneuver: string;
  start_location: {
    lat: number;
    lng: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
}

// Matrix API Response
export interface YandexMatrixResponse {
  rows: Array<{
    elements: Array<{
      distance: {
        value: number; // meters
        text: string;
      };
      duration: {
        value: number; // seconds
        text: string;
      };
      duration_in_traffic?: {
        value: number; // seconds
        text: string;
      };
    }>;
  }>;
}

export interface RouteResponse {
  distance: number; // km
  duration: number; // seconds
  durationInTraffic: number; // seconds
  geometry: string; // encoded polyline
  legs: RouteLeg[];
  instructions: TurnByTurnInstruction[];
  trafficLevel: 'low' | 'medium' | 'high' | 'blocked';
}

export interface RouteLeg {
  distance: number; // km
  duration: number; // seconds
  durationInTraffic: number; // seconds
}

export interface TurnByTurnInstruction {
  index: number;
  distance: number; // meters
  duration: number; // seconds
  action: 'turn-left' | 'turn-right' | 'straight' | 'roundabout' | 'arrive' | 'continue';
  street?: string;
  description: string;
  location: YandexCoordinates;
}

export interface MatrixElement {
  distance: number; // meters
  duration: number; // seconds
  durationInTraffic: number; // seconds
}

export interface MatrixResponse {
  rows: MatrixElement[][];
}

export interface APIUsageRecord {
  timestamp: Date;
  method: 'routes' | 'matrix';
  origin: YandexCoordinates;
  destination: YandexCoordinates;
  costInRubles?: number;
  requestsThisMonth?: number;
}
