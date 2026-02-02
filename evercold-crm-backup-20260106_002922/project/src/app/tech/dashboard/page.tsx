"use client";

import { useState, useEffect } from "react";
import TechnicianTicketQueue from "@/components/TechnicianTicketQueue";

export default function TechnicianDashboardPage() {
  const [technicianId, setTechnicianId] = useState<string>("");

  useEffect(() => {
    // In a real app, get technicianId from auth session
    // For demo: prompt user or get from localStorage
    const stored = localStorage.getItem("technicianId");
    if (!stored) {
      const id = prompt("Enter your technician ID:");
      if (id) {
        localStorage.setItem("technicianId", id);
        setTechnicianId(id);
      }
    } else {
      setTechnicianId(stored);
    }
  }, []);

  if (!technicianId) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Tickets</h1>
      <TechnicianTicketQueue technicianId={technicianId} />
    </div>
  );
}
