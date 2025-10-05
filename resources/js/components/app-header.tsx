import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { usePermission } from '@/hooks/use-permission';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Cog, Folder, Home, LayoutGrid, Menu, Search, Users, Shield, Key, Settings, Store, Package, Truck, Tag, Warehouse, ShoppingCart, ArrowRightLeft, Plus, AlertTriangle, CreditCard, Receipt, RotateCcw, DollarSign, TrendingUp, BookDashed } from 'lucide-react';
import AppLogo from './app-logo';
import AppLogoIcon from './app-logo-icon';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        permission: 'dashboard.view',
    },
    {
        title: 'Master Data',
        href: '/master-data',
        icon: LayoutGrid,
        children: [
            {
                title: 'Stores',
                href: '/master-data/stores',
                icon: Store,
                permission: 'store.view',
            },
            {
                title: 'Categories',
                href: '/master-data/categories',
                icon: Tag,
                permission: 'category.view',
            },
            {
                title: 'Products',
                href: '/master-data/products',
                icon: Package,
                permission: 'product.view',
            },
            {
                title: 'Suppliers',
                href: '/master-data/suppliers',
                icon: Truck,
                permission: 'supplier.view',
            },
            {
                title: 'Customers',
                href: '/master-data/customers',
                icon: Users,
                permission: 'customer.view',
            },
            {
                title: 'Jenis Member',
                href: '/master-data/customer-discounts',
                icon: Tag,
                permission: 'customer-discount.view',
            },
        ],
    },
    {
        title: 'Inventory',
        href: '/inventory',
        icon: Warehouse,
        children: [
            {
                title: 'Stock Management',
                href: '/inventory',
                icon: Package,
                permission: 'inventory.view',
            },
            {
                title: 'Purchase Orders',
                href: '/inventory/purchase-orders',
                icon: ShoppingCart,
                permission: 'purchase-order.view',
            },
            {
                title: 'Stock Transfers',
                href: '/inventory/stock-transfers',
                icon: ArrowRightLeft,
                permission: 'stock-transfer.view',
            },
            {
                title: 'Stock Adjustments',
                href: '/inventory/stock-adjustments',
                icon: Plus,
                permission: 'stock-adjustment.view',
            },
            {
                title: 'Minimum Stock Alert',
                href: '/inventory/alerts/minimum-stock',
                icon: AlertTriangle,
                permission: 'inventory.view',
            },
        ],
    },
    {
        title: 'Sales',
        href: '/sales',
        icon: TrendingUp,
        children: [
            {
                title: 'Transactions',
                href: '/sales/transactions',
                icon: Receipt,
                permission: 'sales.view',
            },
            {
                title: 'Payment Methods',
                href: '/sales/payment-methods',
                icon: CreditCard,
                permission: 'payment-method.view',
            },
            {
                title: 'Discounts',
                href: '/sales/discounts',
                icon: DollarSign,
                permission: 'discount.view',
            },
            {
                title: 'Returns & Refunds',
                href: '/sales/returns',
                icon: RotateCcw,
                permission: 'sales.view',
            },
        ],
    },
    {
        title: 'POS',
        href: '/pos/cashier',
        icon: ShoppingCart,
        permission: 'pos.view',
    },
    {
        title: 'Reports',
        href: '/reports',
        icon: TrendingUp,
        children: [
            {
                title: 'Index Report',
                href: '/reports',
                icon: BookDashed,
                permission: 'reports.view',
            },
            {
                title: 'Analytics Dashboard',
                href: '/reports/analytics',
                icon: TrendingUp,
                permission: 'reports.view',
            },
            {
                title: 'Sales Report',
                href: '/reports/sales',
                icon: DollarSign,
                permission: 'reports.view',
            },
            {
                title: 'Inventory Report',
                href: '/reports/inventory',
                icon: Package,
                permission: 'reports.view',
            },
            {
                title: 'Financial Report',
                href: '/reports/financial',
                icon: TrendingUp,
                permission: 'reports.view',
            },
        ],
    },
    {
        title: 'System',
        href: '/settings',
        icon: Cog,
        children: [
            {
                title: 'Users',
                href: '/settings/users',
                icon: Users,
                permission: 'user.view',
            },
            {
                title: 'Roles',
                href: '/settings/roles',
                icon: Shield,
                permission: 'role.view',
            },
            {
                title: 'Permissions',
                href: '/settings/permissions',
                icon: Key,
                permission: 'permission.view',
            },
            {
                title: 'Web Settings',
                href: '/settings/web-settings',
                icon: Settings,
                permission: 'settings.view',
            }
        ],
    },
];

const rightNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

