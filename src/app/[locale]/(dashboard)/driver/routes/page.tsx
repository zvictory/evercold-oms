'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useI18n, useCurrentLocale } from '@/locales/client';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Ban,
  HelpCircle,
  MapPin,
  Navigation,
  Map,
  User,
  Phone,
  BookOpen,
  RefreshCw,
  List,
  Package,
} from 'lucide-react';

interface Route {
  id: string;
  routeName: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  isStandalone?: boolean;
  totalDistance?: number;
  estimatedDuration?: number;
  estimatedDurationWithTraffic?: number;
  stops: Array<{
    id: string;
    stopNumber: number;
    status: string;
    deliveryId: string;
    delivery: Delivery;
  }>;
  driver: {
    name: string;
  };
  vehicle: {
    plateNumber: string;
    model: string;
  };
}

interface Delivery {
  id: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'PARTIALLY_DELIVERED' | 'FAILED' | 'CANCELLED';
  order: {
    orderNumber: string;
    customer: {
      name: string;
    };
    orderItems: Array<{
      id: string;
      quantity: number;
      branch?: {
        id: string;
        branchName: string;
        fullName: string;
        deliveryAddress: string;
        latitude?: number;
        longitude?: number;
        contactPerson?: string;
        phone?: string;
      };
      product: {
        id: string;
        name: string;
        unit: string;
      };
    }>;
  };
  vehicle: {
    id: string;
    plateNumber: string;
    model: string;
  };
}

interface FlattenedDelivery {
  id: string;
  deliveryId: string;
  status: string;
  orderNumber: string;
  stopNumber?: number;
  route?: {
    id: string;
    name: string;
    isStandalone: boolean;
  };
  vehicle: {
    plateNumber: string;
    model: string;
  };
  order: {
    orderNumber: string;
    customer: {
      name: string;
    };
    orderItems: Array<{
      id: string;
      quantity: number;
      branch?: {
        id: string;
        branchName: string;
        fullName: string;
        deliveryAddress: string;
        latitude?: number;
        longitude?: number;
        contactPerson?: string;
        phone?: string;
      };
      product: {
        id: string;
        name: string;
        unit: string;
      };
    }>;
  };
}

