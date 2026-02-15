"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Navigation, Phone, Package, Truck, Calendar, MapPin, User, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LicensePlate } from "@/components/ui/license-plate"
import { format } from "date-fns"
import { useI18n, useCurrentLocale } from "@/locales/client"

interface DeliveryDetails {
  id: string
  scheduledDate: string
  status: string
  order: {
    orderNumber: string
    orderItems: Array<{
      id: string
      quantity: number
      product: {
        id: string
        productName: string
        sapCode: string
      }
      branch: {
        id: string
        branchCode: string
        branchName: string
        deliveryAddress: string
        contactPerson?: string
        phone?: string
      }
    }>
  }
  vehicle?: {
    id: string
    plateNumber: string
    model: string
  }
  routeStop?: {
    id: string
    routeId: string
    status: string
    sequence: number
  }
}

export default function DeliveryArrivalPage() {
  const router = useRouter()
  const params = useParams()
  const t = useI18n()
  const locale = useCurrentLocale()
  const deliveryId = params.deliveryId as string

  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingArrival, setMarkingArrival] = useState(false)
  const [arrivalSuccess, setArrivalSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDeliveryDetails()
  }, [deliveryId])

  async function fetchDeliveryDetails() {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('driverToken')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        headers
      })
      if (!response.ok) {
        throw new Error("Failed to fetch delivery details")
      }

      const data = await response.json()
      setDelivery(data)

      // If already arrived, proceed directly to checklist
      if (data.routeStop?.status === "ARRIVED" || data.routeStop?.status === "COMPLETED") {
        router.push(`/${locale}/driver/delivery/${deliveryId}`)
      }
    } catch (err: any) {
      setError(err.message || t('Driver.delivery.error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkArrived() {
    if (!delivery) return

    try {
      setMarkingArrival(true)
      setError(null)
      const token = localStorage.getItem('driverToken')

      // If delivery has a route stop, update its status
      if (delivery.routeStop) {
        const response = await fetch(
          `/api/routes/${delivery.routeStop.routeId}/stops/${delivery.routeStop.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              status: "ARRIVED",
              notes: JSON.stringify({
                arrivalTimestamp: new Date().toISOString(),
              }),
            }),
          }
        )

        if (!response.ok) {
          throw new Error("Failed to mark arrival")
        }
      }

      // Show success state
      setMarkingArrival(false)
      setArrivalSuccess(true)

      // Wait 1s then navigate to checklist
      setTimeout(() => {
        router.push(`/${locale}/driver/delivery/${deliveryId}`)
      }, 1000)
    } catch (err: any) {
      setError(err.message || t('Driver.delivery.error'))
      setMarkingArrival(false)
    }
  }

  function handleNavigate() {
    if (!delivery?.order.orderItems[0]?.branch) return

    const address = delivery.order.orderItems[0].branch.deliveryAddress
    const encodedAddress = encodeURIComponent(address)

    // Open in default maps app (works on iOS and Android)
    window.open(`https://maps.google.com/?q=${encodedAddress}`, "_blank")
  }

  function handleCall() {
    if (!delivery?.order.orderItems[0]?.branch?.phone) return

    const phone = delivery.order.orderItems[0].branch.phone
    window.location.href = `tel:${phone}`
  }

  // Aggregate items by product
  function getItemsSummary() {
    if (!delivery) return {}

    return delivery.order.orderItems.reduce((acc, item) => {
      const productName = item.product.productName
      acc[productName] = (acc[productName] || 0) + item.quantity
      return acc
    }, {} as Record<string, number>)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-sm text-slate-600">{t('Driver.delivery.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
        <Card className="p-6 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <Package className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-lg font-semibold">{t('Driver.delivery.error')}</h2>
          </div>
          <p className="text-slate-600 mb-4">{error || t('Driver.delivery.notFound')}</p>
          <Button onClick={() => router.push(`/${locale}/driver/routes`)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('Driver.delivery.arrival.backToList')}
          </Button>
        </Card>
      </div>
    )
  }

  const firstItem = delivery.order.orderItems[0]
  const branch = firstItem?.branch
  const itemsSummary = getItemsSummary()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/driver/routes`)}
            className="text-slate-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('Driver.delivery.arrival.backToList')}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Destination Card */}
        <Card className="p-6 space-y-4">
          <div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-900 mb-1">
                  {branch?.branchName || t('Driver.delivery.arrival.destinationPlaceholder')}
                </h1>
                <p className="text-slate-600">{branch?.deliveryAddress || t('Driver.delivery.arrival.addressPlaceholder')}</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          {(branch?.contactPerson || branch?.phone) && (
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <User className="h-5 w-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {branch.contactPerson || t('Driver.delivery.arrival.contactPlaceholder')}
                </p>
                {branch.phone && (
                  <p className="text-sm text-slate-600">{branch.phone}</p>
                )}
              </div>
              {branch.phone && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCall}
                  className="flex-shrink-0"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Items Summary Card */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Package className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">{t('Driver.delivery.arrival.items')}</h2>
          </div>
          <div className="space-y-2">
            {Object.entries(itemsSummary).map(([productName, quantity]) => (
              <div
                key={productName}
                className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <span className="text-slate-700">{productName}</span>
                <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
                  {quantity} шт
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Delivery Info Card */}
        <Card className="p-6 space-y-3">
          {delivery.vehicle && (
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-slate-400" />
              <div className="flex-1">
                <p className="text-sm text-slate-500 mb-1">{t('Driver.delivery.arrival.vehicle')}</p>
                <LicensePlate plateNumber={delivery.vehicle.plateNumber} />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-slate-400" />
            <div className="flex-1">
              <p className="text-sm text-slate-500 mb-1">{t('Driver.delivery.arrival.scheduledDate')}</p>
              <p className="font-medium text-slate-900">
                {format(new Date(delivery.scheduledDate), "dd.MM.yyyy")}
              </p>
            </div>
          </div>
        </Card>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pb-6">
          {/* Primary Action - Mark Arrived */}
          <Button
            size="lg"
            className={`w-full font-bold py-6 rounded-xl shadow-lg transition-all ${arrivalSuccess ? "bg-emerald-600 hover:bg-emerald-600" : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            onClick={handleMarkArrived}
            disabled={markingArrival || arrivalSuccess}
          >
            {markingArrival ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t('Driver.delivery.arrival.arriving')}
              </>
            ) : arrivalSuccess ? (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {t('Driver.delivery.arrival.arrivedButton')}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {t('Driver.delivery.arrival.arrivedButton')}
              </>
            )}
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleNavigate}
              className="bg-white hover:bg-slate-50"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {t('Driver.delivery.arrival.navigation')}
            </Button>
            {branch?.phone && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleCall}
                className="bg-white hover:bg-slate-50"
              >
                <Phone className="h-4 w-4 mr-2" />
                {t('Driver.delivery.arrival.call')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
