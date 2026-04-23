import { api } from "@/services/api";
import type {
	Category,
	CreateCategoryData,
	CreateCategoryResponse,
	DeleteCategoryResponse,
	GetCategoriesResponse,
	GetCategoryResponse,
	UpdateCategoryData,
	UpdateCategoryResponse,
} from "@/types/category";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Category Hooks
 *
 * This module provides React Query hooks for managing category data.
 * Categories include their associated healthcare providers for filtering.
 *
 * Available operations:
 * - GET all categories (useCategories)
 * - GET category by ID (useCategory)
 * - CREATE category (useCreateCategory) - Admin only
 * - UPDATE category (useUpdateCategory) - Admin only
 * - DELETE category (useDeleteCategory) - Admin only
 *
 * @module hooks/use-categories
 */

// ============================================================================
// Query Functions (API Calls)
// ============================================================================

/**
 * Fetches all categories with their healthcare providers
 * @returns Promise with categories array
 */
export const getCategories = async (): Promise<GetCategoriesResponse> => {
	const { data } = await api.get<GetCategoriesResponse>("/categories");
	return data;
};

/**
 * Fetches a single category by ID with its healthcare providers
 * @param categoryId - The category's unique identifier
 * @returns Promise with category data
 */
export const getCategoryById = async (
	categoryId: string,
): Promise<GetCategoryResponse> => {
	const { data } = await api.get<GetCategoryResponse>(
		`/categories/${categoryId}`,
	);
	return data;
};

/**
 * Creates a new category
 * @param data - Category creation data
 * @returns Promise with created category
 */
export const createCategory = async (
	data: CreateCategoryData,
): Promise<CreateCategoryResponse> => {
	const { data: response } = await api.post<CreateCategoryResponse>(
		"/categories",
		data,
	);
	return response;
};

/**
 * Updates an existing category
 * @param categoryId - The category's unique identifier
 * @param data - Category update data
 * @returns Promise with updated category
 */
export const updateCategory = async (
	categoryId: string,
	data: UpdateCategoryData,
): Promise<UpdateCategoryResponse> => {
	const { data: response } = await api.patch<UpdateCategoryResponse>(
		`/categories/${categoryId}`,
		data,
	);
	return response;
};

/**
 * Deletes a category
 * @param categoryId - The category's unique identifier
 * @returns Promise with deletion confirmation
 */
export const deleteCategory = async (
	categoryId: string,
): Promise<DeleteCategoryResponse> => {
	const { data } = await api.delete<DeleteCategoryResponse>(
		`/categories/${categoryId}`,
	);
	return data;
};

// ============================================================================
// Query Hooks (Read Operations)
// ============================================================================

/**
 * Hook to fetch all categories with their healthcare providers
 *
 * This hook is essential for category filtering in the UI.
 * Each category includes an array of healthcare providers.
 *
 * @param enabled - Whether the query should run (default: true)
 * @returns React Query result with categories array
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCategories();
 * const categories = data?.categories || [];
 *
 * // Access healthcare providers for a category
 * const providers = categories[0]?.healthcareProviders || [];
 * ```
 */
export const useCategories = (enabled: boolean = true) => {
	return useQuery({
		queryKey: ["categories"],
		queryFn: getCategories,
		enabled,
		staleTime: 5 * 60 * 1000, // Categories don't change often, cache for 5 minutes
	});
};

/**
 * Hook to fetch a category by ID with its healthcare providers
 *
 * @param categoryId - The category's unique identifier
 * @param enabled - Whether the query should run (default: true)
 * @returns React Query result with category data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useCategory(categoryId);
 * const category = data?.category;
 * const providers = category?.healthcareProviders || [];
 * ```
 */
export const useCategory = (categoryId: string, enabled: boolean = true) => {
	return useQuery({
		queryKey: ["category", categoryId],
		queryFn: () => getCategoryById(categoryId),
		enabled: enabled && !!categoryId,
		staleTime: 5 * 60 * 1000,
	});
};

// ============================================================================
// Mutation Hooks (Write Operations) - Admin Only
// ============================================================================

/**
 * Hook to create a new category
 *
 * Features:
 * - Automatically invalidates categories list cache
 * - Updates cache with new category data
 *
 * Note: This is typically an admin-only operation
 *
 * @returns React Query mutation result
 *
 * @example
 * ```tsx
 * const createCategory = useCreateCategory();
 *
 * const handleCreate = async () => {
 *   try {
 *     const result = await createCategory.mutateAsync({
 *       name: "Cardiology",
 *       description: "Heart and cardiovascular specialists"
 *     });
 *     Alert.alert("Success", "Category created!");
 *   } catch (error) {
 *     Alert.alert("Error", "Failed to create category");
 *   }
 * };
 * ```
 */
