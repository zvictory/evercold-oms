"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Part {
  name: string;
  quantity: number;
  unitCost: number;
}

export default function CompleteServiceForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workDescription: "",
    laborHours: 1,
    laborCostPerHour: 50000,
    parts: [] as Part[],
    photos: [] as File[],
  });

  const [newPart, setNewPart] = useState({ name: "", quantity: 1, unitCost: 0 });

  function addPart() {
    if (newPart.name && newPart.quantity && newPart.unitCost) {
      setFormData({
        ...formData,
        parts: [...formData.parts, newPart],
      });
      setNewPart({ name: "", quantity: 1, unitCost: 0 });
    }
  }

  function removePart(index: number) {
    setFormData({
      ...formData,
      parts: formData.parts.filter((_, i) => i !== index),
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFormData({
        ...formData,
        photos: [...formData.photos, ...Array.from(e.target.files)],
      });
    }
  }

  function removePhoto(index: number) {
    setFormData({
      ...formData,
      photos: formData.photos.filter((_, i) => i !== index),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload photos first (in real app, would use FormData + multipart)
      const photoUrls = formData.photos.map((f) => ({
        url: URL.createObjectURL(f),
        type: "after",
        caption: f.name,
      }));

      const res = await fetch(`/api/tickets/${ticketId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completedBy: "tech-id", // Would come from auth
          workDescription: formData.workDescription,
          laborHours: parseFloat(formData.laborHours.toString()),
          laborCostPerHour: parseFloat(formData.laborCostPerHour.toString()),
          partsUsed: formData.parts.map((p) => ({
            ...p,
            total: p.quantity * p.unitCost,
          })),
          photos: photoUrls,
        }),
      });

      if (!res.ok) throw new Error("Failed to complete service");

      const completion = await res.json();
      router.push(`/tech/tickets/${ticketId}/approval`);
    } catch (error) {
      console.error(error);
      alert("Failed to submit completion");
    } finally {
      setLoading(false);
    }
  }

  const totalPartsCost = formData.parts.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
  const laborCost = formData.laborHours * formData.laborCostPerHour;
  const totalCost = totalPartsCost + laborCost;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Complete Service</h2>

      <div className="space-y-6">
        {/* Work Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Work Description</label>
          <textarea
            value={formData.workDescription}
            onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
            required
            rows={4}
            className="w-full border rounded px-3 py-2"
            placeholder="What work was completed..."
          />
        </div>

        {/* Labor */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Labor Hours</label>
            <input
              type="number"
              step="0.5"
              value={formData.laborHours}
              onChange={(e) => setFormData({ ...formData, laborHours: parseFloat(e.target.value) })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Cost per Hour</label>
            <input
              type="number"
              value={formData.laborCostPerHour}
              onChange={(e) => setFormData({ ...formData, laborCostPerHour: parseFloat(e.target.value) })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        {/* Parts */}
        <div>
          <label className="block text-sm font-medium mb-2">Parts Used</label>
          <div className="space-y-2 mb-3">
            {formData.parts.map((part, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <div className="text-sm">
                  {part.name} × {part.quantity} @ {part.unitCost.toLocaleString()} = {(part.quantity * part.unitCost).toLocaleString()}
                </div>
                <button
                  type="button"
                  onClick={() => removePart(idx)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Part name"
              value={newPart.name}
              onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              step="0.1"
              placeholder="Qty"
              value={newPart.quantity}
              onChange={(e) => setNewPart({ ...newPart, quantity: parseFloat(e.target.value) })}
              className="border rounded px-2 py-1 text-sm"
            />
            <input
              type="number"
              placeholder="Cost"
              value={newPart.unitCost}
              onChange={(e) => setNewPart({ ...newPart, unitCost: parseFloat(e.target.value) })}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={addPart}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add Part
          </button>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium mb-2">Photos (Before/After)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full border rounded px-3 py-2"
          />
          {formData.photos.length > 0 && (
            <div className="mt-3 space-y-2">
              {formData.photos.map((photo, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                  <span>{photo.name}</span>
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cost Summary */}
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Parts Cost:</span>
              <span className="font-semibold">{totalPartsCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Labor Cost ({formData.laborHours}h × {formData.laborCostPerHour}):</span>
              <span className="font-semibold">{laborCost.toLocaleString()}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-base font-bold">
              <span>Total Cost:</span>
              <span>{totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Service Completion"}
        </button>
      </div>
    </form>
  );
}
