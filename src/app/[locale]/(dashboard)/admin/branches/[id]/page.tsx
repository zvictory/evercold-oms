import Link from "next/link";

export const metadata = {
  title: "Детали филиала",
  description: "Просмотр и управление филиалом",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BranchDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <Link
          href="/admin/branches"
          className="text-blue-600 hover:text-blue-800 font-medium mb-6 block"
        >
          ← Вернуться к филиалам
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Branch Information Card */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Детали филиала</h1>

            <div className="space-y-4 mb-8">
              <div>
                <p className="text-sm text-gray-600 font-medium">ID Филиала</p>
                <p className="text-lg font-mono text-gray-900 mt-1">{id}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-gray-700">
                  💡 <strong>Совет:</strong> Полная информация о филиале отображается на главной странице филиалов
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href={`/admin/branches/${id}/technicians`}
                className="block w-full bg-blue-600 text-white px-4 py-3 rounded font-medium text-center hover:bg-blue-700 transition"
              >
                👨‍🔧 Управление техниками филиала
              </Link>
              <Link
                href="/admin/branches"
                className="block w-full bg-gray-200 text-gray-800 px-4 py-3 rounded font-medium text-center hover:bg-gray-300 transition"
              >
                Назад к списку филиалов
              </Link>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow border border-blue-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Быстрые действия</h2>

            <div className="space-y-4">
              <div className="bg-white rounded p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">📋 Управление техниками</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Назначьте техников, которые работают в этом филиале
                </p>
                <Link
                  href={`/admin/branches/${id}/technicians`}
                  className="inline-block text-blue-600 hover:text-blue-800 font-medium"
                >
                  Открыть →
                </Link>
              </div>

              <div className="bg-white rounded p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">📊 Статистика</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Просмотрите статистику билетов для этого филиала
                </p>
                <p className="text-gray-400 text-sm">Скоро</p>
              </div>

              <div className="bg-white rounded p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">⚙️ Параметры</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Настройте параметры этого филиала
                </p>
                <p className="text-gray-400 text-sm">Скоро</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">❓ Что я могу делать здесь?</h3>
          <ul className="list-disc list-inside space-y-2 text-sm text-yellow-800">
            <li>
              <strong>Управлять техниками:</strong> Назначить или удалить техников, которые работают в этом филиале
            </li>
            <li>
              <strong>Просматривать информацию:</strong> Увидеть код филиала, название и связанные данные
            </li>
            <li>
              <strong>Планировать:</strong> Использовать эту информацию для умного автоматического назначения билетов
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
