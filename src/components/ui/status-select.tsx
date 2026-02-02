"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface StatusOption {
    value: string;
    label: string;
    color: string;
}

const defaultStatuses: StatusOption[] = [
    { value: "ALL", label: "All Statuses", color: "bg-slate-400" },
    { value: "NEW", label: "New", color: "bg-blue-500" },
    { value: "CONFIRMED", label: "Confirmed", color: "bg-purple-500" },
    { value: "IN_PRODUCTION", label: "In Production", color: "bg-amber-500" },
    { value: "SHIPPED", label: "Shipped", color: "bg-indigo-500" },
    { value: "DELIVERED", label: "Delivered", color: "bg-emerald-500" },
    { value: "CANCELLED", label: "Cancelled", color: "bg-red-500" },
]

interface StatusSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
    statuses?: StatusOption[];
}

export function StatusSelect({
    value,
    onValueChange,
    className,
    statuses = defaultStatuses
}: StatusSelectProps) {
    const currentStatus = statuses.find((s) => s.value === value) || statuses[0]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn("w-[180px] justify-between h-10 border-slate-200 bg-white", className)}
                >
                    <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", currentStatus.color)} />
                        <span className="truncate">{currentStatus.label}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[180px]">
                {statuses.map((status) => (
                    <DropdownMenuItem
                        key={status.value}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => onValueChange(status.value)}
                    >
                        <div className="flex items-center gap-2">
                            <div className={cn("h-2 w-2 rounded-full", status.color)} />
                            <span>{status.label}</span>
                        </div>
                        {value === status.value && <Check className="h-4 w-4 text-sky-600" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
