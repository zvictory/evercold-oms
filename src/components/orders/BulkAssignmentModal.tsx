"use client"

import * as React from "react"
import { Truck, Calendar, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Driver {
  id: string
  name: string
  phone: string
  status: string
}

interface Vehicle {
  id: string
  plateNumber: string
  model: string
  status: string
}

interface BulkAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedOrderIds: string[]
  onAssignComplete: () => void
}

const t = (key: string): string => {
  const translations: Record<string, string> = {
    "title": "Назначить заказы водителю",
    "description": "Выберите водителя, машину и время для назначения доставок",
    "selectedOrders": "Выбрано заказов",
    "driverLabel": "Водитель",
    "driverPlaceholder": "Выберите водителя...",
    "vehicleLabel": "Машина",
    "vehiclePlaceholder": "Выберите машину...",
    "scheduledDateLabel": "Запланированная дата и время",
    "notesLabel": "Примечания (опционально)",
    "notesPlaceholder": "Инструкции по доставке, особые требования и т.д.",
    "createRouteLabel": "Создать оптимизированный маршрут автоматически",
    "cancelButton": "Отмена",
    "assignButton": "Назначить заказы",
    "loadingDrivers": "Загрузка водителей...",
    "loadingVehicles": "Загрузка машин...",
    "selectDriver": "Выберите водителя",
    "selectVehicle": "Выберите машину",
    "errorDriversTitle": "Не удалось загрузить водителей",
    "errorVehiclesTitle": "Не удалось загрузить машины",
    "errorValidation": "Пожалуйста, заполните все обязательные поля",
    "errorApi": "Ошибка при назначении заказов",
  }
  return translations[key] || key
}

export function BulkAssignmentModal({
  open,
  onOpenChange,
  selectedOrderIds,
  onAssignComplete
}: BulkAssignmentModalProps) {
  const [drivers, setDrivers] = React.useState<Driver[]>([])
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [loadingDrivers, setLoadingDrivers] = React.useState(true)
  const [loadingVehicles, setLoadingVehicles] = React.useState(true)
  const [selectedDriver, setSelectedDriver] = React.useState("")
  const [selectedVehicle, setSelectedVehicle] = React.useState("")
  const [scheduledDate, setScheduledDate] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [createRoute, setCreateRoute] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Fetch drivers and vehicles when modal opens
  React.useEffect(() => {
    if (open) {
      fetchDrivers()
      fetchVehicles()
      // Reset form
      setSelectedDriver("")
      setSelectedVehicle("")
      setScheduledDate("")
      setNotes("")
      setCreateRoute(true)
      setErrorMessage(null)
    }
  }, [open])

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true)
      const response = await fetch('/api/drivers?status=ACTIVE')
      if (!response.ok) throw new Error('Failed to fetch drivers')
      const data = await response.json()
      setDrivers(data.drivers || [])
    } catch (error: any) {
      console.error('Error fetching drivers:', error)
      setErrorMessage(t('errorDriversTitle'))
    } finally {
      setLoadingDrivers(false)
    }
  }

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true)
      const response = await fetch('/api/vehicles')
      if (!response.ok) throw new Error('Failed to fetch vehicles')
      const data = await response.json()
      setVehicles(data.vehicles || [])
    } catch (error: any) {
      console.error('Error fetching vehicles:', error)
      setErrorMessage(t('errorVehiclesTitle'))
    } finally {
      setLoadingVehicles(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!selectedDriver || !selectedVehicle) {
      setErrorMessage(t('errorValidation'))
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)

      const response = await fetch('/api/dispatch/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedOrderIds,
          driverId: selectedDriver,
          vehicleId: selectedVehicle,
          scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
          notes: notes || undefined,
          createRoute: createRoute
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || t('errorApi'))
      }

      const result = await response.json()

      // Find driver and vehicle names for feedback
      const driverName = drivers.find(d => d.id === selectedDriver)?.name || 'Unknown'

      // Show success feedback through parent
      // The parent will handle the toast and refresh
      onAssignComplete()
      onOpenChange(false)

    } catch (error: any) {
      console.error('Assignment error:', error)
      setErrorMessage(error.message || t('errorApi'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-sky-600" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Selected Orders Preview */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
            <p className="text-sm font-medium text-slate-900">
              {t('selectedOrders')}: <span className="text-sky-600 font-bold">{selectedOrderIds.length}</span>
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driver" className="text-sm font-medium text-slate-900">
              {t('driverLabel')}
            </Label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver} disabled={loadingDrivers}>
              <SelectTrigger
                id="driver"
                className="w-full bg-slate-50 border-slate-200 hover:bg-white"
              >
                <SelectValue placeholder={loadingDrivers ? t('loadingDrivers') : t('driverPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {drivers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-slate-500">{t('selectDriver')}</div>
                ) : (
                  drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <span className="font-medium">{driver.name}</span>
                      <span className="text-slate-500 ml-2">{driver.phone}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label htmlFor="vehicle" className="text-sm font-medium text-slate-900">
              {t('vehicleLabel')}
            </Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle} disabled={loadingVehicles}>
              <SelectTrigger
                id="vehicle"
                className="w-full bg-slate-50 border-slate-200 hover:bg-white"
              >
                <SelectValue placeholder={loadingVehicles ? t('loadingVehicles') : t('vehiclePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-slate-500">{t('selectVehicle')}</div>
                ) : (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <span className="font-medium">{vehicle.plateNumber}</span>
                      <span className="text-slate-500 ml-2">{vehicle.model}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="scheduled-date" className="text-sm font-medium text-slate-900">
              {t('scheduledDateLabel')}
            </Label>
            <Input
              id="scheduled-date"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full bg-slate-50 border-slate-200 hover:bg-white"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-slate-900">
              {t('notesLabel')}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full bg-slate-50 border-slate-200 hover:bg-white resize-none"
              rows={3}
            />
          </div>

          {/* Create Route Checkbox */}
          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <Checkbox
              id="create-route"
              checked={createRoute}
              onCheckedChange={(checked) => setCreateRoute(checked === true)}
              className="border-slate-300"
            />
            <Label
              htmlFor="create-route"
              className="text-sm font-medium text-slate-900 cursor-pointer select-none"
            >
              {t('createRouteLabel')}
            </Label>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1"
          >
            {t('cancelButton')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDriver || !selectedVehicle}
            className="flex-1 bg-sky-600 hover:bg-sky-700 text-white gap-2"
          >
            {isSubmitting && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />}
            {t('assignButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
