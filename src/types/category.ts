import type { HealthcareProvider } from "@/types/user";

export type { HealthcareProvider } from "@/types/user";

export interface Category {
	id: string;
	name: string;
	description: string | null;
	createdAt: string;
	updatedAt: string;
	healthcareProviders: HealthcareProvider[];
}

export interface GetCategoriesResponse {
	categories: Category[];
}

export interface GetCategoryResponse {
	category: Category;
}

export interface CreateCategoryResponse {
	category: Category;
}

export interface UpdateCategoryResponse {
	category: Category;
}

export interface DeleteCategoryResponse {
	message: string;
}

export interface CreateCategoryData {
	name: string;
	description?: string | null;
}

export interface UpdateCategoryData {
	name?: string;
	description?: string | null;
}
