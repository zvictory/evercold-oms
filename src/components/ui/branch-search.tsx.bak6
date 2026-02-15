"use client"

import * as React from "react"
import { Check, Search, MapPin } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// Mock branches - in a real app, these would come from an API/Server Action
const branches = [
    { value: "all", label: "All Branches", code: "" },
    { value: "k013", label: "Korzinka Chilanzar", code: "K013" },
    { value: "k004", label: "Korzinka Sergeli", code: "K004" },
    { value: "k018", label: "Korzinka Yunusabad", code: "K018" },
    { value: "k002", label: "Korzinka Maksim", code: "K002" },
    { value: "k009", label: "Korzinka Sayram", code: "K009" },
    { value: "k001", label: "Korzinka C1", code: "K001" },
]

interface BranchSearchProps {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
}

export function BranchSearch({
    value,
    onValueChange,
    className,
    placeholder = "Search branches...",
    searchPlaceholder = "Search branch...",
    emptyText = "No branch found."
}: BranchSearchProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-[220px] justify-between h-10 border-slate-200 bg-white", className)}
                >
                    <div className="flex items-center gap-2 truncate">
                        <Search className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className="truncate">
                            {value
                                ? branches.find((b) => b.value === value)?.label
                                : placeholder}
                        </span>
                    </div>
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {branches.map((branch) => (
                                <CommandItem
                                    key={branch.value}
                                    value={branch.value}
                                    onSelect={(currentValue) => {
                                        onValueChange(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                    className="cursor-pointer"
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center">
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4 text-sky-600",
                                                    value === branch.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="font-medium">{branch.label}</span>
                                        </div>
                                        {branch.code && (
                                            <span className="text-[10px] text-slate-400 ml-6 font-mono font-bold bg-slate-100 w-fit px-1 rounded">
                                                {branch.code}
                                            </span>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
