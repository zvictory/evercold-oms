import Link from "next/link";

export const metadata = {
  title: "Диспетчер - Служба поддержки",
  description: "Панель управления для диспетчеров",
};

export default function DispatcherDashboard() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Служба поддержки диспетчера</h1>
          <p className="text-gray-600 text-lg">Управление сервисными билетами и назначением техников</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* All Tickets Card */}
          <Link href="/dispatcher/tickets">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">📋</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Все билеты</h2>
                  <p className="text-gray-600">Управление всеми сервисными билетами</p>
                </div>
              </div>
              <p className="text-blue-600 font-medium mt-4">Просмотреть билеты →</p>
            </div>
          </Link>

          {/* Create New Ticket Card */}
          <Link href="/tickets/create">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">➕</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Новый билет</h2>
                  <p className="text-gray-600">Создать сервисный билет</p>
                </div>
              </div>
              <p className="text-blue-600 font-medium mt-4">Создать билет →</p>
            </div>
          </Link>

          {/* Approve Services Card */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">✓</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Одобрить услуги</h2>
                <p className="text-gray-600">Проверить и одобрить выполненные работы</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-700">
                ℹ️ Перейдите к завершенным билетам и просмотрите отчеты техников перед одобрением
              </p>
            </div>
          </div>

          {/* Analytics Card */}
          <Link href="/dispatcher/analytics">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">📊</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Аналитика</h2>
                  <p className="text-gray-600">Статистика и отчеты</p>
                </div>
              </div>
              <p className="text-blue-600 font-medium mt-4">Просмотреть аналитику →</p>
            </div>
          </Link>

          {/* Instructions Card */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow border border-blue-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📖 Как управлять билетами</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl mb-2">1️⃣</div>
                <h4 className="font-bold text-gray-900 mb-2">Создайте билет</h4>
                <p className="text-sm text-gray-700">Нажмите "Новый билет" и заполните информацию о проблеме на филиале</p>
              </div>
              <div>
                <div className="text-3xl mb-2">2️⃣</div>
                <h4 className="font-bold text-gray-900 mb-2">Назначьте техника</h4>
                <p className="text-sm text-gray-700">Система автоматически назначает техника или вы можете выбрать вручную</p>
              </div>
              <div>
                <div className="text-3xl mb-2">3️⃣</div>
                <h4 className="font-bold text-gray-900 mb-2">Одобрите работу</h4>
                <p className="text-sm text-gray-700">Техник отправляет отчет, вы проверяете и одобряете завершение</p>
              </div>
            </div>
          </div>

          {/* Features Card */}
          <div className="md:col-span-2 bg-white rounded-lg shadow border border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">🎯 Основные функции</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <h4 className="font-bold text-gray-900">Управление билетами</h4>
                  <p className="text-sm text-gray-600">Создание, фильтрация и отслеживание билетов по статусу</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <h4 className="font-bold text-gray-900">Назначение техников</h4>
                  <p className="text-sm text-gray-600">Автоматическое или ручное назначение техников на задачи</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <h4 className="font-bold text-gray-900">Проверка отчетов</h4>
                  <p className="text-sm text-gray-600">Просмотр фото, описания и затрат, указанных техником</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <h4 className="font-bold text-gray-900">Одобрение услуг</h4>
                  <p className="text-sm text-gray-600">Одобрение или запрос доработок на основе отчета техника</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <h4 className="font-bold text-gray-900">SLA отслеживание</h4>
                  <p className="text-sm text-gray-600">Отслеживание сроков выполнения и приоритетов</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <h4 className="font-bold text-gray-900">Аналитика</h4>
                  <p className="text-sm text-gray-600">Статистика выполнения, время отклика и качество работы</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
