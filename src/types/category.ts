// User type (nested in healthcare provider)
export interface User {
	id: string;
	name: string;
	firstName: string | null;
	lastName: string | null;
	email: string;
	phone: string | null;
	image: string | null;
}

// Healthcare Provider type (nested in category)
export interface HealthcareProvider {
	id: string;
	userId: string;
	specialty: string | null;
	professionalId: string | null;
	bio: string | null;
	nextAvailableAt?: string | null;
	user: User;
}

// Category entity type matching backend schema
export interface Category {
	id: string;
	name: string;
	description: string | null;
	createdAt: string; // ISO date string
	updatedAt: string; // ISO date string
	healthcareProviders: HealthcareProvider[];
}

// API Response types
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

// API Request types
export interface CreateCategoryData {
	name: string;
	description?: string | null;
}

export interface UpdateCategoryData {
	name?: string;
	description?: string | null;
}
