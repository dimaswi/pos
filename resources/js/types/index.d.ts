import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
    permissions: string[];
}

export interface BreadcrumbItem {
    title: string | JSX.Element;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    children?: NavItem[];
    permission?: string;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    settings: AppSettings;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface AppSettings {
    app_name: string;
    app_logo: string;
    app_favicon: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    role_id?: number;
    role?: Role;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Role {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    permissions?: Permission[];
    users?: User[];
}

export interface Permission {
    id: number;
    name: string;
    display_name: string;
    description?: string;
    module: string;
    created_at: string;
    updated_at: string;
    roles?: Role[];
}

export interface Customer {
    id: number;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    birth_date?: string;
    gender?: 'male' | 'female';
    customer_type: 'regular' | 'member' | 'vip';
    membership_date?: string;
    total_points: number;
    total_spent: number;
    total_transactions: number;
    last_transaction_date?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}
