'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import DatePicker from '@/components/DatePicker'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [orderDate, setOrderDate] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setMessage('')
      setError('')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setMessage('')
      setError('')
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Выберите файл')
      return
    }

    setUploading(true)
    setMessage('')
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    if (orderDate) {
      formData.append('customOrderDate', orderDate)
    }

    try {
      const response = await fetch('/api/upload-purchase-order', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки')
      }

      let message = `✓ Создано ${data.ordersCreated || 0} заказов`
      if (data.ordersSkipped > 0) {
        message += `, пропущено ${data.ordersSkipped}`
      }
      if (data.errors && data.errors.length > 0) {
        message += `\n\nОшибки:\n${data.errors.join('\n')}`
      }
      setMessage(message)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки файла')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-3xl mx-auto py-6 px-4">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Загрузить заказ</h1>
          <p className="text-sm text-gray-600">Excel файл (.xls, .xlsx)</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Compact Date Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Дата заказа (опционально)
              </label>
              <DatePicker
                id="orderDate"
                value={orderDate}
                onChange={setOrderDate}
                enableTime={true}
                placeholder="Выберите дату и время"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Compact Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 hover:border-indigo-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                onChange={handleChange}
                className="hidden"
                id="file-upload"
              />

              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-indigo-500 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>

                {file ? (
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(2)} КБ
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      Перетащите файл или нажмите
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Excel (.xls, .xlsx)
                    </p>
                  </div>
                )}
              </label>
            </div>

            {/* Messages */}
            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-green-800 whitespace-pre-line">{message}</p>
                    <Link
                      href="/orders"
                      className="inline-block mt-2 text-sm text-green-700 hover:text-green-900 font-semibold underline"
                    >
                      Просмотреть заказы →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Compact Submit Button */}
            <button
              type="submit"
              disabled={!file || uploading}
              className={`w-full py-3 px-4 rounded-lg text-base font-semibold transition-colors ${
                !file || uploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Обработка...</span>
                </div>
              ) : (
                'Загрузить'
              )}
            </button>
          </form>

          {/* Compact Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Поддерживаемые форматы:
            </p>
            <ul className="space-y-1 text-xs text-gray-600">
              <li className="flex items-start gap-1">
                <span className="text-indigo-600">✓</span>
                <span>Детальный заказ по филиалу</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-indigo-600">✓</span>
                <span>Реестр по нескольким филиалам</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-4 flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-sm font-semibold text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Панель управления
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-sm font-semibold text-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Все заказы
          </Link>
        </div>
      </main>
    </div>
  )
}
