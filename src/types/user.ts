import type { ServiceModality } from "@/constants/service-modalities";

export type UserRole = "HEALTHCARE_PROVIDER" | "CUSTOMER" | "ADMIN" | "STAFF";
export type ClinicEmployeeRole = "OWNER" | "PROVIDER" | "STAFF";
export type ClinicPermission =
	| "MANAGE_PROVIDER_PROFILE"
	| "MANAGE_PROVIDER_SCHEDULE"
	| "MANAGE_APPOINTMENTS"
	| "MANAGE_PROCEDURES"
	| "VIEW_PATIENTS"
	| "MANAGE_CLINIC_INFO"
	| "MANAGE_STAFF";
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
	checklistItems: ProcedureChecklistItem[];
}

export interface ProcedureChecklistItem {
	id: string;
	procedureId: string;
	text: string;
	position: number;
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

export interface ProfessionalCouncil {
	id: string;
	acronym: string;
	name: string;
	profession: string;
	allowsPriceDisplay: boolean;
	priceDisplayNote?: string | null;
	active: boolean;
	createdAt: string;
	updatedAt: string;
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
	professionalCouncilId: string | null;
	professionalCouncil?: ProfessionalCouncil | null;
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
	clinicLatitude?: number | null;
	clinicLongitude?: number | null;
	clinicNeighborhood?: string | null;
	clinicCity?: string | null;
	clinicState?: string | null;
	homeCareRadiusKm: number | null;
	acceptedInsurance: string[];
	paymentMethods: string[];
	bookingAvailabilityDays?: number | null;
	cancellationPolicy: string | null;
	cancellationPolicyEnabled: boolean;
	cancellationPolicyHoursBefore: number | null;
	cancellationPolicyPenaltyType: "FIXED" | "PERCENTAGE" | null;
	cancellationPolicyFixedFeeCents: number | null;
	cancellationPolicyPercentage: number | null;
	cancellationPolicyRequiresJustification: boolean;
	clinicPhotos: string[];
	birthdayGreetingEmailEnabled: boolean;
	termsAcceptedAt?: string | null;
	lgpdConsentAt?: string | null;
	professionalResponsibilityAcceptedAt?: string | null;
	nextAvailableAt?: string | null;
	startingPriceCents?: number | null;
	averageRating?: number;
	totalRatings?: number;
	completedAppointments?: number;
	confirmationRate?: number;
	distanceInKm?: number | null;
	isSuperProfessional?: boolean;
	procedures: Procedure[];
	faqs?: HealthcareProviderFaq[];
};

export type AdminUser = BaseUser & {
	role: "ADMIN";
};

export type StaffUser = BaseUser & {
	role: "STAFF";
};

export type User = Customer | HealthcareProvider | AdminUser | StaffUser;

export interface ClinicEmployee {
	id: string;
	clinicId: string;
	userId: string;
	role: ClinicEmployeeRole;
	permissions: ClinicPermission[];
	active: boolean;
	createdAt: string;
	updatedAt: string;
	user: User;
}

export interface Clinic {
	id: string;
	name: string;
	type: "MEDICAL" | "HEALTH" | "DENTAL" | "EYE" | "BEAUTY" | "FREE";
	description: string | null;
	address: string | null;
	latitude: number | null;
	longitude: number | null;
	phone: string | null;
	email: string | null;
	ownerId: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
	healthcareProviders?: HealthcareProvider[];
	employees?: ClinicEmployee[];
}
