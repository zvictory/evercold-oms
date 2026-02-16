"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { EntityFormLayout } from "@/components/common/EntityFormLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchWithAuth } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Upload, Calendar, Building2, User, FileText, CheckCircle2 } from "lucide-react"

// --- Zod Schema ---
const customerSchema = z.object({
    // Section 1: Organization
    name: z.string().min(2, "Company name must be at least 2 characters"),
    customerCode: z.string().min(3, "Code must be at least 3 characters"),

    // Section 2: Legal
    taxId: z.string().regex(/^\d{9}$/, "INN must be exactly 9 digits"),
    vatCode: z.string().optional(),
    bankMfo: z.string().regex(/^\d{5}$/, "MFO must be 5 digits").optional().or(z.literal('')),
    bankAccount: z.string().min(20, "Account number must be 20 digits").optional().or(z.literal('')),
    hasVat: z.boolean(),
    taxStatus: z.string().optional(),
    customerGroupId: z.string().optional(),

    // Section 3: Contact
    contactName: z.string().min(2, "Contact name required"),
    contactPhone: z.string().min(9, "Phone number required"),
    contactEmail: z.string().email("Invalid email address").optional().or(z.literal('')),
    telegram: z.string().optional(),

    // Section 4: Contract
    contractNumber: z.string().min(1, "Contract number required"),
    contractDate: z.string().min(1, "Contract date required"),
})

type CustomerFormValues = z.infer<typeof customerSchema>

