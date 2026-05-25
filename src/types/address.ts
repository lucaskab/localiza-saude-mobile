export type AddressType = "HOME" | "BILLING" | "CLINIC" | "WORK" | "OTHER";

export type AddressOwnerType = "USER" | "CLINIC";

export interface AddressInput {
	type?: AddressType;
	label?: string | null;
	countryCode?: string;
	postalCode: string;
	state: string;
	city: string;
	neighborhood: string;
	street: string;
	number: string;
	complement?: string | null;
	reference?: string | null;
}

export interface Address extends AddressInput {
	id: string;
	ownerType: AddressOwnerType;
	ownerId: string;
	isPrimary: boolean;
	latitude: number | null;
	longitude: number | null;
	formattedAddress: string | null;
	createdAt: string;
	updatedAt: string;
}
