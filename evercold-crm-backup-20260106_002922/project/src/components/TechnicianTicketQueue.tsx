"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  branch: { branchCode: string; branchName: string; deliveryAddress: string };
  subcategory: { name: string };
  description: string;
  createdAt: string;
}

export default function TechnicianTicketQueue({ technicianId }: { technicianId: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [technicianId]);

  async function fetchTickets() {
    try {
      const res = await fetch(`/api/tickets?technicianId=${technicianId}`);
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStartWork(ticketId: string) {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      if (res.ok) {
        await fetchTickets();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to start work on ticket");
    }
  }

  const assignedTickets = tickets.filter((t) => t.status === "ASSIGNED");
  const inProgressTickets = tickets.filter((t) => t.status === "IN_PROGRESS");

  if (loading) return <div className="text-center py-8">Loading tickets...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      {inProgressTickets.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-700">In Progress</h2>
          <div className="space-y-3">
            {inProgressTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tech/tickets/${ticket.id}`}
                className="block border-l-4 border-yellow-500 bg-yellow-50 p-4 hover:bg-yellow-100"
              >
                <div className="font-mono text-sm font-bold">{ticket.ticketNumber}</div>
                <div className="text-sm font-semibold mt-1">{ticket.branch.branchCode} - {ticket.subcategory.name}</div>
                <div className="text-xs text-gray-600 mt-1">{ticket.branch.deliveryAddress}</div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    // Navigate to complete form
                  }}
                  className="mt-2 bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700"
                >
                  Complete Service
                </button>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">Assigned Tickets</h2>
        {assignedTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No assigned tickets</div>
        ) : (
          <div className="space-y-3">
            {assignedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`border-l-4 p-4 ${
                  ticket.priority === "CRITICAL" ? "border-red-500 bg-red-50" : "border-blue-500 bg-blue-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-sm font-bold">{ticket.ticketNumber}</div>
                    <div className="text-sm font-semibold mt-1">{ticket.branch.branchCode}</div>
                    <div className="text-xs text-gray-600 mt-1">{ticket.subcategory.name}</div>
                    <div className="text-xs text-gray-700 mt-2">{ticket.description.substring(0, 100)}...</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    ticket.priority === "CRITICAL" ? "bg-red-200 text-red-800" : "bg-blue-200 text-blue-800"
                  }`}>
                    {ticket.priority}
                  </span>
                </div>
                <button
                  onClick={() => handleStartWork(ticket.id)}
                  className="mt-3 w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700"
                >
                  Start Work
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