export default function NewCustomerPage() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale || 'ru'
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [customerGroups, setCustomerGroups] = React.useState<Array<{ id: string; name: string }>>([])

    React.useEffect(() => {
        fetchWithAuth('/api/customer-groups')
            .then(res => res.json())
            .then(data => setCustomerGroups(data.groups || []))
            .catch(() => {})
    }, [])

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            hasVat: false,
            taxStatus: 'VAT_PAYER',
            customerGroupId: '',
            contractDate: new Date().toISOString().split('T')[0]
        },
        mode: "onChange" // Real-time validation
    })

    // Watch for auto-generating code based on name
    const nameValue = form.watch("name")

    React.useEffect(() => {
        if (nameValue && !form.getValues("customerCode")) {
            // Simple auto-generation logic
            const code = nameValue.replace(/\s+/g, '-').toUpperCase().substring(0, 8);
            form.setValue("customerCode", code)
        }
    }, [nameValue, form])

    const onSubmit = async (data: CustomerFormValues) => {
        setIsSubmitting(true)
        try {
            // Simulate API call
            console.log("Submitting:", data)
            await new Promise(resolve => setTimeout(resolve, 1000))

            // TODO: Integrate actual API
            // const response = await fetch('/api/customers', { ... })

            router.push(`/${locale}/customers`)
        } catch (error) {
            console.error("Failed to create customer", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <EntityFormLayout
            title="Onboard New Customer"
            subtitle="Create a new B2B organization profile."
            backHref="/customers"
            actions={
                <>
                    <Button variant="ghost" onClick={() => router.back()} className="text-slate-600">
                        Cancel
                    </Button>
                    <Button
                        onClick={form.handleSubmit(onSubmit)}
                        disabled={isSubmitting || !form.formState.isValid}
                        className="bg-sky-600 hover:bg-sky-700 text-white min-w-[140px]"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Create Customer
                            </>
                        )}
                    </Button>
                </>
            }
        >
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* Section 1: Organization Details */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <Building2 className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Organization Details</h3>
                    </div>
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-6 grid gap-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Company Name *</label>
                                    <Input
                                        {...form.register("name")}
                                        placeholder="e.g. Korzinka HQ"
                                        className={`bg-white border-slate-200 h-10 ${form.formState.errors.name ? 'border-red-300 focus-visible:ring-red-200' : 'focus-visible:ring-sky-500'}`}
                                    />
                                    {form.formState.errors.name && (
                                        <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Official Code</label>
                                    <Input
                                        {...form.register("customerCode")}
                                        placeholder="AUTO-GENERATED"
                                        className="bg-slate-50 border-slate-200 font-mono h-10"
                                    />
                                    {form.formState.errors.customerCode && (
                                        <p className="text-xs text-red-500">{form.formState.errors.customerCode.message}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Company Logo</label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                                        <Upload className="h-5 w-5 text-slate-400 group-hover:text-indigo-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-900">Click to upload or drag and drop</p>
                                    <p className="text-xs text-slate-500 mt-1">SVG, PNG, JPG (max. 2MB)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 2: Legal & Financial */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <FileText className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Legal & Financial</h3>
                    </div>
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-6 grid gap-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">INN (Tax ID) *</label>
                                    <Input
                                        {...form.register("taxId")}
                                        placeholder="9-digit INN"
                                        maxLength={9}
                                        className={`bg-white border-slate-200 font-mono h-10 ${form.formState.errors.taxId ? 'border-red-300' : ''}`}
                                    />
                                    {form.formState.errors.taxId && (
                                        <p className="text-xs text-red-500">{form.formState.errors.taxId.message}</p>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Tax Status</label>
                                        <Select
                                            value={form.watch("taxStatus")}
                                            onValueChange={(value: 'VAT_PAYER' | 'EXEMPT') => {
                                                form.setValue("taxStatus", value)
                                                form.setValue("hasVat", value === 'VAT_PAYER')
                                            }}
                                        >
                                            <SelectTrigger className="bg-white border-slate-200 h-10">
                                                <SelectValue placeholder="Select tax status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="VAT_PAYER">VAT Payer (12%)</SelectItem>
                                                <SelectItem value="EXEMPT">Exempt</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {form.watch("taxStatus") === 'VAT_PAYER' && (
                                        <Input
                                            {...form.register("vatCode")}
                                            placeholder="VAT Code (Optional)"
                                            className="bg-white border-slate-200 h-10"
                                        />
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">Customer Group</label>
                                        <Select
                                            value={form.watch("customerGroupId") || '_none'}
                                            onValueChange={(value) => form.setValue("customerGroupId", value === '_none' ? '' : value)}
                                        >
                                            <SelectTrigger className="bg-white border-slate-200 h-10">
                                                <SelectValue placeholder="No group assigned" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="_none">No group</SelectItem>
                                                {customerGroups.map(group => (
                                                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-slate-500">Assigns group-level pricing tier</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">MFO</label>
                                    <Input
                                        {...form.register("bankMfo")}
                                        placeholder="00000"
                                        className="bg-white border-slate-200 font-mono h-10"
                                        maxLength={5}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Bank Account Number</label>
                                    <Input
                                        {...form.register("bankAccount")}
                                        placeholder="20208000..."
                                        className="bg-white border-slate-200 font-mono h-10"
                                        maxLength={20}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 3: Primary Contact */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <User className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Primary Contact</h3>
                    </div>
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Contact Name *</label>
                                <Input
                                    {...form.register("contactName")}
                                    placeholder="Full Name"
                                    className="bg-white border-slate-200 h-10"
                                />
                                {form.formState.errors.contactName && (
                                    <p className="text-xs text-red-500">{form.formState.errors.contactName.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Phone Number *</label>
                                <Input
                                    {...form.register("contactPhone")}
                                    placeholder="+998"
                                    className="bg-white border-slate-200 h-10 font-mono"
                                />
                                {form.formState.errors.contactPhone && (
                                    <p className="text-xs text-red-500">{form.formState.errors.contactPhone.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email Address</label>
                                <Input
                                    {...form.register("contactEmail")}
                                    type="email"
                                    placeholder="user@company.com"
                                    className="bg-white border-slate-200 h-10"
                                />
                                {form.formState.errors.contactEmail && (
                                    <p className="text-xs text-red-500">{form.formState.errors.contactEmail.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Telegram Username</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400">@</span>
                                    <Input
                                        {...form.register("telegram")}
                                        placeholder="username"
                                        className="bg-white border-slate-200 h-10 pl-7"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 4: Contract Data */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                            <FileText className="h-4 w-4" />
                        </div>
                        <h3 className="text-xs font-bold tracking-wider text-slate-500 uppercase">Contract Data</h3>
                    </div>
                    <Card className="border-slate-200 shadow-sm">
                        <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Contract Number *</label>
                                <Input
                                    {...form.register("contractNumber")}
                                    placeholder="e.g. CTR-2024-001"
                                    className="bg-white border-slate-200 h-10 font-mono"
                                />
                                {form.formState.errors.contractNumber && (
                                    <p className="text-xs text-red-500">{form.formState.errors.contractNumber.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Start Date *</label>
                                <div className="relative">
                                    <Input
                                        {...form.register("contractDate")}
                                        type="date"
                                        className="bg-white border-slate-200 h-10 font-mono"
                                    />
                                    <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-slate-700">Contract File</label>
                                <Input type="file" className="bg-white border-slate-200 h-10 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100" />
                            </div>
                        </CardContent>
                    </Card>
                </section>

            </form>
        </EntityFormLayout>
    )
}
