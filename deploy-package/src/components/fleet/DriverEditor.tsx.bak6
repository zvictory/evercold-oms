"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Save, User, FileText, Calendar as CalendarIcon, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { formatDate } from "@/lib/date-utils"

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
    RadioGroup,
    RadioGroupItem
} from "@/components/ui/radio-group"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

const driverSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^\+998[0-9]{9}$/, "Invalid format. Use: +998901234567"),
    telegram: z.string().optional(),
    licenseNumber: z.string().min(1, "License number is required"),
    licenseExpiry: z.date().refine((date) => date > new Date(), "Expiry date must be in the future"),
    status: z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE"]),
    photoUrl: z.string().optional(), // Mocking photo upload for now
})

type DriverFormValues = z.infer<typeof driverSchema>

interface DriverEditorProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: any // Replace with proper type
    onSave: (data: DriverFormValues) => void
}

export function DriverEditor({ open, onOpenChange, initialData, onSave }: DriverEditorProps) {
    const defaultValues: DriverFormValues = {
        name: "",
        phone: "+998",
        telegram: "",
        licenseNumber: "",
        licenseExpiry: undefined as unknown as Date,
        status: "ACTIVE",
        photoUrl: ""
    }

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<DriverFormValues>({
        resolver: zodResolver(driverSchema),
        defaultValues
    })

    const watchedExpiry = watch("licenseExpiry")
    const watchedStatus = watch("status")

    useEffect(() => {
        if (open) {
            if (initialData) {
                reset({
                    name: initialData.name,
                    phone: initialData.phone,
                    telegram: initialData.telegram || "",
                    licenseNumber: initialData.licenseNumber,
                    // Parse string date to Date object if needed
                    licenseExpiry: initialData.licenseExpiry ? new Date(initialData.licenseExpiry) : undefined,
                    status: initialData.status,
                    photoUrl: initialData.photoUrl || ""
                })
            } else {
                reset(defaultValues)
            }
        }
    }, [open, initialData, reset])

    const onSubmit = (data: DriverFormValues) => {
        onSave(data)
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-md overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{initialData ? "Edit Driver" : "Driver Profile"}</SheetTitle>
                    <SheetDescription>
                        {initialData ? `Update credentials for ${initialData.name}` : "Onboard a new driver to your fleet."}
                    </SheetDescription>
                </SheetHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-6">

                    {/* Personal Info Group */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <User className="h-4 w-4" /> Personal Info
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="John Doe"
                                {...register("name")}
                                className={cn(errors.name && "border-red-500 focus-visible:ring-red-500")}
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    placeholder="+998..."
                                    {...register("phone")}
                                    className={cn(errors.phone && "border-red-500 focus-visible:ring-red-500")}
                                />
                                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="telegram">Telegram</Label>
                                <Input
                                    id="telegram"
                                    placeholder="@username"
                                    {...register("telegram")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-4" />

                    {/* Credentials Group */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Credentials
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="license">License Number</Label>
                            <Input
                                id="license"
                                className="font-mono uppercase"
                                placeholder="AA 1234567"
                                {...register("licenseNumber")}
                            />
                            {errors.licenseNumber && <p className="text-xs text-red-500">{errors.licenseNumber.message}</p>}
                        </div>

                        <div className="space-y-2 flex flex-col">
                            <Label>Expiry Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !watchedExpiry && "text-muted-foreground",
                                            errors.licenseExpiry && "border-red-500 text-red-500"
                                        )}
                                    >
                                        {watchedExpiry ? (
                                            formatDate(watchedExpiry)
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={watchedExpiry}
                                        onSelect={(date) => setValue("licenseExpiry", date as Date)}
                                        disabled={(date) =>
                                            date < new Date() || date < new Date("1900-01-01")
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.licenseExpiry && <p className="text-xs text-red-500">{errors.licenseExpiry.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label>License Photo</Label>
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-2 bg-slate-100 rounded-full group-hover:bg-slate-200">
                                        <Upload className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">Click to upload or drag & drop</p>
                                    <p className="text-[10px] text-slate-400">SVG, PNG, JPG (max 2MB)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100 my-4" />

                    {/* Status Group */}
                    <div className="space-y-4">
                        <Label>Employment Status</Label>
                        <RadioGroup
                            defaultValue="ACTIVE"
                            value={watchedStatus}
                            onValueChange={(val: any) => setValue("status", val)}
                            className="grid grid-cols-3 gap-4"
                        >
                            <div>
                                <RadioGroupItem value="ACTIVE" id="active" className="peer sr-only" />
                                <Label
                                    htmlFor="active"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-200 bg-transparent p-4 hover:bg-slate-50 peer-data-[state=checked]:border-sky-500 peer-data-[state=checked]:bg-sky-50 cursor-pointer text-center h-full"
                                >
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 mb-2" />
                                    Active
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="ON_LEAVE" id="on_leave" className="peer sr-only" />
                                <Label
                                    htmlFor="on_leave"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-200 bg-transparent p-4 hover:bg-slate-50 peer-data-[state=checked]:border-amber-500 peer-data-[state=checked]:bg-amber-50 cursor-pointer text-center h-full"
                                >
                                    <span className="h-2 w-2 rounded-full bg-amber-500 mb-2" />
                                    On Leave
                                </Label>
                            </div>
                            <div>
                                <RadioGroupItem value="INACTIVE" id="inactive" className="peer sr-only" />
                                <Label
                                    htmlFor="inactive"
                                    className="flex flex-col items-center justify-between rounded-md border-2 border-slate-200 bg-transparent p-4 hover:bg-slate-50 peer-data-[state=checked]:border-slate-500 peer-data-[state=checked]:bg-slate-100 cursor-pointer text-center h-full"
                                >
                                    <span className="h-2 w-2 rounded-full bg-slate-500 mb-2" />
                                    Inactive
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>


                    <SheetFooter className="pt-4">
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-sky-600 hover:bg-sky-700 text-white">
                            {isSubmitting ? "Saving..." : "Save Profile"}
                        </Button>
                    </SheetFooter>

                </form>
            </SheetContent>
        </Sheet>
    )
}
