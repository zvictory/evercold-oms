'use client';

import { useState } from 'react';

interface NavigationInstruction {
  stopNumber: number;
  instruction: string;
  distance: string;
  duration: string;
  address: string;
}

interface TurnByTurnNavProps {
  stops: NavigationInstruction[];
  currentStop?: number;
  totalDistance: string;
  totalDuration: string;
}

export default function TurnByTurnNav({
  stops,
  currentStop = 0,
  totalDistance,
  totalDuration,
}: TurnByTurnNavProps) {
  const [expandedStop, setExpandedStop] = useState<number | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Navigation Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          🛣️ Turn-by-Turn Navigation
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          {totalDistance} • {totalDuration} total
        </p>
      </div>

      {/* Navigation Steps */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {stops.map((stop, idx) => {
          const isCurrentStop = idx === currentStop;
          const isCompleted = idx < currentStop;

          return (
            <div
              key={idx}
              className={`p-4 cursor-pointer transition-colors ${
                isCurrentStop
                  ? 'bg-blue-50 border-l-4 border-blue-600'
                  : isCompleted
                  ? 'bg-green-50 opacity-75'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setExpandedStop(expandedStop === idx ? null : idx)}
            >
              {/* Main Instruction */}
              <div className="flex items-start gap-4">
                {/* Stop Number Indicator */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                    isCompleted
                      ? 'bg-green-600'
                      : isCurrentStop
                      ? 'bg-blue-600 ring-2 ring-blue-300'
                      : 'bg-gray-400'
                  }`}
                >
                  {isCompleted ? '✓' : stop.stopNumber}
                </div>

                {/* Instruction Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">
                    {stop.instruction}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {stop.address}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      📏 {stop.distance}
                    </span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      ⏱️ {stop.duration}
                    </span>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="flex-shrink-0 text-gray-400">
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedStop === idx ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedStop === idx && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
                  <div className="bg-gray-50 rounded p-3">
                    <p className="text-gray-700 font-medium mb-2">Stop Details:</p>
                    <ul className="space-y-2 text-gray-600">
                      <li>✓ Distance to destination: {stop.distance}</li>
                      <li>✓ Estimated travel time: {stop.duration}</li>
                      <li>✓ Location: {stop.address}</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          📱 Use the map to navigate • Swipe on mobile to expand steps
        </p>
      </div>
    </div>
  );
}
