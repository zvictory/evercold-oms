"use client"

import * as React from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"

// Fallback data for error states
const fallbackData = [
    { name: "Mon", small: 0, large: 0 },
    { name: "Tue", small: 0, large: 0 },
    { name: "Wed", small: 0, large: 0 },
    { name: "Thu", small: 0, large: 0 },
    { name: "Fri", small: 0, large: 0 },
    { name: "Sat", small: 0, large: 0 },
    { name: "Sun", small: 0, large: 0 },
]

function ChartSkeleton() {
    return (
        <div className="h-[300px] w-full animate-pulse">
            <div className="h-full bg-slate-100 rounded-lg" />
        </div>
    )
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="h-[300px] w-full flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-slate-500">Failed to load revenue data</p>
            <p className="text-xs text-slate-400">{error}</p>
            <button
                onClick={onRetry}
                className="px-3 py-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded transition-colors"
            >
                Retry
            </button>
        </div>
    )
}

export function RevenueChart() {
    const [data, setData] = React.useState(fallbackData)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const fetchData = React.useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetchWithAuth('/api/dashboard/revenue-chart', {
            })
            if (!res.ok) throw new Error('Failed to fetch')
            const result = await res.json()
            setData(result.data)
        } catch (err: any) {
            setError(err.message)
            // Keep fallback data on error
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchData()
    }, [fetchData])

    if (loading) return <ChartSkeleton />
    if (error) return <ErrorState error={error} onRetry={fetchData} />

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#0f172a' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="small" name="1kg Bags" stackId="a" fill="var(--chart-1)" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="large" name="3kg Bags" stackId="a" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