export const useCreateCategory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createCategory,
		onSuccess: (response) => {
			const { category } = response;

			// Invalidate categories list to trigger refetch
			queryClient.invalidateQueries({ queryKey: ["categories"] });

			// Set the new category in cache by ID
			queryClient.setQueryData(["category", category.id], response);
		},
	});
};

/**
 * Hook to update an existing category
 *
 * Features:
 * - Automatically updates cached category data
 * - Invalidates categories list cache
 *
 * Note: This is typically an admin-only operation
 *
 * @returns React Query mutation result
 *
 * @example
 * ```tsx
 * const updateCategory = useUpdateCategory();
 *
 * const handleUpdate = async () => {
 *   try {
 *     await updateCategory.mutateAsync({
 *       categoryId: "cat_123",
 *       data: {
 *         name: "Cardiology & Heart Health"
 *       }
 *     });
 *     Alert.alert("Success", "Category updated!");
 *   } catch (error) {
 *     Alert.alert("Error", "Failed to update category");
 *   }
 * };
 * ```
 */
export const useUpdateCategory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			categoryId,
			data,
		}: {
			categoryId: string;
			data: UpdateCategoryData;
		}) => updateCategory(categoryId, data),
		onSuccess: (response, variables) => {
			// Update specific category cache
			queryClient.setQueryData(["category", variables.categoryId], response);

			// Invalidate categories list
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});
};

/**
 * Hook to delete a category
 *
 * Features:
 * - Removes category from cache
 * - Invalidates categories list cache
 * - Handles cleanup of all related queries
 *
 * Note: This is typically an admin-only operation
 *
 * @returns React Query mutation result
 *
 * @example
 * ```tsx
 * const deleteCategory = useDeleteCategory();
 *
 * const handleDelete = async (categoryId: string) => {
 *   Alert.alert(
 *     "Confirm Delete",
 *     "Are you sure you want to delete this category?",
 *     [
 *       { text: "Cancel", style: "cancel" },
 *       {
 *         text: "Delete",
 *         style: "destructive",
 *         onPress: async () => {
 *           try {
 *             await deleteCategory.mutateAsync(categoryId);
 *             Alert.alert("Success", "Category deleted!");
 *           } catch (error) {
 *             Alert.alert("Error", "Failed to delete category");
 *           }
 *         },
 *       },
 *     ]
 *   );
 * };
 * ```
 */
export const useDeleteCategory = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteCategory,
		onSuccess: (_, categoryId) => {
			// Remove category from cache
			queryClient.removeQueries({ queryKey: ["category", categoryId] });

			// Invalidate categories list
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Helper function to get healthcare providers for a specific category
 * Useful for filtering providers by category in the UI
 *
 * @param categories - Array of categories
 * @param categoryId - The category ID to filter by ("all" returns all providers)
 * @returns Array of healthcare providers
 *
 * @example
 * ```tsx
 * const { data } = useCategories();
 * const categories = data?.categories || [];
 * const providers = getProvidersByCategory(categories, selectedCategoryId);
 * ```
 */
export const getProvidersByCategory = (
	categories: Category[],
	categoryId: string,
) => {
	if (categoryId === "all") {
		// Return all providers from all categories (deduplicated)
		const allProviders = categories.flatMap((cat) => cat.healthcareProviders);
		const uniqueProviders = Array.from(
			new Map(allProviders.map((p) => [p.id, p])).values(),
		);
		return uniqueProviders;
	}

	// Return providers for specific category
	const category = categories.find((cat) => cat.id === categoryId);
	return category?.healthcareProviders || [];
};

/**
 * Helper function to get category name by ID
 *
 * @param categories - Array of categories
 * @param categoryId - The category ID
 * @returns Category name or "All" if not found
 */
export const getCategoryName = (categories: Category[], categoryId: string) => {
	if (categoryId === "all") return "All";
	const category = categories.find((cat) => cat.id === categoryId);
	return category?.name || "Unknown";
};

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
	Category,
	CreateCategoryData,
	CreateCategoryResponse,
	DeleteCategoryResponse,
	GetCategoriesResponse,
	GetCategoryResponse,
	HealthcareProvider,
	UpdateCategoryData,
	UpdateCategoryResponse,
} from "@/types/category";
