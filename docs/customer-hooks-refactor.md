# Customer Hooks Refactor Documentation

## 📋 Overview

This document outlines the complete refactor of the customer hooks module (`use-customer.ts`) to align with the backend API endpoints and provide a comprehensive, type-safe interface for customer data management.

**Date**: March 2024  
**Status**: ✅ Complete  
**Breaking Changes**: Yes (see migration guide)

---

## 🎯 Objectives

### Before Refactor
- ❌ Incomplete type definitions
- ❌ Missing CRUD operations (only GET operations)
- ❌ No mutation hooks for create/update/delete
- ❌ Types defined inline instead of centralized
- ❌ Limited documentation
- ❌ No cache invalidation strategy

### After Refactor
- ✅ Complete type definitions matching backend schemas
- ✅ Full CRUD operations (GET, POST, PATCH, DELETE)
- ✅ Mutation hooks with automatic cache management
- ✅ Centralized types in `@/types/customer`
- ✅ Comprehensive JSDoc documentation
- ✅ Optimistic updates and cache invalidation
- ✅ Utility hooks for flexible data fetching

---

## 🏗️ Architecture

### File Structure

```
src/
├── types/
│   └── customer.ts          # Centralized type definitions
└── hooks/
    └── use-customer.ts      # Customer hooks with CRUD operations
```

### Type System

**Types File** (`src/types/customer.ts`):
- Core entity types matching backend
- Request/Response types
- Extended types with relations

**Hooks File** (`src/hooks/use-customer.ts`):
- Query functions (API calls)
- Query hooks (read operations)
- Mutation hooks (write operations)
- Utility hooks

---

## 📡 API Endpoints Mapping

### Backend Endpoints

Based on the backend implementation at `localiza-saude-backend/src/http/routes/customers/`:

| Method | Endpoint | Controller | Purpose |
|--------|----------|------------|---------|
| `GET` | `/customers` | `get-customers-controller` | Get all customers |
| `GET` | `/customers/:id` | `get-customer-by-id-controller` | Get customer by ID |
| `GET` | `/customers/user/:userId` | Custom route | Get customer by user ID |
| `POST` | `/customers` | `create-customer-controller` | Create new customer |
| `PATCH` | `/customers/:id` | `update-customer-controller` | Update customer |
| `DELETE` | `/customers/:id` | `delete-customer-controller` | Delete customer |

### Frontend Hooks Mapping

| Hook | Endpoint | Type | Description |
|------|----------|------|-------------|
| `useCustomers()` | `GET /customers` | Query | Fetch all customers |
| `useCustomer(id)` | `GET /customers/:id` | Query | Fetch by customer ID |
| `useCustomerByUserId(userId)` | `GET /customers/user/:userId` | Query | Fetch by user ID |
| `useCreateCustomer()` | `POST /customers` | Mutation | Create customer |
| `useUpdateCustomer()` | `PATCH /customers/:id` | Mutation | Update customer |
| `useDeleteCustomer()` | `DELETE /customers/:id` | Mutation | Delete customer |
| `useCustomerData(id?, userId?)` | Dynamic | Utility | Flexible fetching |

---

## 📦 Type Definitions

### Core Customer Type

```typescript
interface Customer {
  id: string;                 // CUID
  userId: string;             // Associated user ID
  cpf: string | null;         // Brazilian tax ID
  dateOfBirth: string | null; // ISO date string
  address: string | null;     // Physical address
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}
```

### Request Types

```typescript
interface CreateCustomerData {
  userId: string;                         // Required
  cpf?: string | null;                    // Optional
  dateOfBirth?: Date | string | null;     // Optional (accepts Date or ISO string)
  address?: string | null;                // Optional
}

interface UpdateCustomerData {
  cpf?: string | null;                    // All fields optional
  dateOfBirth?: Date | string | null;
  address?: string | null;
}
```

### Response Types

