export interface Procedure {
	id: string;
	name: string;
	description: string | null;
	priceInCents: number;
	durationInMinutes: number;
	healthcareProviderId: string;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	id: string;
	name: string;
	firstName: string | null;
	lastName: string | null;
	phone: string | null;
	email: string;
	emailVerified: boolean;
	image: string | null;
	role: "HEALTHCARE_PROVIDER" | "CUSTOMER";
	createdAt: string;
	updatedAt: string;
}

export interface HealthcareProvider {
	id: string;
	userId: string;
	user: User;
	specialty: string | null;
	professionalId: string | null;
	bio: string | null;
	nextAvailableAt?: string | null;
	averageRating?: number;
	totalRatings?: number;
	createdAt: string;
	updatedAt: string;
	procedures: Procedure[];
}

export interface GetHealthcareProvidersResponse {
	healthcareProviders: HealthcareProvider[];
}

export interface GetHealthcareProviderByIdResponse {
	healthcareProvider: HealthcareProvider;
}
