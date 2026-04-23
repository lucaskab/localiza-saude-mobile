// Customer entity type matching backend schema
export interface Customer {
	id: string;
	userId: string;
	cpf: string | null;
	dateOfBirth: string | null; // ISO date string
	address: string | null;
	createdAt: string; // ISO date string
	updatedAt: string; // ISO date string
}

// API Response types
export interface GetCustomersResponse {
	customers: Customer[];
}

export interface GetCustomerResponse {
	customer: Customer;
}

export interface CreateCustomerResponse {
	customer: Customer;
}

export interface UpdateCustomerResponse {
	customer: Customer;
}

export interface DeleteCustomerResponse {
	message: string;
}

// API Request types
export interface CreateCustomerData {
	userId: string;
	cpf?: string | null;
	dateOfBirth?: Date | string | null; // Can accept Date object or ISO string
	address?: string | null;
}

export interface UpdateCustomerData {
	cpf?: string | null;
	dateOfBirth?: Date | string | null; // Can accept Date object or ISO string
	address?: string | null;
}

// Extended Customer type with User relation (for future use)
export interface CustomerWithUser extends Customer {
	user: {
		id: string;
		name: string;
		email: string;
		phone: string | null;
		image: string | null;
		role: string;
	};
}