```typescript
interface GetCustomersResponse {
  customers: Customer[];
}

interface GetCustomerResponse {
  customer: Customer;
}

interface CreateCustomerResponse {
  customer: Customer;
}

interface UpdateCustomerResponse {
  customer: Customer;
}

interface DeleteCustomerResponse {
  message: string;
}
```

---

## 🔍 Usage Examples

### 1. Fetching All Customers

```tsx
import { useCustomers } from "@/hooks/use-customer";

function CustomerList() {
  const { data, isLoading, error } = useCustomers();
  
  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  
  const customers = data?.customers || [];
  
  return (
    <FlatList
      data={customers}
      renderItem={({ item }) => <CustomerCard customer={item} />}
    />
  );
}
```

### 2. Fetching Customer by ID

```tsx
import { useCustomer } from "@/hooks/use-customer";

function CustomerProfile({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomer(customerId);
  
  if (isLoading) return <Loading />;
  
  const customer = data?.customer;
  
  return (
    <View>
      <Text>CPF: {customer?.cpf}</Text>
      <Text>Address: {customer?.address}</Text>
    </View>
  );
}
```

### 3. Fetching Customer by User ID

```tsx
import { useAuth } from "@/contexts/auth";
import { useCustomerByUserId } from "@/hooks/use-customer";

function MyProfile() {
  const { user } = useAuth();
  const { data, isLoading } = useCustomerByUserId(user?.id || "", !!user?.id);
  
  const customer = data?.customer;
  
  return (
    <View>
      <Text>Welcome {user?.name}</Text>
      <Text>Your CPF: {customer?.cpf || "Not set"}</Text>
    </View>
  );
}
```

### 4. Creating a Customer

```tsx
import { useCreateCustomer } from "@/hooks/use-customer";
import { useAuth } from "@/contexts/auth";

function CompleteProfile() {
  const { user } = useAuth();
  const createCustomer = useCreateCustomer();
  
  const handleSubmit = async (formData: any) => {
    try {
      const result = await createCustomer.mutateAsync({
        userId: user!.id,
        cpf: formData.cpf,
        dateOfBirth: new Date(formData.dateOfBirth),
        address: formData.address,
      });
      
      Alert.alert("Success", "Profile created!");
      console.log("Created customer:", result.customer);
    } catch (error) {
      Alert.alert("Error", "Failed to create profile");
    }
  };
  
  return (
    <Form onSubmit={handleSubmit} loading={createCustomer.isPending} />
  );
}
```

### 5. Updating a Customer

```tsx
import { useUpdateCustomer } from "@/hooks/use-customer";

function EditProfile({ customerId }: { customerId: string }) {
  const updateCustomer = useUpdateCustomer();
  
  const handleUpdate = async (formData: any) => {
    try {
      await updateCustomer.mutateAsync({
        customerId,
        data: {
          address: formData.address,
          // Only send fields that changed
        },
      });
      
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    }
  };
  
  return (
    <Form 
      onSubmit={handleUpdate} 
      loading={updateCustomer.isPending}
      disabled={updateCustomer.isPending}
    />
  );
}
```

### 6. Deleting a Customer

```tsx
import { useDeleteCustomer } from "@/hooks/use-customer";
import { router } from "expo-router";

function DeleteAccount({ customerId }: { customerId: string }) {
  const deleteCustomer = useDeleteCustomer();
  
  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCustomer.mutateAsync(customerId);
              Alert.alert("Deleted", "Account deleted successfully");
              router.replace("/login");
            } catch (error) {
              Alert.alert("Error", "Failed to delete account");
            }
          },
        },
      ]
    );
  };
  
  return (
    <Button 
      variant="destructive" 
      onPress={handleDelete}
      loading={deleteCustomer.isPending}
    >
      Delete Account
    </Button>
  );
}
```

### 7. Using the Utility Hook

