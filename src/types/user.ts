import type { ServiceModality } from "@/constants/service-modalities";

export type UserRole = "HEALTHCARE_PROVIDER" | "CUSTOMER" | "ADMIN";
export type { ServiceModality };

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

export interface HealthcareProviderFaq {
	id?: string;
	healthcareProviderId?: string;
	question: string;
	answer: string;
	position?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface BaseUser {
	id: string;
	name: string;
	firstName?: string | null;
	lastName?: string | null;
	phone?: string | null;
	email: string;
	emailVerified: boolean;
	image: string | null;
	onboardingCompleted?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export type Customer = BaseUser & {
	role: "CUSTOMER";
	cpf: string | null;
	dateOfBirth: string | null;
	address: string | null;
};

export type HealthcareProvider = BaseUser & {
	role: "HEALTHCARE_PROVIDER";
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
	verificationRejectionReason?: string | null;
	verifiedAt: string | null;
	verifiedByUserId?: string | null;
	bio: string | null;
	approach: string | null;
	education: string | null;
	certifications: string | null;
	yearsOfExperience: number | null;
	targetAudiences: string[];
	serviceModalities: ServiceModality[];
	clinicAddress: string | null;
	homeCareRadiusKm: number | null;
	acceptedInsurance: string[];
	paymentMethods: string[];
	cancellationPolicy: string | null;
	clinicPhotos: string[];
	termsAcceptedAt?: string | null;
	lgpdConsentAt?: string | null;
	professionalResponsibilityAcceptedAt?: string | null;
	nextAvailableAt?: string | null;
	startingPriceCents?: number | null;
	averageRating?: number;
	totalRatings?: number;
	completedAppointments?: number;
	confirmationRate?: number;
	isSuperProfessional?: boolean;
	procedures: Procedure[];
	faqs?: HealthcareProviderFaq[];
};

export type AdminUser = BaseUser & {
	role: "ADMIN";
};

export type User = Customer | HealthcareProvider | AdminUser;
