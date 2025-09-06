import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown } from 'lucide-react';

interface SearchableSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
    emptyText?: string;
    className?: string;
}

export function SearchableSelect({ 
    value, 
    onValueChange, 
    options, 
    placeholder, 
    emptyText = "Tidak ada data",
    className = ""
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(!open);
        } else if (event.key === 'Escape') {
            setOpen(false);
            setSearchTerm('');
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:border-accent-foreground/20 ${
                    open ? 'ring-2 ring-ring ring-offset-2 border-ring' : ''
                }`}
                onClick={() => setOpen(!open)}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                <span className={`truncate ${selectedOption ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 opacity-50 transition-transform duration-200 ${
                    open ? 'rotate-180' : ''
                }`} />
            </div>
            
            {open && (
                <div className="absolute z-50 w-full mt-2 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
                    <div className="p-3 border-b bg-background/50 backdrop-blur-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Cari..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9 border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-64 overflow-auto p-1" role="listbox">
                        {filteredOptions.length === 0 ? (
                            <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                                <div className="text-center space-y-2">
                                    <Search className="mx-auto h-8 w-8 text-muted-foreground/30" />
                                    <p className="font-medium">{emptyText}</p>
                                    {searchTerm && (
                                        <p className="text-xs">Tidak ada hasil untuk "{searchTerm}"</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        role="option"
                                        aria-selected={value === option.value}
                                        className={`relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2.5 text-sm outline-none transition-all duration-150 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
                                            value === option.value 
                                                ? 'bg-accent text-accent-foreground font-medium shadow-sm' 
                                                : ''
                                        }`}
                                        onClick={() => {
                                            onValueChange(option.value);
                                            setOpen(false);
                                            setSearchTerm('');
                                        }}
                                    >
                                        <span className="truncate">{option.label}</span>
                                        {value === option.value && (
                                            <span className="absolute right-3 flex h-4 w-4 items-center justify-center">
                                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
