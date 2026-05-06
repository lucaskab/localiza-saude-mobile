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
	displayName: string | null;
	document: string | null;
	birthDate: string | null;
	gender: string | null;
	languages: string[];
	specialty: string | null;
	professionalCategory: string | null;
	professionalId: string | null;
	licenseCouncil: string | null;
	licenseState: string | null;
	licenseDocumentFileName?: string | null;
	licenseDocumentMimeType?: string | null;
	licenseDocumentSize?: number | null;
	licenseDocumentSha256?: string | null;
	licenseDocumentUploadedAt?: string | null;
	verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
	verifiedAt: string | null;
	bio: string | null;
	approach: string | null;
	education: string | null;
	certifications: string | null;
	yearsOfExperience: number | null;
	targetAudiences: string[];
	serviceModalities: string[];
	clinicAddress: string | null;
	homeCareRadiusKm: number | null;
	acceptedInsurance: string[];
	paymentMethods: string[];
	cancellationPolicy: string | null;
	clinicPhotos: string[];
	nextAvailableAt?: string | null;
	startingPriceCents?: number | null;
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