```tsx
import { useCustomerData } from "@/hooks/use-customer";

function FlexibleCustomerView({
  customerId,
  userId,
}: {
  customerId?: string;
  userId?: string;
}) {
  // Automatically selects the right query based on which ID is provided
  const { data, isLoading } = useCustomerData(customerId, userId);
  
  if (isLoading) return <Loading />;
  
  const customer = data?.customer;
  
  return <CustomerCard customer={customer} />;
}

// Usage
<FlexibleCustomerView customerId="cust_123" />
<FlexibleCustomerView userId="user_456" />
```

---

## 🔄 Cache Management

### Automatic Cache Invalidation

All mutation hooks automatically manage the React Query cache:

#### Create Customer
```typescript
onSuccess: (response) => {
  // 1. Invalidate customers list
  queryClient.invalidateQueries({ queryKey: ["customers"] });
  
  // 2. Set new customer in cache by ID
  queryClient.setQueryData(["customer", customer.id], response);
  
  // 3. Set new customer in cache by userId
  queryClient.setQueryData(["customer", "user", customer.userId], response);
}
```

#### Update Customer
```typescript
onSuccess: (response, variables) => {
  // 1. Update specific customer cache
  queryClient.setQueryData(["customer", customerId], response);
  
  // 2. Invalidate customers list
  queryClient.invalidateQueries({ queryKey: ["customers"] });
  
  // 3. Update userId cache
  queryClient.setQueryData(["customer", "user", customer.userId], response);
}
```

#### Delete Customer
```typescript
onSuccess: (_, customerId) => {
  // 1. Remove customer from cache
  queryClient.removeQueries({ queryKey: ["customer", customerId] });
  
  // 2. Invalidate customers list
  queryClient.invalidateQueries({ queryKey: ["customers"] });
}
```

### Query Keys

| Query Key Pattern | Description |
|------------------|-------------|
| `["customers"]` | All customers list |
| `["customer", customerId]` | Single customer by ID |
| `["customer", "user", userId]` | Customer by user ID |

---

## 🚀 Migration Guide

### Breaking Changes

1. **Type Imports**
   ```typescript
   // ❌ Old
   import type { Customer } from "@/hooks/use-customer";
   
   // ✅ New
   import type { Customer } from "@/types/customer";
   ```

2. **User Relation**
   ```typescript
   // ❌ Old - Customer had optional user field
   customer.user?.name
   
   // ✅ New - Use CustomerWithUser or fetch user separately
   import type { CustomerWithUser } from "@/types/customer";
   // Or fetch user data separately using useUser hook
   ```

3. **Response Structure**
   All responses are now properly typed and wrapped in objects:
   ```typescript
   // ✅ Always access via response object
   const customer = data?.customer;
   const customers = data?.customers || [];
   ```

### Migration Steps

1. **Update Type Imports**
   ```bash
   # Find all imports
   grep -r "from \"@/hooks/use-customer\"" src/
   
   # Update type imports to use @/types/customer
   ```

2. **Update Component Code**
   ```tsx
   // Before
   const { data, isLoading } = useCustomerByUserId(userId);
   const customer = data?.customer;
   if (customer?.user) {
     // Access user data
   }
   
   // After
   const { data, isLoading } = useCustomerByUserId(userId);
   const customer = data?.customer;
   // Fetch user separately if needed
   const { data: userData } = useUser(customer?.userId);
   ```

3. **Add Mutation Hooks**
   Replace any custom API calls with mutation hooks:
   ```tsx
   // Before
   const handleCreate = async () => {
     const response = await api.post("/customers", data);
   };
   
   // After
   const createCustomer = useCreateCustomer();
   const handleCreate = async () => {
     await createCustomer.mutateAsync(data);
   };
   ```

---

## ✅ Best Practices

### 1. Always Enable Conditionally
```tsx
// ✅ Good - Only fetch when ID exists
const { data } = useCustomer(customerId, !!customerId);
const { data } = useCustomerByUserId(userId, !!userId);

// ❌ Bad - May cause errors or unnecessary requests
const { data } = useCustomer(customerId);
```

