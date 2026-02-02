'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppNavigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/'
    }
    // Fleet menu should be active for /fleet, /vehicles, /drivers, and /routes pages
    if (path === '/fleet') {
      return pathname.startsWith('/fleet') || pathname.startsWith('/vehicles') || pathname.startsWith('/drivers') || pathname.startsWith('/routes')
    }
    // Customers menu should be active for /customers and /branches pages
    if (path === '/customers') {
      return pathname.startsWith('/customers') || pathname.startsWith('/branches')
    }
    // Products menu should be active for /products and /admin/customer-prices pages
    if (path === '/products') {
      return pathname.startsWith('/products') || pathname === '/admin/customer-prices'
    }
    // Admin menu should be active for /admin pages
    if (path === '/admin') {
      return pathname.startsWith('/admin')
    }
    return pathname.startsWith(path)
  }

  const navLinkClass = (path: string) => {
    const baseClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors"
    if (isActive(path)) {
      return `${baseClass} text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600`
    }
    return `${baseClass} text-gray-700 hover:text-indigo-600 hover:bg-gray-50`
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <img
                src="https://evercold.uz/wp-content/uploads/2024/07/logo_trans1-1-e1721160239265.png"
                alt="EverCold"
                className="h-12 w-auto"
              />
            </Link>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <Link href="/" className={navLinkClass('/')}>
              📊 Панель
            </Link>
            <Link href="/orders" className={navLinkClass('/orders')}>
              📋 Заказы
            </Link>
            <Link href="/customers" className={navLinkClass('/customers')}>
              👥 Клиенты
            </Link>
            <Link href="/products" className={navLinkClass('/products')}>
              📦 Товары
            </Link>
            <Link href="/fleet" className={navLinkClass('/fleet')}>
              🚛 Автопарк
            </Link>
            <Link href="/admin/branches" className={navLinkClass('/admin')}>
              🏢 Филиалы
            </Link>
            <Link href="/settings/edo" className={navLinkClass('/settings/edo')}>
              ⚙️ Настройки
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
