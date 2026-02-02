'use client';

import { useEffect, useState } from 'react';
import { TaskCard } from '@/components/Driver/TaskCard';

interface Task {
  id: string;
  orderNumber: string;
  customerName: string;
  branchName?: string;
  branchCode?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  phone?: string;
  items: Array<{
    product: { name: string; unit: string };
    quantity: number;
  }>;
  status: string;
  deliveryId: string;
  scheduledDate: string;
}

export default function DriverTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const driverInfo = localStorage.getItem('driverInfo');
      if (!driverInfo) {
        throw new Error('Driver not logged in');
      }

      const driverData = JSON.parse(driverInfo);
      const response = await fetch(`/api/driver/deliveries?driverId=${driverData.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }

      const data = await response.json();

      // Extract active tasks from routes
      const activeTasks: Task[] = data.routes.flatMap((route: any) => {
        // Skip completed routes
        if (route.status === 'COMPLETED') return [];

        // Extract active stops
        return route.stops
          .filter((stop: any) => !['COMPLETED', 'FAILED', 'SKIPPED'].includes(stop.status))
          .map((stop: any) => {
            const branch = stop.delivery.order.orderItems.find((item: any) => item.branch)?.branch;

            return {
              id: stop.id,
              orderNumber: stop.delivery.order.orderNumber,
              customerName: stop.delivery.order.customer.name,
              branchName: branch?.branchName,
              branchCode: branch?.branchCode || branch?.oldBranchCode,
              address: branch?.deliveryAddress,
              latitude: branch?.latitude,
              longitude: branch?.longitude,
              contactPerson: branch?.contactPerson,
              phone: branch?.phone,
              items: stop.delivery.order.orderItems.map((item: any) => ({
                product: {
                  name: item.product.name,
                  unit: item.product.unit,
                },
                quantity: item.quantity,
              })),
              status: stop.delivery.status,
              deliveryId: stop.delivery.id,
              scheduledDate: route.scheduledDate,
            };
          });
      });

      // Sort by scheduled date ascending
      activeTasks.sort((a, b) =>
        new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );

      setTasks(activeTasks);
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Загрузка заданий...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-semibold mb-2">Ошибка загрузки</p>
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-gray-600 mb-2">Нет активных заданий</p>
          <p className="text-gray-500 text-sm mb-4">
            Все доставки завершены! Отличная работа!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        📋 Мои активные задания
      </h1>
      <p className="text-gray-600 mb-6">
        Всего заданий: {tasks.length}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
