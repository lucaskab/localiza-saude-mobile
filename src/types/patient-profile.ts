export interface PatientProfile {
	id: string;
	fullName: string;
	dateOfBirth: string | null;
	cpf: string | null;
	phone: string | null;
	email: string | null;
	address: string | null;
	gender: string | null;
	relationshipToCustomer: string | null;
	notes: string | null;
	customerOwnerId: string | null;
	createdByHealthcareProviderId: string | null;
	bloodType: string | null;
	medications: string | null;
	chronicPain: string | null;
	preExistingConditions: string | null;
	allergies: string | null;
	surgeries: string | null;
	familyHistory: string | null;
	lifestyleNotes: string | null;
	emergencyContactName: string | null;
	emergencyContactPhone: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PatientProfileData {
	fullName: string;
	dateOfBirth?: string | null;
	cpf?: string | null;
	phone?: string | null;
	email?: string | null;
	address?: string | null;
	gender?: string | null;
	relationshipToCustomer?: string | null;
	notes?: string | null;
	bloodType?: string | null;
	medications?: string | null;
	chronicPain?: string | null;
	preExistingConditions?: string | null;
	allergies?: string | null;
	surgeries?: string | null;
	familyHistory?: string | null;
	lifestyleNotes?: string | null;
	emergencyContactName?: string | null;
	emergencyContactPhone?: string | null;
}

export interface GetPatientProfilesResponse {
	patientProfiles: PatientProfile[];
}

export interface CreatePatientProfileResponse {
	patientProfile: PatientProfile;
}
