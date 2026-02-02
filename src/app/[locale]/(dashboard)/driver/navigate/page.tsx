/**
 * Driver Turn-by-Turn Navigation Page
 * Mobile-optimized interface for navigation during deliveries
 * Includes live ETA updates and alternative route suggestions
 */

import { Suspense } from 'react';
import NavigationContent from './navigation-content';

export const dynamic = 'force-dynamic';

export default function NavigatePage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading navigation...</p>
        </div>
      </div>
    }>
      <NavigationContent />
    </Suspense>
  );
}
