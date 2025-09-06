# Role-Based Access Control Components

This directory contains components for implementing role-based access control in the React application, similar to the Flutter `RoleBasedWidget`.

## Components

### RoleBasedRoute
A route wrapper component that protects routes based on user roles.

```tsx
import RoleBasedRoute from './components/role-based/RoleBasedRoute';
import { ROLES } from './utils/roleUtils';

// Protect a route with specific roles
<Route path="devices" element={
  <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
    <DeviceIndexPage />
  </RoleBasedRoute>
} />

// Protect a route for Super Admin only
<Route path="admin" element={
  <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
    <AdminPage />
  </RoleBasedRoute>
} />
```

### RoleBasedWidget
A component for conditional rendering based on user roles.

```tsx
import RoleBasedWidget from './components/role-based/RoleBasedWidget';
import { ROLES } from './utils/roleUtils';

// Show button only to Super Admins
<RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
  <button>Create Device</button>
</RoleBasedWidget>

// Show admin panel only to Super Admins
<RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
  <AdminPanel />
</RoleBasedWidget>

// Show content for multiple roles
<RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
  <DealerContent />
</RoleBasedWidget>

// Show fallback content for unauthorized users
<RoleBasedWidget 
  allowedRoles={[ROLES.SUPER_ADMIN]}
  fallback={<div>Access Denied</div>}
>
  <AdminContent />
</RoleBasedWidget>
```

## Usage in Components

### Using AuthContext Helper Methods

```tsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { hasRole, isSuperAdmin, isDealer, isCustomer } = useAuth();

  return (
    <div>
      {isSuperAdmin() && (
        <button>Create Device</button>
      )}
      
      {isSuperAdmin() && (
        <AdminPanel />
      )}
      
      {hasRole([ROLES.SUPER_ADMIN, ROLES.DEALER]) && (
        <DealerContent />
      )}
    </div>
  );
}
```

### Using Role-Based Widgets

```tsx
import RoleBasedWidget from '../components/role-based/RoleBasedWidget';
import { ROLES } from '../utils/roleUtils';

function DeviceCard({ device }) {
  return (
    <div className="device-card">
      <h3>{device.name}</h3>
      
      <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
        <button>Edit</button>
      </RoleBasedWidget>
      
      <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
        <button className="text-red-500">Delete</button>
      </RoleBasedWidget>
    </div>
  );
}
```

## Available Roles

- `Super Admin` - Full access to all features
- `Dealer` - Limited access to devices, full access to vehicles
- `Customer` - Access to vehicles, reports, and live tracking

## Role-Based Access Rules

- **Super Admin**: Full access to all features
- **Dealer**: Can read devices, full access to vehicles, reports, and live tracking
- **Customer**: Can access vehicles, reports, and live tracking only

## Examples

### Single Role Access
```tsx
// Only Super Admin can see this
<RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN]}>
  <AdminButton />
</RoleBasedWidget>
```

### Multiple Role Access
```tsx
// Both Super Admin and Dealer can see this
<RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
  <DealerContent />
</RoleBasedWidget>
```

### All Roles Access
```tsx
// All roles can see this
<RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
  <PublicContent />
</RoleBasedWidget>
```