const activeItemStyles = 'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const { hasPermission } = usePermission();
    const getInitials = useInitials();

    // Filter navigation items based on permissions
    const filteredNavItems = mainNavItems.map(item => {
        if (item.children) {
            const filteredChildren = item.children.filter(child => 
                !child.permission || hasPermission(child.permission)
            );
            
            // If no children are accessible, hide the parent item
            if (filteredChildren.length === 0) {
                return null;
            }
            
            return {
                ...item,
                children: filteredChildren
            };
        }
        
        // Check permission for non-parent items
        if (item.permission && !hasPermission(item.permission)) {
            return null;
        }
        
        return item;
    }).filter(Boolean) as NavItem[];
    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="mr-2 h-[34px] w-[34px]">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="flex h-full w-64 flex-col bg-sidebar p-0">
                                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                                <SheetHeader className="flex justify-start text-left p-4 border-b">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col overflow-hidden">
                                    <div className="flex-1 overflow-y-auto px-4 py-4">
                                        <div className="flex flex-col space-y-2 text-sm">
                                            {filteredNavItems.map((item) => (
                                                <div key={item.title} className="space-y-2">
                                                    <Link 
                                                        href={item.href} 
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                                            page.url.startsWith(item.href) && "bg-accent text-accent-foreground"
                                                        )}
                                                    >
                                                        {item.icon && <Icon iconNode={item.icon} className="h-5 w-5 shrink-0" />}
                                                        <span>{item.title}</span>
                                                    </Link>
                                                    {item.children && (
                                                        <div className="ml-8 space-y-1">
                                                            {item.children.map((childItem) => (
                                                                <Link
                                                                    key={childItem.href}
                                                                    href={childItem.href}
                                                                    className={cn(
                                                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-accent-foreground",
                                                                        page.url === childItem.href && "bg-accent text-accent-foreground",
                                                                        "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {childItem.icon && <Icon iconNode={childItem.icon} className="h-4 w-4 shrink-0" />}
                                                                    <span>{childItem.title}</span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Footer section - fixed at bottom */}
                                    <div className="border-t px-4 py-4">
                                        <div className="flex flex-col space-y-4">
                                            {rightNavItems.map((item) => (
                                                <a
                                                    key={item.title}
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-2 text-sm font-medium"
                                                >
                                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                                    <span>{item.title}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link href="/dashboard" prefetch className="flex items-center space-x-2">
                        <AppLogo />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
                        <div className="flex h-full items-center space-x-2">
                                {filteredNavItems.map((item, index) => (
                                    <div key={index} className="relative flex h-full items-center">
                                        {item.children ? (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger
                                                    className={cn(
                                                        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground",
                                                        page.url.startsWith(item.href) && activeItemStyles,
                                                        'h-9 cursor-pointer px-3',
                                                    )}
                                                >
                                                    {item.icon && <Icon iconNode={item.icon} className="mr-2 h-4 w-4" />}
                                                    {item.title}
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent 
                                                    className="w-64 p-2"
                                                    align="start"
                                                    sideOffset={5}
                                                >
                                                    {item.children.map((childItem) => (
                                                        <DropdownMenuItem key={childItem.href} asChild>
                                                            <Link
                                                                href={childItem.href}
                                                                className={cn(
                                                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer",
                                                                    page.url === childItem.href && "bg-accent text-accent-foreground"
                                                                )}
                                                            >
                                                                {childItem.icon && <Icon iconNode={childItem.icon} className="h-4 w-4 shrink-0" />}
                                                                <span>{childItem.title}</span>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                                {page.url.startsWith(item.href) && (
                                                    <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                                )}
                                            </DropdownMenu>
                                        ) : (
                                            <>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground",
                                                        page.url === item.href && activeItemStyles,
                                                        'h-9 cursor-pointer px-3',
                                                    )}
                                                >
                                                    {item.icon && <Icon iconNode={item.icon} className="mr-2 h-4 w-4" />}
                                                    {item.title}
                                                </Link>
                                                {page.url === item.href && (
                                                    <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white"></div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="ml-auto flex items-center space-x-2">
                        {/* <div className="relative flex items-center space-x-1">
                            <Button variant="ghost" size="icon" className="group h-9 w-9 cursor-pointer">
                                <Search className="!size-5 opacity-80 group-hover:opacity-100" />
                            </Button>
                            <div className="hidden lg:flex">
                                {rightNavItems.map((item) => (
                                    <TooltipProvider key={item.title} delayDuration={0}>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <a
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-0 text-sm font-medium text-accent-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                                >
                                                    <span className="sr-only">{item.title}</span>
                                                    {item.icon && <Icon iconNode={item.icon} className="size-5 opacity-80 group-hover:opacity-100" />}
                                                </a>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{item.title}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ))}
                            </div>
                        </div> */}

                        {/* AUTH */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="size-10 rounded-full p-1">
                                    <Avatar className="size-8 overflow-hidden rounded-full">
                                        <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                            {getInitials(auth.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <UserMenuContent user={auth.user} />
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
            {breadcrumbs.length > 1 && (
                <div className="flex w-full border-b border-sidebar-border/70">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
