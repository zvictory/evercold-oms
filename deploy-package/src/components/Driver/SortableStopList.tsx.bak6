'use client';

import React, { useState } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MapPin } from 'lucide-react';
import { updateStopOrder } from '@/app/actions/driver/update-stops';
import { useI18n } from '@/locales/client';
import { resolveDisplayBranch } from '@/lib/utils';

interface Stop {
    id: string;
    stopNumber: number;
    delivery: {
        order: {
            orderNumber: string;
            customer: {
                name: string;
                address?: string;
                _count?: { branches: number };
            }
            orderItems: Array<{
                branch?: { branchName?: string }
            }>
        }
    }
}

interface SortableStopListProps {
    stops: Stop[];
    routeId: string;
    onOrderChanged?: () => void;
    onStopClick?: (stop: Stop) => void;
}

function SortableItem({ stop, onStopClick }: { stop: Stop; onStopClick?: (stop: Stop) => void }) {
    const t = useI18n();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: stop.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 touch-none mb-3 ${isDragging ? 'shadow-lg ring-2 ring-sky-500' : ''}`}
        >
            <div {...attributes} {...listeners} className="text-slate-400 cursor-grab active:cursor-grabbing p-1">
                <GripVertical className="h-5 w-5" />
            </div>

            <div
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => onStopClick?.(stop)}
            >
                <div className="h-10 w-10 bg-sky-50 rounded-full flex items-center justify-center shrink-0 font-bold text-sky-600">
                    {stop.stopNumber}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">
                        {stop.delivery.order.customer.name}
                    </h4>
                    {stop.delivery.order.orderItems[0]?.branch?.branchName && (
                        <p className="text-xs text-slate-400 truncate">{resolveDisplayBranch(
                            stop.delivery.order.orderItems[0].branch.branchName,
                            stop.delivery.order.customer.name,
                            stop.delivery.order.customer._count?.branches
                        )}</p>
                    )}
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {t('Driver.sortableList.orderNumber')}{stop.delivery.order.orderNumber}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function SortableStopList({ stops, routeId, onOrderChanged, onStopClick }: SortableStopListProps) {
    const [items, setItems] = useState(stops);
    const [isUpdating, setIsUpdating] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Optimistically update stop numbers locally
                const updatedItems = newItems.map((item, index) => ({
                    ...item,
                    stopNumber: index + 1
                }));

                // Fire and forget update (handled by optimistic UI mostly, but good to sync)
                handleServerUpdate(updatedItems, routeId);

                return updatedItems;
            });
        }
    };

    const handleServerUpdate = async (newItems: Stop[], routeId: string) => {
        setIsUpdating(true);
        try {
            const stopIds = newItems.map(s => s.id);
            await updateStopOrder({ routeId, stopIds });
            onOrderChanged?.();
        } catch (error) {
            console.error("Failed to update stop order", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map(s => s.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-3 pb-24">
                    {items.map((stop: Stop) => (
                        <SortableItem key={stop.id} stop={stop} onStopClick={onStopClick} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
