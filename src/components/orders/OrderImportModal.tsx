"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, UploadCloud, FileCheck, AlertCircle, ChevronDown, CheckCircle2 } from "lucide-react"
enum ImportState {
    IDLE = "idle",
    UPLOADING = "uploading",
    PROCESSING = "processing",
    COMPLETE = "complete",
    ERROR = "error"
}

interface OrderImportModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onImportComplete?: () => void
}

export function OrderImportModal({ open, onOpenChange, onImportComplete }: OrderImportModalProps) {
    const [state, setState] = React.useState<ImportState>(ImportState.IDLE)
    const [progress, setProgress] = React.useState(0)
    const [fileName, setFileName] = React.useState<string | null>(null)
    const [isGuidanceOpen, setIsGuidanceOpen] = React.useState(false)
    const [uploadResult, setUploadResult] = React.useState<{
        ordersCreated: number
        ordersSkipped: number
        batchId?: string
    } | null>(null)
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

    // Translation fallbacks (temporary until i18n is fixed)
    const t = (key: string): string => {
        const translations: Record<string, string> = {
            "title": "Импорт заказов",
            "description": "Импортируйте заказы из файла Excel",
            "uploadArea": "Нажмите для загрузки или перетащите файл",
            "supportedFormats": "Поддерживаемые форматы: .xlsx, .xls",
            "importingText": "Импорт...",
            "formatRequirements": "Требования к формату",
            "detailedFormat": "Детальный формат",
            "registryFormat": "Формат реестра",
            "success": "Успешно",
            "successCount": "Успешно обработано",
            "error": "Ошибка",
            "uploadButton": "Отмена",
            "importButton": "Импортировать",
        }
        return translations[key] || key
    }

    // Track mounted state
    const isMountedRef = React.useRef(true)

    React.useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    // Reset state when modal opens
    React.useEffect(() => {
        if (open) {
            resetState()
        }
    }, [open])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileName(file.name)
        setState(ImportState.UPLOADING)
        setProgress(0)
        setErrorMessage(null)
        setUploadResult(null)

        try {
            const formData = new FormData()
            formData.append('file', file)

            // Simulate progress during upload
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 90))
            }, 200)

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            clearInterval(progressInterval)
            setProgress(100)

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Upload failed')
            }

            const result = await response.json()
            setUploadResult(result)
            setState(ImportState.COMPLETE)

        } catch (error: any) {
            console.error('Upload error:', error)

            // Only update state if component is still mounted
            if (!isMountedRef.current) return

            setErrorMessage(error.message || 'An error occurred during upload')
            setState(ImportState.ERROR)
        }
    }

    const resetState = () => {
        setState(ImportState.IDLE)
        setProgress(0)
        setFileName(null)
        setUploadResult(null)
        setErrorMessage(null)
        setIsGuidanceOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t("title")}</DialogTitle>
                    <DialogDescription>
                        {t("description")}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* State: IDLE or UPLOADING */}
                    {(state === ImportState.IDLE || state === ImportState.UPLOADING) && (
                        <div className="group relative border-2 border-dashed border-slate-200 hover:border-sky-400 hover:bg-sky-50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="h-12 w-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud className="h-6 w-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900">
                                {t("uploadArea")}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {t("supportedFormats")}
                            </p>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {state === ImportState.UPLOADING && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-600">
                                <span>{t("importingText")}</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {/* FORMAT GUIDE - Collapsible */}
                    {state === ImportState.IDLE && (
                        <Collapsible open={isGuidanceOpen} onOpenChange={setIsGuidanceOpen} className="border border-slate-200 rounded-lg bg-slate-50/50">
                            <CollapsibleTrigger asChild>
                                <Button variant="ghost" className="flex w-full justify-between p-3 h-auto font-normal text-slate-600 hover:text-slate-900">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4" />
                                        <span>{t("formatRequirements")}</span>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isGuidanceOpen ? 'rotate-180' : ''}`} />
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-3 pb-3 pt-0 text-xs text-slate-500 space-y-2">
                                <div className="p-2 bg-white rounded border border-slate-100">
                                    <p className="font-semibold text-slate-700 mb-1">{t("detailedFormat")}</p>
                                    <p>Стандартный формат экспорта. Должен содержать заголовки: <code className="bg-slate-100 px-1 rounded">Код филиала</code>, <code className="bg-slate-100 px-1 rounded">SKU товара</code>, <code className="bg-slate-100 px-1 rounded">Количество</code>.</p>
                                </div>
                                <div className="p-2 bg-white rounded border border-slate-100">
                                    <p className="font-semibold text-slate-700 mb-1">{t("registryFormat")}</p>
                                    <p>Перекрёстный формат. Строки = Филиалы, Колонки = Даты/Товары.</p>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )}

                    {/* State: COMPLETE */}
                    {state === ImportState.COMPLETE && uploadResult && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-emerald-900">{t("success")}</h3>
                                    <p className="text-xs text-emerald-700 mt-1">
                                        Обработан файл <strong>{fileName}</strong>
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mt-4 bg-white/50 p-3 rounded border border-emerald-100/50">
                                        <div>
                                            <p className="text-xs text-slate-500">{t("successCount")}</p>
                                            <p className="text-lg font-bold text-slate-900">{uploadResult.ordersCreated}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Пропущено дубликатов</p>
                                            <p className="text-lg font-bold text-slate-900">{uploadResult.ordersSkipped}</p>
                                        </div>
                                    </div>

                                    {uploadResult.batchId && (
                                        <div className="mt-3 text-xs text-slate-600">
                                            ID пакета: <code className="bg-slate-100 px-1 rounded">{uploadResult.batchId}</code>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* State: ERROR */}
                    {state === ImportState.ERROR && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="h-8 w-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                                    <AlertCircle className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-red-900">{t("error")}</h3>
                                    <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
                                    <p className="text-xs text-slate-500 mt-2">Пожалуйста, проверьте формат файла и попробуйте снова.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t("uploadButton")}</Button>
                    {state === ImportState.COMPLETE ? (
                        <Button
                            className="bg-sky-600 hover:bg-sky-700"
                            onClick={() => {
                                onImportComplete?.()
                                onOpenChange(false)
                            }}
                        >
                            {t("importButton")}
                        </Button>
                    ) : (
                        <Button disabled>{t("importButton")}</Button>
                    )}
                </DialogFooter>

            </DialogContent>
        </Dialog>
    )
}
