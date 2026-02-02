'use client';

import { useState } from 'react';

export default function AddVehiclesDriversPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdd = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/add-vehicles-drivers', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ Успешно добавлено!\n\n${data.message}`);
      } else {
        setMessage(`❌ Ошибка: ${data.error}`);
      }
    } catch (error: any) {
      setMessage(`❌ Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Добавить транспорт и водителей</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Водители (5):</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>NASRITDINOV ZUXRITDIN ERKINOVICH</li>
            <li>Ummat</li>
            <li>Viktor</li>
            <li>Azamat</li>
            <li>Elomon</li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Транспорт (7):</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>01 522 OLA - DAMAS-2</li>
            <li>01 R 153 BB - DAMAS-2</li>
            <li>01 732 BGA - KIA BONGO</li>
            <li>01 298 QMA - DAMAS-2</li>
            <li>01 924 NLA - DAMAS-2</li>
            <li>01 612 RJA - DAMAS-2</li>
            <li>01 685 ZMA - DAMAS-2</li>
          </ul>
        </div>

        <button
          onClick={handleAdd}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Добавление...' : 'Добавить все'}
        </button>

        {message && (
          <div className={`mt-6 p-4 rounded whitespace-pre-line ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
