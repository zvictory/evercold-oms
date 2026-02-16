"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Save, Truck, Info, Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const vehicleSchema = z.object({
    plateNumber: z.string().regex(/^[0-9]{2} [0-9]{3} [A-Z]{3}$/, "Invalid format. Use: 01 123 ABC"),
    model: z.string().optional(), // NOW OPTIONAL - will default to "Not Specified"
    type: z.enum(["VAN", "TRUCK", "REFRIGERATED_VAN", "REFRIGERATED_TRUCK"]).optional().default("VAN"),
    status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"]).optional().default("AVAILABLE"),
    capacity: z.preprocess(
        (val) => {
            // Handle empty string, null, undefined
            if (val === "" || val === null || val === undefined) return undefined
            // Convert to number if needed
            const num = typeof val === 'number' ? val : Number(val)
            // Return undefined if NaN, otherwise return the number
            return isNaN(num) ? undefined : num
        },
        z.number().positive().optional()
    ), // Transform empty/invalid values to undefined
    driverId: z.string().optional(),
})

type VehicleFormValues = z.infer<typeof vehicleSchema>

interface Driver {
    id: string
    name: string
}

interface VehicleEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: any // Replace with proper type if available
    drivers: Driver[]
    onSave: (data: VehicleFormValues) => void
}

export function VehicleEditor({ open, onOpenChange, initialData, drivers, onSave }: VehicleEditorProps) {
    const [driverOpen, setDriverOpen] = useState(false)

    const defaultValues: VehicleFormValues = {
        plateNumber: "",
        model: "",
        type: "VAN",
        status: "AVAILABLE", // Default status
        capacity: undefined, // Optional field
        driverId: undefined
    }

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<VehicleFormValues>({
        resolver: zodResolver(vehicleSchema),
        defaultValues
    })

    // Watch values for controlled components
    const watchedType = watch("type")
    const watchedStatus = watch("status")
    const watchedDriverId = watch("driverId")

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    plateNumber: initialData.plateNumber,
                    model: initialData.model,
                    type: initialData.type,
                    status: initialData.status,
                    capacity: initialData.capacity || 0,
                    driverId: initialData.driverId || undefined
                })
            } else {
                reset(defaultValues)
            }
        }
    }, [open, initialData, reset])

    const onSubmit = (data: VehicleFormValues) => {
        onSave(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{initialData ? "Edit Vehicle" : "Add New Vehicle"}</SheetTitle>
                    <SheetDescription>
                        {initialData ? `Update details for ${initialData.plateNumber}` : "Add a new unit to your logistics fleet."}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-6">

                    {/* Identity Group */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Vehicle Identity
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="plate">Plate Number</Label>
                            <Input
                                id="plate"
                                placeholder="01 123 ABC"
                                className={cn("font-mono uppercase", errors.plateNumber && "border-red-500 focus-visible:ring-red-500")}
                                {...register("plateNumber")}
                            />
                            {errors.plateNumber && <p className="text-xs text-red-500">{errors.plateNumber.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Model (Optional)</Label>
                                <Select
                                    value={watch("model")}
                                    onValueChange={(val) => setValue("model", val)}
                                >
                                    <SelectTrigger className={cn(errors.model && "border-red-500 ring-red-500")}>
                                        <SelectValue placeholder="Select model (defaults to Not Specified)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="Damas">Damas</SelectItem>
                                            <SelectItem value="Labo">Labo</SelectItem>
                                            <SelectItem value="Isuzu">Isuzu</SelectItem>
                                            <SelectItem value="Gazelle">Gazelle</SelectItem>
                                            <SelectItem value="Ford Transit">Ford Transit</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                {errors.model && <p className="text-xs text-red-500">{errors.model.message}</p>}
                                {/* Hidden input for validation if needed, simply relying on setValue for now */}
                            </div>

                            <div className="space-y-2">
                                <Label>Type (Optional, defaults to Van)</Label>
                                <Select
                                    value={watchedType}
                                    onValueChange={(val: any) => setValue("type", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="VAN">Van</SelectItem>
                                        <SelectItem value="TRUCK">Truck</SelectItem>
                                        <SelectItem value="REFRIGERATED_VAN">Ref. Van</SelectItem>
                                        <SelectItem value="REFRIGERATED_TRUCK">Ref. Truck</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-4" />

                    {/* Operational Group */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Info className="h-4 w-4" /> Operational Status
                        </h3>

                        <div className="space-y-2">
                            <Label>Current Status (Optional, defaults to Available)</Label>
                            <Select
                                value={watchedStatus}
                                onValueChange={(val: any) => setValue("status", val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AVAILABLE">
                                        <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Available</span>
                                    </SelectItem>
                                    <SelectItem value="IN_USE">
                                        <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-sky-500" /> In Use</span>
                                    </SelectItem>
                                    <SelectItem value="MAINTENANCE">
                                        <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amber-500" /> Maintenance</span>
                                    </SelectItem>
                                    <SelectItem value="RETIRED">
                                        <span className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-slate-500" /> Retired</span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="capacity">Load Capacity (kg) (Optional)</Label>
                            <Input
                                id="capacity"
                                type="number"
                                {...register("capacity", { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-4" />

                    {/* Assignment Group */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Assignment
                        </h3>

                        <div className="flex flex-col space-y-2">
                            <Label>Default Driver</Label>
                            <Popover open={driverOpen} onOpenChange={setDriverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={driverOpen}
                                        className="w-full justify-between font-normal"
                                    >
                                        {watchedDriverId
                                            ? drivers.find((driver) => driver.id === watchedDriverId)?.name
                                            : "Select driver..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0">
                                    <Command>
                                        <CommandInput placeholder="Search driver..." />
                                        <CommandEmpty>No driver found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="unassigned"
                                                onSelect={() => {
                                                    setValue("driverId", undefined)
                                                    setDriverOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        !watchedDriverId ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                Unassigned
                                            </CommandItem>
                                            {drivers.map((driver) => (
                                                <CommandItem
                                                    key={driver.id}
                                                    value={driver.name}
                                                    onSelect={() => {
                                                        setValue("driverId", driver.id === watchedDriverId ? undefined : driver.id)
                                                        setDriverOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            watchedDriverId === driver.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {driver.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <SheetFooter className="pt-4">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </SheetFooter>

                </form>
            </SheetContent>
        </Sheet>
    )
}
