/**
 * Navigation Service
 * Handles turn-by-turn navigation logic and state management
 */

import { yandexRoutingService } from './yandexRoutingService';
import { TurnByTurnInstruction, YandexCoordinates } from '@/types/yandex';

export interface NavigationState {
  currentInstructionIndex: number;
  remainingDistance: number; // meters
  remainingDuration: number; // seconds
  currentInstruction: TurnByTurnInstruction | null;
  nextInstruction: TurnByTurnInstruction | null;
  userLocation: YandexCoordinates;
  isOffRoute: boolean;
  deviationDistance: number; // How far off route in meters
  needsRerouting: boolean;
  progress: number; // Percentage (0-100)
}

export class NavigationService {
  private instructions: TurnByTurnInstruction[] = [];
  private routeGeometry: string = '';
  private offRouteThreshold = 50; // meters

  /**
   * Initialize navigation with route from origin to destination
   */
  async initializeNavigation(
    from: YandexCoordinates,
    to: YandexCoordinates
  ): Promise<TurnByTurnInstruction[]> {
    const route = await yandexRoutingService.getRoute(from, to, true);

    if (!route) {
      throw new Error('Failed to fetch route for navigation');
    }

    this.instructions = route.instructions;
    this.routeGeometry = route.geometry;

    return this.instructions;
  }

  /**
   * Get all turn-by-turn instructions for the route
   */
  getInstructions(): TurnByTurnInstruction[] {
    return this.instructions;
  }

  /**
   * Update navigation state based on current user location
   */
  updateNavigationState(
    currentLocation: YandexCoordinates,
    currentInstructionIndex: number = 0
  ): NavigationState {
    if (this.instructions.length === 0) {
      throw new Error('Navigation not initialized. Call initializeNavigation first.');
    }

    // Clamp instruction index to valid range
    const instructionIdx = Math.min(
      currentInstructionIndex,
      this.instructions.length - 1
    );

    const currentInstruction = this.instructions[instructionIdx] || null;
    const nextInstruction =
      instructionIdx < this.instructions.length - 1
        ? this.instructions[instructionIdx + 1]
        : null;

    // Calculate remaining distance and duration
    let remainingDistance = 0;
    let remainingDuration = 0;

    for (let i = instructionIdx; i < this.instructions.length; i++) {
      remainingDistance += this.instructions[i].distance;
      remainingDuration += this.instructions[i].duration;
    }

    // Check if off route
    const deviationDistance = this.calculateDeviationDistance(
      currentLocation,
      currentInstruction
    );
    const isOffRoute = deviationDistance > this.offRouteThreshold;
    const needsRerouting = deviationDistance > this.offRouteThreshold * 2;

    // Calculate progress
    const totalDistance = this.instructions.reduce((sum, i) => sum + i.distance, 0);
    const completedDistance = totalDistance - remainingDistance;
    const progress = totalDistance > 0 ? (completedDistance / totalDistance) * 100 : 0;

    return {
      currentInstructionIndex: instructionIdx,
      remainingDistance,
      remainingDuration,
      currentInstruction,
      nextInstruction,
      userLocation: currentLocation,
      isOffRoute,
      deviationDistance,
      needsRerouting,
      progress: Math.min(progress, 100),
    };
  }

  /**
   * Calculate how far off the expected route we are
   */
  private calculateDeviationDistance(
    currentLocation: YandexCoordinates,
    instruction: TurnByTurnInstruction | null
  ): number {
    if (!instruction) return 0;

    // Simple distance calculation to instruction location
    const lat1 = currentLocation.latitude;
    const lon1 = currentLocation.longitude;
    const lat2 = instruction.location.latitude;
    const lon2 = instruction.location.longitude;

    const R = 6371000; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Get the next upcoming instruction with readable distance
   */
  getNextInstructionText(state: NavigationState): string {
    if (!state.currentInstruction) {
      return 'Calculating route...';
    }

    const distance = state.currentInstruction.distance;
    const distanceText =
      distance < 1000
        ? `${Math.round(distance)}m`
        : `${(distance / 1000).toFixed(1)}km`;

    return `${distanceText}: ${state.currentInstruction.description}`;
  }

  /**
   * Format remaining time as human-readable text
   */
  formatRemainingTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Format remaining distance as human-readable text
   */
  formatRemainingDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Check if we've reached the destination
   */
  hasReachedDestination(state: NavigationState): boolean {
    return (
      state.currentInstructionIndex >= this.instructions.length - 1 &&
      state.remainingDistance < 50 // Within 50 meters
    );
  }

  /**
   * Get turn-by-turn instructions for next N turns
   */
  getUpcomingInstructions(
    currentIndex: number,
    count: number = 3
  ): TurnByTurnInstruction[] {
    return this.instructions.slice(currentIndex, currentIndex + count);
  }

  /**
   * Clear navigation data
   */
  clear(): void {
    this.instructions = [];
    this.routeGeometry = '';
  }
}

// Export singleton instance
export const navigationService = new NavigationService();