### 2. Handle Loading and Error States
```tsx
// ✅ Good
const { data, isLoading, error } = useCustomer(id);

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data?.customer) return <NotFound />;

return <CustomerView customer={data.customer} />;
```

### 3. Use Mutation States
```tsx
// ✅ Good
const updateCustomer = useUpdateCustomer();

<Button 
  onPress={handleUpdate}
  loading={updateCustomer.isPending}
  disabled={updateCustomer.isPending}
>
  {updateCustomer.isPending ? "Saving..." : "Save"}
</Button>

{updateCustomer.isError && (
  <ErrorText>{updateCustomer.error.message}</ErrorText>
)}
```

### 4. Proper Error Handling
```tsx
// ✅ Good
try {
  await createCustomer.mutateAsync(data);
  Alert.alert("Success", "Customer created!");
} catch (error) {
  if (error.response?.status === 409) {
    Alert.alert("Error", "Customer already exists");
  } else {
    Alert.alert("Error", "Failed to create customer");
  }
}
```

### 5. Date Handling
```tsx
// ✅ Good - Send Date objects or ISO strings
await createCustomer.mutateAsync({
  userId: user.id,
  dateOfBirth: new Date("1990-01-01"), // Date object
  // OR
  dateOfBirth: "1990-01-01T00:00:00.000Z", // ISO string
});

// Backend will convert using z.coerce.date()
```

---

## 🧪 Testing

### Unit Test Example

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCustomer } from "@/hooks/use-customer";

describe("useCustomer", () => {
  it("should fetch customer by ID", async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
    
    const { result } = renderHook(
      () => useCustomer("customer_123"),
      { wrapper }
    );
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data?.customer).toMatchObject({
      id: "customer_123",
      userId: expect.any(String),
    });
  });
});
```

---

## 📊 Performance Considerations

### 1. Caching Strategy
- All queries use React Query's built-in caching
- Default `staleTime`: 0 (always refetch on mount)
- Default `cacheTime`: 5 minutes

### 2. Optimizations
```tsx
// Use enabled flag to prevent unnecessary fetches
const { data } = useCustomer(
  customerId,
  !!customerId && isModalOpen // Only fetch when modal is open
);

// Prefetch data
const queryClient = useQueryClient();
queryClient.prefetchQuery({
  queryKey: ["customer", customerId],
  queryFn: () => getCustomerById(customerId),
});
```

### 3. Batch Requests
```tsx
// If fetching multiple customers, use the list endpoint
const { data } = useCustomers();
const customers = data?.customers || [];

// Instead of multiple individual requests
// ❌ Bad
customers.forEach(id => useCustomer(id));
```

---

## 🔮 Future Enhancements

1. **Pagination Support**
   ```typescript
   useCustomers({ page: 1, limit: 20 })
   ```

2. **Search & Filtering**
   ```typescript
   useCustomers({ search: "John", cpf: "123" })
   ```

3. **Optimistic Updates**
   ```typescript
   useUpdateCustomer({
     onMutate: async (variables) => {
       // Update cache optimistically
     }
   })
   ```

4. **Batch Operations**
   ```typescript
   useDeleteCustomers() // Delete multiple
   useUpdateCustomers() // Update multiple
   ```

5. **Real-time Sync**
   - WebSocket integration for live updates
   - Automatic refetch on network reconnect

---

## 📚 Related Documentation

- [React Query Documentation](https://tanstack.com/query/latest)
- [Backend Customer API](../../localiza-saude-backend/src/http/routes/customers/)
- [Type Definitions](../src/types/customer.ts)
- [API Service](../src/services/api.ts)

---

## 🤝 Contributing

When adding new customer-related features:

1. Update types in `src/types/customer.ts` first
2. Add corresponding backend endpoint
3. Create query/mutation function
4. Create React Query hook
5. Add JSDoc documentation
6. Update this documentation
7. Add tests

---

**Last Updated**: March 2024  
**Maintained By**: Development Team  
**Status**: ✅ Production Ready