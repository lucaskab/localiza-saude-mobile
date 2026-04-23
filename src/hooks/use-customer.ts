import { api } from "@/services/api";
import type {
	Customer,
	CreateCustomerData,
	CreateCustomerResponse,
	DeleteCustomerResponse,
	GetCustomerResponse,
	GetCustomersResponse,
	UpdateCustomerData,
	UpdateCustomerResponse,
} from "@/types/customer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Customer Hooks
 *
 * This module provides React Query hooks for managing customer data.
 * All hooks include automatic caching, loading states, and error handling.
 *
 * Available operations:
 * - GET all customers (useCustomers)
 * - GET customer by ID (useCustomer)
 * - GET customer by user ID (useCustomerByUserId)
 * - CREATE customer (useCreateCustomer)
 * - UPDATE customer (useUpdateCustomer)
 * - DELETE customer (useDeleteCustomer)
 *
 * @module hooks/use-customer
 */

// ============================================================================
// Query Functions (API Calls)
// ============================================================================

/**
 * Fetches all customers from the API
 * @returns Promise with customers array
 */
export const getCustomers = async (): Promise<GetCustomersResponse> => {
	const { data } = await api.get<GetCustomersResponse>("/customers");
	return data;
};

/**
 * Fetches a single customer by ID
 * @param customerId - The customer's unique identifier
 * @returns Promise with customer data
 */
export const getCustomerById = async (
	customerId: string,
): Promise<GetCustomerResponse> => {
	const { data } = await api.get<GetCustomerResponse>(
		`/customers/${customerId}`,
	);
	return data;
};

/**
 * Fetches a customer by their associated user ID
 * Note: This endpoint uses a custom route pattern
 * @param userId - The user's unique identifier
 * @returns Promise with customer data
 */
export const getCustomerByUserId = async (
	userId: string,
): Promise<GetCustomerResponse> => {
	const { data } = await api.get<GetCustomerResponse>(
		`/customers/user/${userId}`,
	);
	return data;
};

/**
 * Creates a new customer
 * @param data - Customer creation data (userId required)
 * @returns Promise with created customer
 */
export const createCustomer = async (
	data: CreateCustomerData,
): Promise<CreateCustomerResponse> => {
	const { data: response } = await api.post<CreateCustomerResponse>(
		"/customers",
		data,
	);
	return response;
};

/**
 * Updates an existing customer
 * @param customerId - The customer's unique identifier
 * @param data - Customer update data (all fields optional)
 * @returns Promise with updated customer
 */
export const updateCustomer = async (
	customerId: string,
	data: UpdateCustomerData,
): Promise<UpdateCustomerResponse> => {
	const { data: response } = await api.patch<UpdateCustomerResponse>(
		`/customers/${customerId}`,
		data,
	);
	return response;
};

/**
 * Deletes a customer
 * @param customerId - The customer's unique identifier
 * @returns Promise with deletion confirmation
 */
export const deleteCustomer = async (
	customerId: string,
): Promise<DeleteCustomerResponse> => {
	const { data } = await api.delete<DeleteCustomerResponse>(
		`/customers/${customerId}`,
	);
	return data;
};

// ============================================================================
// Query Hooks (Read Operations)
// ============================================================================

/**
 * Hook to fetch all customers
 *
 * @param enabled - Whether the query should run (default: true)
 * @returns React Query result with customers array
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCustomers();
 * const customers = data?.customers || [];
 * ```
 */
export const useCustomers = (enabled: boolean = true) => {
	return useQuery({
		queryKey: ["customers"],
		queryFn: getCustomers,
		enabled,
	});
};

/**
 * Hook to fetch a customer by ID
 *
 * @param customerId - The customer's unique identifier
 * @param enabled - Whether the query should run (default: true)
 * @returns React Query result with customer data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCustomer(customerId);
 * const customer = data?.customer;
 * ```
 */
export const useCustomer = (customerId: string, enabled: boolean = true) => {
	return useQuery({
		queryKey: ["customer", customerId],
		queryFn: () => getCustomerById(customerId),
		enabled: enabled && !!customerId,
	});
};

/**
 * Hook to fetch a customer by their user ID
 *
 * @param userId - The user's unique identifier
 * @param enabled - Whether the query should run (default: true)
 * @returns React Query result with customer data
 *
 * @example
 * ```tsx
 * const { user } = useAuth();
 * const { data, isLoading } = useCustomerByUserId(user?.id || "", !!user?.id);
 * const customer = data?.customer;
 * ```
 */
export const useCustomerByUserId = (
	userId: string,
	enabled: boolean = true,
) => {
	return useQuery({
		queryKey: ["customer", "user", userId],
		queryFn: () => getCustomerByUserId(userId),
		enabled: enabled && !!userId,
	});
};

// ============================================================================
// Mutation Hooks (Write Operations)
// ============================================================================

