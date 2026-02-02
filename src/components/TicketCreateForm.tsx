"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Branch {
  id: string;
  branchCode: string;
  branchName: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Subcategory {
  id: string;
  name: string;
  description?: string;
}

export default function TicketCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    branchId: "",
    categoryId: "",
    subcategoryId: "",
    description: "",
    priority: "NORMAL",
    externalId: "",
    autoAssignTechnician: true,
  });

  // Load initial data on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingData(true);
        setError(null);

        // Fetch branches
        const branchRes = await fetch("/api/customer-branches");
        if (!branchRes.ok) throw new Error("Failed to fetch branches");
        const branchData = await branchRes.json();
        setBranches(branchData);

        // Fetch categories
        const catRes = await fetch("/api/issue-categories");
        if (!catRes.ok) throw new Error("Failed to fetch categories");
        const catData = await catRes.json();
        setCategories(catData);
      } catch (err: any) {
        console.error("Error loading initial data:", err);
        setError(err.message || "Failed to load form data");
      } finally {
        setLoadingData(false);
      }
    };

    fetchInitialData();
  }, []);

  async function handleCategoryChange(categoryId: string) {
    setFormData({ ...formData, categoryId, subcategoryId: "" });

    if (categoryId) {
      try {
        const res = await fetch(
          `/api/issue-categories/${categoryId}/subcategories`
        );
        if (!res.ok) throw new Error("Failed to fetch subcategories");
        const data = await res.json();
        setSubcategories(data);
      } catch (err: any) {
        console.error("Error loading subcategories:", err);
        setError(err.message || "Failed to load subcategories");
      }
    } else {
      setSubcategories([]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.branchId || !formData.categoryId || !formData.subcategoryId || !formData.description) {
        throw new Error("Please fill in all required fields");
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create ticket");
      }

      const ticket = await res.json();
      router.push(`/dispatcher/tickets/${ticket.id}`);
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      setError(err.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  if (loadingData) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Загрузка данных формы...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow"
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Создать сервисный билет</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Филиал <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.branchId}
            onChange={(e) =>
              setFormData({ ...formData, branchId: e.target.value })
            }
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Выберите филиал...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.branchCode} - {b.branchName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Категория проблемы <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Выберите категорию...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {subcategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Подкатегория <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.subcategoryId}
              onChange={(e) =>
                setFormData({ ...formData, subcategoryId: e.target.value })
              }
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите подкатегорию...</option>
              {subcategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Описание <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            rows={4}
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Опишите проблему подробно..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">Приоритет</label>
          <select
            value={formData.priority}
            onChange={(e) =>
              setFormData({ ...formData, priority: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LOW">Низкий</option>
            <option value="NORMAL">Средний</option>
            <option value="HIGH">Высокий</option>
            <option value="CRITICAL">Критический</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Внешний ID (необязательно)
          </label>
          <input
            type="text"
            value={formData.externalId}
            onChange={(e) =>
              setFormData({ ...formData, externalId: e.target.value })
            }
            className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="например, 96931"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.autoAssignTechnician}
              onChange={(e) =>
                setFormData({ ...formData, autoAssignTechnician: e.target.checked })
              }
              className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-900">
              Автоматически назначить первого доступного техника
            </span>
          </label>
          <p className="text-xs text-gray-600 mt-2 ml-7">
            Если отключить, вы сможете назначить техника позже на странице билета
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Создание..." : "Создать билет"}
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
