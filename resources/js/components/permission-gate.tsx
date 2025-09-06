import React from 'react';
import { usePermission } from '@/hooks/use-permission';

interface PermissionGateProps {
    permission: string | string[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireAll?: boolean; // If true, requires all permissions. If false, requires any permission.
}

/**
 * Permission Gate Component
 * Conditionally renders children based on user permissions
 * 
 * Usage Examples:
 * 
 * 1. Single permission:
 * <PermissionGate permission="user.create">
 *   <Button>Add User</Button>
 * </PermissionGate>
 * 
 * 2. Multiple permissions (any):
 * <PermissionGate permission={["user.edit", "user.delete"]}>
 *   <Button>Edit User</Button>
 * </PermissionGate>
 * 
 * 3. Multiple permissions (all required):
 * <PermissionGate permission={["user.edit", "user.view"]} requireAll={true}>
 *   <Button>Advanced Edit</Button>
 * </PermissionGate>
 * 
 * 4. With fallback:
 * <PermissionGate permission="user.delete" fallback={<span>No access</span>}>
 *   <Button variant="destructive">Delete</Button>
 * </PermissionGate>
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({ 
    permission, 
    children, 
    fallback = null,
    requireAll = false 
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();

    let hasAccess = false;

    if (Array.isArray(permission)) {
        hasAccess = requireAll 
            ? hasAllPermissions(permission)
            : hasAnyPermission(permission);
    } else {
        hasAccess = hasPermission(permission);
    }

    return hasAccess ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;
