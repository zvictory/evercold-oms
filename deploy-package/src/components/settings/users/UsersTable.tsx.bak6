
"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Edit2, ShieldAlert, ShieldCheck, User as UserIcon } from "lucide-react"

interface User {
    id: string
    name: string
    email: string
    role: 'ADMIN' | 'MANAGER' | 'VIEWER'
    isActive: boolean
    createdAt: string
}

interface UsersTableProps {
    users: User[]
    isLoading: boolean
    onEdit: (user: User) => void
    onRefresh: () => void
}

export function UsersTable({ users, isLoading, onEdit }: UsersTableProps) {
    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return (
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 gap-1 pl-1">
                        <ShieldAlert className="h-3 w-3" />
                        Admin
                    </Badge>
                )
            case 'MANAGER':
                return (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1 pl-1">
                        <ShieldCheck className="h-3 w-3" />
                        Manager
                    </Badge>
                )
            default:
                return (
                    <Badge variant="secondary" className="gap-1 pl-1">
                        <UserIcon className="h-3 w-3" />
                        Viewer
                    </Badge>
                )
        }
    }

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                No users found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{getRoleBadge(user.role)}</TableCell>
                                <TableCell>
                                    {user.isActive ? (
                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-500">
                                            Inactive
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-slate-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEdit(user)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit2 className="h-4 w-4 text-slate-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
