"use client";

import { useEffect, useState } from "react";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/sla")
      .then((r) => r.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading metrics...</div>;
  if (!metrics) return <div className="text-center py-8">No data</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Service Metrics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded shadow">
          <div className="text-gray-600 text-sm">Total Tickets</div>
          <div className="text-3xl font-bold">{metrics.totalTickets}</div>
        </div>
        <div className="bg-blue-50 p-6 rounded shadow">
          <div className="text-blue-600 text-sm">Assigned</div>
          <div className="text-3xl font-bold">{metrics.byStatus.ASSIGNED}</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded shadow">
          <div className="text-yellow-600 text-sm">In Progress</div>
          <div className="text-3xl font-bold">{metrics.byStatus.IN_PROGRESS}</div>
        </div>
        <div className="bg-green-50 p-6 rounded shadow">
          <div className="text-green-600 text-sm">Completed</div>
          <div className="text-3xl font-bold">{metrics.byStatus.COMPLETED}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold mb-4">SLA Performance</h2>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
              <div className="text-2xl font-bold">
                {metrics.avgResponseTime} min
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Resolution Time</div>
              <div className="text-2xl font-bold">
                {metrics.avgResolutionTime} min
              </div>
            </div>
            <div className="border-t pt-3">
              <div className="text-sm text-red-600 font-semibold">
                SLA Violations: {metrics.slaViolations}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Technician Performance</h2>
          <div className="space-y-2 text-sm">
            {metrics.technicianStats.map((stat: any, idx: number) => (
              <div key={idx} className="flex justify-between border-b pb-2">
                <span>{stat.name}</span>
                <span className="font-semibold">
                  {stat.completed}/{stat.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-bold mb-4">Ticket Distribution</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(metrics.byStatus).map(([status, count]: any) => (
            <div key={status} className="text-center">
              <div className="text-3xl font-bold">{count}</div>
              <div className="text-sm text-gray-600">{status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
