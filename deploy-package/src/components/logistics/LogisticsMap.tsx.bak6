"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { YMaps, Map, Placemark, ZoomControl, TypeSelector, TrafficControl, Polyline } from "@pbe/react-yandex-maps"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Navigation, Phone, Truck, MapPin, RefreshCw } from "lucide-react"
import { useDriverLocations } from "@/hooks/useDriverLocations"
import type { DriverLocation } from "@/types/driver"

// Mock Data for Visualization
const TASHKENT_CENTER = [41.2995, 69.2401]

const BRANCHES = [
    { id: 1, name: "Korzinka Chilanzar", coords: [41.2858, 69.2035], active: true },
    { id: 2, name: "Makro Sergeli", coords: [41.2338, 69.2323], active: true },
    { id: 3, name: "Korzinka Qoratosh", coords: [41.3123, 69.2329], active: true },
    { id: 4, name: "Havas Yunusabad", coords: [41.3653, 69.2941], active: false },
]

// Mock Route for visualization
const MOCK_ROUTE = [
    [41.2900, 69.2500], // Truck Start
    [41.2858, 69.2035], // Chilanzar
    [41.2338, 69.2323], // Sergeli
]

export function LogisticsMap() {
    const t = useTranslations("Logistics")
    const [showTraffic, setShowTraffic] = React.useState(false)
    const [selectedTruck, setSelectedTruck] = React.useState<string | null>(null)
    const { locations, isLoading, error, refetch } = useDriverLocations()

    // Layout configuration for custom controls
    const mapState = {
        center: TASHKENT_CENTER,
        zoom: 12,
        controls: [] // We'll add controls manually or via components
    }

    const getDriverIcon = (location: DriverLocation): string => {
        if (location.isOffline) return 'islands#greyDeliveryIcon'

        switch (location.status) {
            case 'MOVING': return 'islands#blueDeliveryIcon'
            case 'STOPPED': return 'islands#yellowDeliveryIcon'
            default: return 'islands#greyDeliveryIcon'
        }
    }

    const getStatusLabel = (location: DriverLocation): string => {
        if (location.isOffline) return t("map.status.offline")

        switch (location.status) {
            case 'MOVING': return t("map.status.moving")
            case 'STOPPED': return t("map.status.stopped")
            default: return t("map.status.online")
        }
    }

    return (
        <div className="relative h-full w-full bg-slate-100 overflow-hidden group">

            <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_KEY, lang: 'en_US' }}>
                <Map
                    defaultState={mapState}
                    className="w-full h-full"
                    options={{
                        suppressMapOpenBlock: true,
                        autoFitToViewport: 'always'
                    }}
                >
                    {/* Standard Controls */}
                    <ZoomControl options={{ position: { right: 10, top: 150 } } as any} />
                    <TypeSelector options={{ position: { right: 10, top: 230 } } as any} />

                    {/* Toggle Traffic Layer based on state */}
                    {showTraffic && <TrafficControl options={{ float: 'right' } as any} />}

                    {/* Branch Markers */}
                    {BRANCHES.map(branch => (
                        <Placemark
                            key={`branch-${branch.id}`}
                            geometry={branch.coords}
                            properties={{
                                balloonContent: `<strong>${branch.name}</strong><br>Status: ${branch.active ? 'Active' : 'Pending'}`,
                                hintContent: branch.name
                            }}
                            options={{
                                preset: branch.active ? 'islands#blueShoppingIcon' : 'islands#greyShoppingIcon'
                            }}
                        />
                    ))}

                    {/* Driver Location Markers - Real-time */}
                    {!isLoading && !error && locations.map((location) => (
                        <Placemark
                            key={`driver-${location.driverId}`}
                            geometry={[location.lat, location.lng]}
                            properties={{
                                balloonContent: `<strong>${location.driverName}</strong><br>
                                              ${getStatusLabel(location)}<br>
                                              <small>Updated: ${new Date(location.lastUpdate).toLocaleTimeString()}</small>`,
                            }}
                            options={{
                                preset: getDriverIcon(location),
                            }}
                            onClick={() => setSelectedTruck(location.driverId)}
                        />
                    ))}
                </Map>
            </YMaps>

            {/* FLOATING CONTROLS (Top Right) - Custom Overlay */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="bg-white hover:bg-slate-50 shadow-sm gap-2"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="text-xs font-medium">{t("map.refresh")}</span>
                </Button>
                <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600">{t("map.showTraffic")}</span>
                    <Switch checked={showTraffic} onCheckedChange={setShowTraffic} />
                </div>
            </div>

            {/* FLOATING ACTION (Top Center-Left) */}
            <div className="absolute top-4 left-4 z-10">
                <Button className="bg-white text-sky-600 hover:bg-sky-50 border border-sky-100 shadow-sm gap-2 font-medium">
                    <Sparkles className="h-4 w-4" /> {t("map.optimizeRoutes")}
                </Button>
            </div>

            {/* DRIVER OVERLAY (Bottom Right) */}
            {selectedTruck && locations.length > 0 && (
                (() => {
                    const selectedLocation = locations.find(l => l.driverId === selectedTruck)
                    return selectedLocation ? (
                        <div className="absolute bottom-6 right-6 z-20 w-80">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-500">
                                {/* Header */}
                                <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <Avatar className="h-10 w-10 border border-white shadow-sm">
                                            <AvatarImage src="https://github.com/shadcn.png" />
                                            <AvatarFallback>{selectedLocation.driverName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-900">
                                                {selectedLocation.driverName}
                                            </h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {getStatusLabel(selectedLocation)}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className={`${
                                        selectedLocation.isOffline
                                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                                            : selectedLocation.status === 'MOVING'
                                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                                            : 'bg-amber-100 text-amber-700 border-amber-200'
                                    }`}>
                                        {getStatusLabel(selectedLocation)}
                                    </Badge>
                                </div>

                                {/* Stats */}
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Last Update</p>
                                        <p className="text-xs font-medium text-slate-700">
                                            {new Date(selectedLocation.lastUpdate).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Coordinates</p>
                                        <p className="text-xs font-mono text-slate-700">
                                            {selectedLocation.lat.toFixed(3)}, {selectedLocation.lng.toFixed(3)}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="p-2 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1">
                                        <Phone className="h-3 w-3" /> {t("map.call")}
                                    </Button>
                                    <Button size="sm" className="flex-1 h-8 text-xs bg-sky-600 hover:bg-sky-700">
                                        {t("map.viewRoute")}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null
                })()
            )}
        </div>
    )
}
