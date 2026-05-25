export type { Customer } from "@/types/user";

import type { Customer } from "@/types/user";

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

export interface CreateCustomerData {
	userId: string;
	cpf?: string | null;
	dateOfBirth?: Date | string | null;
}

export interface UpdateCustomerData {
	name?: string;
	phone?: string | null;
	cpf?: string | null;
	dateOfBirth?: Date | string | null;
	address?: import("@/types/address").AddressInput;
}