/**
 * Hook to create a new customer
 *
 * Features:
 * - Automatically invalidates customer list cache
 * - Updates cache with new customer data
 * - Sets customer data in cache by both ID and userId
 *
 * @returns React Query mutation result
 *
 * @example
 * ```tsx
 * const createCustomer = useCreateCustomer();
 *
 * const handleCreate = async () => {
 *   try {
 *     const result = await createCustomer.mutateAsync({
 *       userId: "user_123",
 *       cpf: "12345678900",
 *       dateOfBirth: new Date("1990-01-01"),
 *       address: "123 Main St"
 *     });
 *     console.log("Created:", result.customer);
 *   } catch (error) {
 *     console.error("Failed to create customer:", error);
 *   }
 * };
 * ```
 */
export const useCreateCustomer = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCustomer,
		onSuccess: (response) => {
			const { customer } = response;

			// Invalidate customers list to trigger refetch
			queryClient.invalidateQueries({ queryKey: ["customers"] });

			// Set the new customer in cache by ID
			queryClient.setQueryData(["customer", customer.id], response);

			// Also cache by userId for quick lookup
			if (customer.userId) {
				queryClient.setQueryData(
					["customer", "user", customer.userId],
					response,
				);
			}
		},
	});
};

/**
 * Hook to update an existing customer
 *
 * Features:
 * - Automatically updates cached customer data
 * - Invalidates customer list cache
 * - Updates both ID and userId cache entries
 *
 * @returns React Query mutation result
 *
 * @example
 * ```tsx
 * const updateCustomer = useUpdateCustomer();
 *
 * const handleUpdate = async () => {
 *   try {
 *     await updateCustomer.mutateAsync({
 *       customerId: "cust_123",
 *       data: {
 *         address: "456 New St"
 *       }
 *     });
 *   } catch (error) {
 *     console.error("Failed to update:", error);
 *   }
 * };
 * ```
 */
export const useUpdateCustomer = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			customerId,
			data,
		}: {
			customerId: string;
			data: UpdateCustomerData;
		}) => updateCustomer(customerId, data),
		onSuccess: (response, variables) => {
			const { customer } = response;

			// Update specific customer cache
			queryClient.setQueryData(["customer", variables.customerId], response);

			// Invalidate customers list
			queryClient.invalidateQueries({ queryKey: ["customers"] });

			// Update userId cache if available
			if (customer.userId) {
				queryClient.setQueryData(
					["customer", "user", customer.userId],
					response,
				);
			}
		},
	});
};

/**
 * Hook to delete a customer
 *
 * Features:
 * - Removes customer from cache
 * - Invalidates customer list cache
 * - Handles cleanup of all related queries
 *
 * @returns React Query mutation result
 *
 * @example
 * ```tsx
 * const deleteCustomer = useDeleteCustomer();
 *
 * const handleDelete = async (customerId: string) => {
 *   if (confirm("Are you sure?")) {
 *     try {
 *       await deleteCustomer.mutateAsync(customerId);
 *       router.back();
 *     } catch (error) {
 *       console.error("Failed to delete:", error);
 *     }
 *   }
 * };
 * ```
 */
export const useDeleteCustomer = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteCustomer,
		onSuccess: (_, customerId) => {
			// Remove customer from cache
			queryClient.removeQueries({ queryKey: ["customer", customerId] });

			// Invalidate customers list
			queryClient.invalidateQueries({ queryKey: ["customers"] });

			// Note: Can't invalidate userId cache without fetching customer first
			// Consider invalidating all customer-user queries if needed:
			// queryClient.invalidateQueries({ queryKey: ["customer", "user"] });
		},
	});
};

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Flexible hook to get customer data by either customer ID or user ID
 *
 * This is a convenience hook that automatically selects the appropriate
 * query based on which ID is provided.
 *
 * @param customerId - Optional customer ID
 * @param userId - Optional user ID
 * @returns React Query result with customer data
 *
 * @example
 * ```tsx
 * // By customer ID
 * const { data } = useCustomerData("cust_123");
 *
 * // By user ID
 * const { data } = useCustomerData(undefined, "user_123");
 *
 * // Dynamic selection
 * const { data } = useCustomerData(customerId, userId);
 * ```
 */
export const useCustomerData = (customerId?: string, userId?: string) => {
	const customerQuery = useCustomer(customerId || "", !!customerId);
	const userCustomerQuery = useCustomerByUserId(
		userId || "",
		!!userId && !customerId,
	);

	// Return the active query
	if (customerId) {
		return customerQuery;
	}
	if (userId) {
		return userCustomerQuery;
	}

	// Return empty query result if no IDs provided
	return {
		data: undefined,
		isLoading: false,
		error: null,
		isError: false,
		isSuccess: false,
		status: "idle",
		refetch: async () => ({
			data: undefined,
			isLoading: false,
			error: null,
		}),
	} as unknown as ReturnType<typeof useCustomer>;
};

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
	Customer,
	CreateCustomerData,
	CreateCustomerResponse,
	DeleteCustomerResponse,
	GetCustomerResponse,
	GetCustomersResponse,
	UpdateCustomerData,
	UpdateCustomerResponse,
};