export default function DriverRoutesPage() {
  const t = useI18n();
  const locale = useCurrentLocale();
  const [deliveries, setDeliveries] = useState<FlattenedDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_transit' | 'completed'>('all');

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);

      // Get driver info from localStorage
      const driverInfo = localStorage.getItem('driverInfo');
      const token = localStorage.getItem('driverToken');

      if (!driverInfo || !token) {
        throw new Error('No driver session found');
      }

      const driver = JSON.parse(driverInfo);

      // Fetch routes filtered by current driver ID
      const response = await fetch(`/api/driver/deliveries?driverId=${driver.id}`, {
        headers: {
        credentials: 'include',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch deliveries');

      const data = await response.json();

      // Flatten routes into individual deliveries
      const flatDeliveries: FlattenedDelivery[] = [];
      (data.routes || []).forEach((route: Route) => {
        route.stops.forEach((stop) => {
          flatDeliveries.push({
            id: `${route.id}-${stop.id}`,
            deliveryId: stop.deliveryId,
            status: stop.delivery.status,
            orderNumber: stop.delivery.order.orderNumber,
            stopNumber: stop.stopNumber,
            route: {
              id: route.id,
              name: route.routeName,
              isStandalone: route.isStandalone || false,
            },
            vehicle: stop.delivery.vehicle,
            order: stop.delivery.order,
          });
        });
      });

      setDeliveries(flatDeliveries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryStatusIcon = (status: string) => {
    const iconClass = 'h-6 w-6';
    switch (status) {
      case 'PENDING':
        return <Clock className={cn(iconClass, 'text-slate-500')} />;
      case 'IN_TRANSIT':
        return <Truck className={cn(iconClass, 'text-amber-600')} />;
      case 'DELIVERED':
        return <CheckCircle2 className={cn(iconClass, 'text-emerald-600')} />;
      case 'PARTIALLY_DELIVERED':
        return <AlertCircle className={cn(iconClass, 'text-orange-600')} />;
      case 'FAILED':
        return <XCircle className={cn(iconClass, 'text-red-600')} />;
      case 'CANCELLED':
        return <Ban className={cn(iconClass, 'text-slate-500')} />;
      default:
        return <HelpCircle className={cn(iconClass, 'text-slate-400')} />;
    }
  };

  const getDeliveryStatusBorderColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-slate-200';
      case 'IN_TRANSIT':
        return 'border-amber-200';
      case 'DELIVERED':
        return 'border-emerald-200';
      case 'PARTIALLY_DELIVERED':
        return 'border-orange-200';
      case 'FAILED':
        return 'border-red-200';
      case 'CANCELLED':
        return 'border-slate-200';
      default:
        return 'border-slate-200';
    }
  };

  const getDeliveryStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'border-slate-200 text-slate-700 bg-slate-50';
      case 'IN_TRANSIT':
        return 'border-amber-200 text-amber-700 bg-amber-50';
      case 'DELIVERED':
        return 'border-emerald-200 text-emerald-700 bg-emerald-50';
      case 'PARTIALLY_DELIVERED':
        return 'border-orange-200 text-orange-700 bg-orange-50';
      case 'FAILED':
        return 'border-red-200 text-red-700 bg-red-50';
      case 'CANCELLED':
        return 'border-slate-200 text-slate-700 bg-slate-50';
      default:
        return 'border-slate-200 text-slate-700 bg-slate-50';
    }
  };


  const getDeliveryStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('Driver.routes.status.pending');
      case 'IN_TRANSIT':
        return t('Driver.routes.status.inTransit');
      case 'DELIVERED':
        return t('Driver.routes.status.delivered');
      case 'PARTIALLY_DELIVERED':
        return t('Driver.routes.status.partiallyDelivered');
      case 'FAILED':
        return t('Driver.routes.status.failed');
      case 'CANCELLED':
        return t('Driver.routes.status.cancelled');
      default:
        return status;
    }
  };

  const filteredDeliveries = deliveries.filter((delivery) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return delivery.status === 'PENDING';
    if (filter === 'in_transit') return delivery.status === 'IN_TRANSIT';
    if (filter === 'completed') return ['DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED', 'FAILED'].includes(delivery.status);
    return true;
  });

  const stats = {
    pending: deliveries.filter((d) => d.status === 'PENDING').length,
    inTransit: deliveries.filter((d) => d.status === 'IN_TRANSIT').length,
    completed: deliveries.filter((d) => ['DELIVERED', 'PARTIALLY_DELIVERED', 'CANCELLED', 'FAILED'].includes(d.status)).length,
    total: deliveries.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-sky-600 mx-auto mb-4"></div>
            <Truck className="h-6 w-6 text-sky-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-600 text-sm">{t('Driver.routes.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="bg-white border border-red-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 h-10 w-10 bg-red-50 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="font-semibold text-red-900">Ошибка: {error}</p>
            </div>
            <button
              onClick={fetchDeliveries}
              className="w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-all inline-flex items-center justify-center gap-2 font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{t('Driver.routes.retryButton')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Pending */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">{t('Driver.routes.stats.pending')}</span>
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.pending}</div>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-400 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* In Transit */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">{t('Driver.routes.stats.inTransit')}</span>
              <Truck className="h-4 w-4 text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.inTransit}</div>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-600 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.inTransit / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">{t('Driver.routes.stats.completed')}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.completed}</div>
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-500">{t('Driver.routes.stats.total')}</span>
              <Package className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'in_transit', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-all text-sm inline-flex items-center gap-2 shadow-sm',
                  filter === f
                    ? 'bg-sky-600 text-white hover:bg-sky-700'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                )}
              >
                {f === 'all' && <List className="h-4 w-4" />}
                {f === 'pending' && <Clock className="h-4 w-4" />}
                {f === 'in_transit' && <Truck className="h-4 w-4" />}
                {f === 'completed' && <CheckCircle2 className="h-4 w-4" />}
                <span>
                  {f === 'all'
                    ? t('Driver.routes.filters.all')
                    : f === 'pending'
                      ? t('Driver.routes.filters.pending')
                      : f === 'in_transit'
                        ? t('Driver.routes.filters.inTransit')
                        : t('Driver.routes.filters.completed')}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Deliveries List */}
        {filteredDeliveries.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('Driver.routes.noDeliveries')}</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                {t('Driver.routes.emptyMessage')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDeliveries.map((delivery) => {
              // Group items by branch
              interface BranchGroup {
                branch?: {
                  id: string;
                  branchName: string;
                  fullName: string;
                  deliveryAddress: string;
                  latitude?: number;
                  longitude?: number;
                  contactPerson?: string;
                  phone?: string;
                };
                items: FlattenedDelivery['order']['orderItems'];
              }

              const itemsByBranch = delivery.order.orderItems.reduce(
                (acc: Record<string, BranchGroup>, item) => {
                  const branchId = item.branch?.id || 'no-branch';
                  if (!acc[branchId]) {
                    acc[branchId] = {
                      branch: item.branch,
                      items: [],
                    };
                  }
                  acc[branchId].items.push(item);
                  return acc;
                },
                {}
              );

              const branches = Object.values(itemsByBranch);

              return (
                <div
                  key={delivery.id}
                  className={cn(
                    'bg-white border-2 rounded-lg p-6 shadow-sm hover:shadow-md transition-all',
                    getDeliveryStatusBorderColor(delivery.status)
                  )}
                >
                  {/* Header: Order Number + Status */}
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      {getDeliveryStatusIcon(delivery.status)}
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">
                          {t('Driver.routes.deliveryCard.orderNumber')} {delivery.orderNumber}
                        </h3>
                        <Badge
                          variant="outline"
                          className={cn('mt-1', getDeliveryStatusBadgeColor(delivery.status))}
                        >
                          {getDeliveryStatusLabel(delivery.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Destinations */}
                  {branches.map((branch, idx) => (
                    <div key={branch.branch?.id || `branch-${idx}`} className="mb-4">
                      {/* Destination Branch */}
                      <div className="bg-slate-50 p-4 rounded-lg mb-3 border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-slate-600" />
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('Driver.routes.deliveryCard.destination')}</p>
                        </div>
                        <p className="font-bold text-slate-900 text-base">
                          {branch.branch?.branchName || 'Неизвестный филиал'}
                        </p>
                        <p className="text-sm text-slate-600">
                          {branch.branch?.fullName || ''}
                        </p>

                        {/* Address with icon */}
                        {branch.branch?.deliveryAddress && (
                          <div className="flex items-start gap-2 mt-2 text-sm text-slate-600">
                            <Navigation className="h-4 w-4 mt-0.5 text-slate-400 flex-shrink-0" />
                            <span>{branch.branch.deliveryAddress}</span>
                          </div>
                        )}

                        {/* Contact with icons */}
                        {branch.branch?.contactPerson && (
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              <span>{branch.branch.contactPerson}</span>
                            </div>
                            {branch.branch.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span>{branch.branch.phone}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Items to Deliver */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-slate-600" />
                          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t('Driver.routes.deliveryCard.items')}</p>
                        </div>
                        <div className="space-y-1">
                          {branch.items.map((item) => (
                            <div key={item.id} className="flex justify-between py-1 text-sm">
                              <span className="text-slate-700">{item.product.name}</span>
                              <span className="font-bold text-slate-900 tabular-nums">
                                {item.quantity} {item.product.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Vehicle & Route Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4 pb-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 mt-4">
                      <Truck className="h-4 w-4 text-slate-400" />
                      <span>{delivery.vehicle.plateNumber} ({delivery.vehicle.model})</span>
                    </div>
                    {!delivery.route?.isStandalone && (
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4 text-slate-400" />
                        <span>
                          {t('Driver.routes.deliveryCard.route')} <span className="font-semibold text-slate-900">{delivery.route?.name}</span>
                        </span>
                        {delivery.stopNumber && (
                          <Badge variant="outline" className="ml-1 border-slate-200 text-slate-600 bg-white">
                            {t('Driver.routes.deliveryCard.stopNumber')} {delivery.stopNumber}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href={`/driver/navigate?deliveryId=${delivery.deliveryId}`}
                      className="flex-1 px-4 py-2.5 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all shadow-sm hover:shadow inline-flex items-center justify-center gap-2"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>{t('Driver.routes.deliveryCard.navigation')}</span>
                    </Link>
                    <Link
                      href={`/${locale}/driver/delivery/${delivery.deliveryId}`}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-sm hover:shadow inline-flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{t('Driver.routes.deliveryCard.confirm')}</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-900">{t('Driver.routes.help.title')}</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {/* View Orders */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-10 w-10 bg-sky-50 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">{t('Driver.routes.help.step1')}</p>
                <p className="text-sm text-slate-600">{t('Driver.routes.help.step2')}</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-10 w-10 bg-sky-50 rounded-lg flex items-center justify-center">
                <Navigation className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">{t('Driver.routes.help.step3')}</p>
                <p className="text-sm text-slate-600">
                  {t('Driver.routes.help.step4')}
                </p>
              </div>
            </div>

            {/* Confirmation */}
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-10 w-10 bg-sky-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-1">{t('Driver.routes.help.step5')}</p>
                <p className="text-sm text-slate-600">
                  {t('Driver.routes.deliveryCard.confirm')} {t('Driver.delivery.wizard.digitalSignature.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
