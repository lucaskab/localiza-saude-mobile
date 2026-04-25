export interface MedicalRecord {
	id: string;
	customerId: string | null;
	patientProfileId?: string | null;
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

export interface MedicalRecordData {
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

export interface GetMedicalRecordResponse {
	medicalRecord: MedicalRecord | null;
}

export interface UpsertMedicalRecordResponse {
	medicalRecord: MedicalRecord;
}
