"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TechnicianCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "universal",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.name.trim()) {
        throw new Error("Пожалуйста, введите имя техника");
      }

      const res = await fetch("/api/technicians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create technician");
      }

      const technician = await res.json();
      router.push("/tech/list");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create technician");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow border border-gray-200"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Добавить нового техника</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Имя <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Например, Иван Смирнов"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ivan.smirnov@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Телефон
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+998 (99) 123-45-67"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Специализация
          </label>
          <select
            value={formData.specialization}
            onChange={(e) =>
              setFormData({ ...formData, specialization: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="universal">Универсальный техник</option>
            <option value="compressor">Специалист по компрессорам</option>
            <option value="electrical">Электрик</option>
            <option value="hydraulic">Специалист по гидравлике</option>
            <option value="diagnostics">Диагностика и тестирование</option>
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
          <p className="text-sm text-gray-700">
            <span className="font-medium">💡 Совет:</span> После создания техника он будет
            доступен для назначения на билеты. Вы сможете отслеживать количество
            активных билетов для каждого техника.
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Создание..." : "Создать техника"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-medium hover:bg-gray-300 transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </form>
  );
}
