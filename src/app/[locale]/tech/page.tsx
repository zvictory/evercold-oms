import Link from "next/link";

export const metadata = {
  title: "Техник - Служба поддержки",
  description: "Панель управления для техников",
};

export default function TechnicianDashboard() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Служба поддержки техника</h1>
          <p className="text-gray-600 text-lg">Управление сервисными билетами и задачами</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technicians List Card - FOR DISPATCHER */}
          <Link href="/tech/list">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">👨‍🔧</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Список техников</h2>
                  <p className="text-gray-600">Управление техниками и их назначениями</p>
                </div>
              </div>
              <p className="text-blue-600 font-medium mt-4">Открыть список →</p>
            </div>
          </Link>

          {/* My Tickets Card */}
          <Link href="/tech/tickets">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-5xl">📋</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Мои билеты</h2>
                  <p className="text-gray-600">Сервисные задачи, назначенные вам</p>
                </div>
              </div>
              <p className="text-blue-600 font-medium mt-4">Просмотреть билеты →</p>
            </div>
          </Link>

          {/* Complete Service Card */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">✓</div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Завершить услугу</h2>
                <p className="text-gray-600">Отметить работу как выполненную</p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
              <p className="text-sm text-gray-700">
                ℹ️ Выберите билет из списка "Мои билеты", чтобы добавить информацию о завершении работы (фотографии, описание, затраты)
              </p>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow border border-blue-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">📖 Как использовать систему</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl mb-2">1️⃣</div>
                <h4 className="font-bold text-gray-900 mb-2">Откройте билет</h4>
                <p className="text-sm text-gray-700">Перейдите в "Мои билеты" и выберите назначенный вам билет</p>
              </div>
              <div>
                <div className="text-3xl mb-2">2️⃣</div>
                <h4 className="font-bold text-gray-900 mb-2">Выполните работу</h4>
                <p className="text-sm text-gray-700">Выполните требуемое обслуживание охлаждающей системы</p>
              </div>
              <div>
                <div className="text-3xl mb-2">3️⃣</div>
                <h4 className="font-bold text-gray-900 mb-2">Отправьте на одобрение</h4>
                <p className="text-sm text-gray-700">Заполните форму с описанием, фото и затратами. Диспетчер одобрит работу</p>
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
                  <h4 className="font-bold text-gray-900">Список назначенных билетов</h4>
                  <p className="text-sm text-gray-600">Все сервисные задачи, назначенные вам</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <h4 className="font-bold text-gray-900">Детали билета</h4>
                  <p className="text-sm text-gray-600">Полная информация о филиале и проблеме</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <h4 className="font-bold text-gray-900">Загрузка фотографий</h4>
                  <p className="text-sm text-gray-600">Прикрепляйте доказательства выполненной работы</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold text-xl">✓</span>
                <div>
                  <h4 className="font-bold text-gray-900">Отчет о затратах</h4>
                  <p className="text-sm text-gray-600">Указывайте детали, трудовые часы и стоимость</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
