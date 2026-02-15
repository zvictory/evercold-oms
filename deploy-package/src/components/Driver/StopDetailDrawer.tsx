'use client';

import { Drawer } from 'vaul';
import { Package, MapPin, Phone, X, Navigation } from 'lucide-react';
import { useI18n } from '@/locales/client';

interface StopDetailDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stop: any;
}

export function StopDetailDrawer({ open, onOpenChange, stop }: StopDetailDrawerProps) {
    const t = useI18n();

    if (!stop) return null;

    const order = stop.delivery.order;
    const items = order.orderItems;
    const branch = items[0]?.branch;
    const customer = order.customer;

    const totalWeight = items.reduce((acc: number, item: any) => {
        const weightPerUnit = item.sapCode?.includes('-00001') ? 3 : (item.sapCode?.includes('-00006') || item.productName?.includes('1кг')) ? 1 : 0;
        return acc + (weightPerUnit * item.quantity);
    }, 0);

    const handleNavigate = () => {
        if (branch?.latitude && branch?.longitude) {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const url = isMobile
                ? `yandexmaps://maps.yandex.ru/?pt=${branch.longitude},${branch.latitude}&z=16&l=map`
                : `https://yandex.com/maps/?pt=${branch.longitude},${branch.latitude}&z=16&l=map`;
            window.open(url, '_blank');
        }
    };

    return (
        <Drawer.Root open={open} onOpenChange={onOpenChange}>
            <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content className="bg-white flex flex-col rounded-t-[10px] h-[85vh] fixed bottom-0 left-0 right-0 z-50">
                    <Drawer.Title className="sr-only">{customer.name}</Drawer.Title>
                    <div className="p-4 bg-white rounded-t-[10px] flex-1 overflow-y-auto">
                        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mb-6" />

                        <div className="max-w-md mx-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-1">
                                        {customer.name}
                                    </h2>
                                    <p className="text-slate-500 font-medium flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {t('Driver.stopDetail.orderNumber')}{order.orderNumber}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onOpenChange(false)}
                                    className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                <button
                                    onClick={handleNavigate}
                                    className="flex items-center justify-center gap-2 bg-sky-600 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform"
                                >
                                    <Navigation className="h-5 w-5" />
                                    {t('Driver.stopDetail.yandexNav')}
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 py-3 rounded-xl font-bold active:scale-95 transition-transform">
                                    <Phone className="h-5 w-5" />
                                    {t('Driver.route.call')}
                                </button>
                            </div>

                            {/* Order Info Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{t('Driver.stopDetail.totalWeight')}</p>
                                    <p className="text-2xl font-bold text-slate-900">{totalWeight} kg</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">{t('Driver.stopDetail.items')}</p>
                                    <p className="text-2xl font-bold text-slate-900">{items.length}</p>
                                </div>
                            </div>

                            {/* Items List */}
                            <h3 className="font-bold text-slate-900 mb-4 text-lg">{t('Driver.stopDetail.orderItems')}</h3>
                            <div className="space-y-3 pb-8">
                                {items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{item.product.name}</p>
                                            <p className="text-xs text-slate-400">{item.sapCode || t('Driver.stopDetail.noSapCode')}</p>
                                        </div>
                                        <div className="font-bold text-lg text-slate-700">
                                            {item.quantity}
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    );
}
