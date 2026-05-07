import type { PatientProfile, PatientProfileData } from "@/types/patient-profile";
import type { Customer, HealthcareProvider, Procedure } from "@/types/user";

export type AppointmentStatus =
	| "SCHEDULED"
	| "CONFIRMED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "CANCELLED"
	| "NO_SHOW";

export interface AppointmentProcedure {
	id: string;
	appointmentId: string;
	procedureId: string;
	procedure: Procedure;
	createdAt: string;
}

export interface Appointment {
	id: string;
	customerId: string | null;
	customer: Customer | null;
	patientProfileId: string | null;
	patientProfile: PatientProfile | null;
	healthcareProviderId: string;
	healthcareProvider: HealthcareProvider;
	scheduledAt: string;
	status: AppointmentStatus;
	totalDurationMinutes: number;
	totalPriceCents: number;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	appointmentProcedures: AppointmentProcedure[];
}

export type CreateAppointmentPatient =
	| { type: "SELF" }
	| { type: "EXISTING_PROFILE"; patientProfileId: string }
	| { type: "NEW_PROFILE"; profile: PatientProfileData };

export interface CreateAppointmentData {
	healthcareProviderId?: string;
	scheduledAt: Date | string;
	procedureIds: string[];
	notes?: string | null;
	patient?: CreateAppointmentPatient;
}

export interface GetAppointmentsResponse {
	appointments: Appointment[];
	total?: number;
	limit?: number;
	offset?: number;
	hasMore?: boolean;
}

export interface GetAppointmentByIdResponse {
	appointment: Appointment;
}

export interface CreateAppointmentResponse {
	appointment: Appointment;
}

export interface UpdateAppointmentData {
	scheduledAt?: Date | string;
	status?: AppointmentStatus;
	notes?: string | null;
}

export interface UpdateAppointmentResponse {
	appointment: Appointment;
}

export interface DeleteAppointmentResponse {
	message: string;
}

export interface AvailableSlot {
	startTime: string;
	endTime: string;
	available: boolean;
}

export interface GetAvailabilityResponse {
	date: string;
	totalDurationMinutes: number;
	availableSlots: AvailableSlot[];
}

export interface TimeSlot {
	startTime: string;
	endTime: string;
	available: boolean;
}

export interface GetTimeSlotsResponse {
	date: string;
	healthcareProviderId: string;
	totalDurationMinutes: number;
	slotIntervalMinutes: number;
	workingHours: {
		startTime: string;
		endTime: string;
	};
	slots: TimeSlot[];
}
