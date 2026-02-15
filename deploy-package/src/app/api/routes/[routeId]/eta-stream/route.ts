/**
 * GET /api/routes/[routeId]/eta-stream
 * Server-Sent Events (SSE) endpoint for live ETA updates
 * Streams real-time ETA changes to connected clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { etaService } from '@/lib/etaService';
import { trafficMonitoringService } from '@/lib/trafficMonitoringService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const { routeId } = await params;

    // Verify route exists and is active
    const route = await prisma.deliveryRoute.findUnique({
      where: { id: routeId },
      include: {
        stops: {
          include: {
            delivery: {
              include: {
                order: {
                  include: {
                    orderItems: {
                      include: {
                        branch: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { stopNumber: 'asc' },
        },
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    if (route.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Route is not active' },
        { status: 400 }
      );
    }

    // Create SSE response
    const encoder = new TextEncoder();

    const customReadable = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'connected',
              message: 'ETA stream connected',
              timestamp: new Date().toISOString(),
            })}\n\n`
          )
        );

        // Update interval: check every 5 minutes or when requested
        let lastUpdate = Date.now();
        const updateInterval = 5 * 60 * 1000; // 5 minutes

        // Polling loop
        const pollInterval = setInterval(async () => {
          try {
            const now = Date.now();
            if (now - lastUpdate < updateInterval) {
              return;
            }

            // Get current route status
            const currentRoute = await prisma.deliveryRoute.findUnique({
              where: { id: routeId },
            });

            if (!currentRoute || currentRoute.status !== 'IN_PROGRESS') {
              // Route is no longer active, close the stream
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'route_completed',
                    message: 'Route is no longer active',
                    timestamp: new Date().toISOString(),
                  })}\n\n`
                )
              );
              clearInterval(pollInterval);
              controller.close();
              return;
            }

            // TODO: Get current driver location from GPS
            // For now, use first stop's location
            const firstBranch = route.stops[0]?.delivery.order.orderItems[0]?.branch;
            if (!firstBranch?.latitude || !firstBranch?.longitude) {
              return;
            }

            const currentLocation = {
              latitude: firstBranch.latitude,
              longitude: firstBranch.longitude,
            };

            // Find current stop (first non-completed stop)
            const currentStopIndex = route.stops.findIndex(
              (s) => !['COMPLETED', 'FAILED', 'SKIPPED'].includes(s.status)
            );

            if (currentStopIndex === -1) {
              return; // All stops completed
            }

            const currentStop = route.stops[currentStopIndex];

            // Calculate new ETAs
            const etas = await etaService.calculateLiveETAs(
              routeId,
              currentLocation,
              currentStop.id
            );

            // Update database
            await etaService.updateStopETAs(etas);

            // Check for delays and send notifications
            const notifications = await etaService.notifyDelays(routeId, etas);

            // Send ETA update
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'eta_update',
                  etas: etas.map((e) => ({
                    stopId: e.stopId,
                    currentETA: etaService.formatETA(e.currentETA),
                    delayMinutes: e.delayMinutes,
                    trafficLevel: e.trafficLevel,
                    confidence: e.confidence,
                  })),
                  notifications,
                  timestamp: new Date().toISOString(),
                })}\n\n`
              )
            );

            lastUpdate = now;
          } catch (error) {
            console.error('Error in ETA stream:', error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'error',
                  message: 'Error calculating ETAs',
                  timestamp: new Date().toISOString(),
                })}\n\n`
              )
            );
          }
        }, 10000); // Check every 10 seconds if update is needed

        // Cleanup on disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(pollInterval);
          controller.close();
        });
      },
    });

    return new NextResponse(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable proxy buffering
      },
    });
  } catch (error) {
    console.error('Error setting up ETA stream:', error);
    return NextResponse.json(
      {
        error: 'Failed to setup ETA stream',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
