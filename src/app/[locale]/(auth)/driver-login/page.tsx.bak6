'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentLocale } from '@/locales/client';

export default function DriverLoginPage() {
  const router = useRouter();
  const locale = useCurrentLocale();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+998${phone}`, pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      const { token, driver } = await res.json();

      // Store token and driver info
      localStorage.setItem('driverToken', token);
      localStorage.setItem('driverInfo', JSON.stringify(driver));

      // Redirect to routes page with locale prefix
      router.push(`/${locale}/driver/routes`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 max-w-md w-full">
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🚗</div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">EverCold Водитель</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">Введите ваши учетные данные</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-red-700 text-xs sm:text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              📱 Номер телефона
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="px-2 sm:px-3 py-2 sm:py-3 bg-gray-100 text-gray-700 font-medium text-sm sm:text-base">+998</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="901234567"
                maxLength={9}
                required
                className="flex-1 px-2 sm:px-3 py-2 sm:py-3 outline-none text-sm sm:text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              🔑 ПИН-код
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Введите 4-6 цифр"
              minLength={4}
              maxLength={6}
              required
              className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || phone.length !== 9 || pin.length < 4}
            className="w-full py-3 sm:py-4 bg-indigo-600 text-white rounded-lg font-bold text-base sm:text-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
          >
            {loading ? '⏳ Вход...' : '→ Войти в систему'}
          </button>
        </form>

        <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
          Забыли ПИН? Свяжитесь с диспетчером
        </p>
      </div>
    </div>
  );
}
