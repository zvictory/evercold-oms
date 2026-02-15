
"use client"

import * as React from "react"
import { useQuery } from '@tanstack/react-query'
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UsersTable } from "@/components/settings/users/UsersTable"
import { UserDialog } from "@/components/settings/users/UserDialog"
import { useScopedI18n } from '@/locales/client'
import { fetchWithAuth } from '@/lib/utils'

export default function UsersPage() {
    const t = useScopedI18n('Common')
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [editingUser, setEditingUser] = React.useState<any>(null)

    const { data: users, isLoading, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetchWithAuth('/api/users', {
            })
            if (!res.ok) throw new Error('Failed to fetch users')
            return res.json()
        }
    })

    const handleCreate = () => {
        setEditingUser(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (user: any) => {
        setEditingUser(user)
        setIsDialogOpen(true)
    }

    const handleSuccess = () => {
        setIsDialogOpen(false)
        refetch()
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Management</h1>
                    <p className="text-sm text-slate-500">Manage system users and their roles.</p>
                </div>
                <Button onClick={handleCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4" />
                    Add User
                </Button>
            </div>

            <UsersTable
                users={users || []}
                isLoading={isLoading}
                onEdit={handleEdit}
                onRefresh={refetch}
            />

            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                user={editingUser}
                onSuccess={handleSuccess}
            />
        </div>
    )
}
