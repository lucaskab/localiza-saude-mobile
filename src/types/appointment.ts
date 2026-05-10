import type { PatientProfile, PatientProfileData } from "@/types/patient-profile";
import type {
	Customer,
	BaseUser,
	HealthcareProvider,
	Procedure,
	ServiceModality,
} from "@/types/user";

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

export type AppointmentRescheduleRequestStatus =
	| "PENDING"
	| "ACCEPTED"
	| "DECLINED"
	| "CANCELLED";

export interface AppointmentRescheduleRequest {
	id: string;
	appointmentId: string;
	requestedByUserId: string;
	proposedScheduledAt: string;
	status: AppointmentRescheduleRequestStatus;
	reason: string | null;
	respondedAt: string | null;
	createdAt: string;
	updatedAt: string;
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
	serviceModality: ServiceModality;
	onlineMeetingUrl: string | null;
	onlineMeetingProvider: string | null;
	onlineMeetingExternalId: string | null;
	onlineMeetingCreatedAt: string | null;
	totalDurationMinutes: number;
	totalPriceCents: number;
	notes: string | null;
	cancellationReason: string | null;
	cancellationFeeCents: number | null;
	cancellationPolicyAppliedAt: string | null;
	cancelledAt: string | null;
	cancelledByUserId: string | null;
	cancelledByUser: BaseUser | null;
	createdAt: string;
	updatedAt: string;
	appointmentProcedures: AppointmentProcedure[];
	rescheduleRequests: AppointmentRescheduleRequest[];
}

export type CreateAppointmentPatient =
	| { type: "SELF" }
	| { type: "EXISTING_PROFILE"; patientProfileId: string }
	| { type: "NEW_PROFILE"; profile: PatientProfileData };

export interface CreateAppointmentData {
	healthcareProviderId?: string;
	scheduledAt: Date | string;
	procedureIds: string[];
	serviceModality?: ServiceModality;
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
	cancellationReason?: string | null;
}

export interface UpdateAppointmentResponse {
	appointment: Appointment;
}

export interface RequestAppointmentRescheduleData {
	scheduledAt: Date | string;
	reason?: string | null;
}

export interface RespondAppointmentRescheduleData {
	action: "ACCEPT" | "DECLINE";
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

export type AppointmentWaitlistStatus = "ACTIVE" | "CANCELLED";

export interface AppointmentWaitlistEntry {
	id: string;
	customerId: string;
	customer: Customer;
	healthcareProviderId: string;
	healthcareProvider: HealthcareProvider;
	desiredScheduledAt: string;
	status: AppointmentWaitlistStatus;
	lastNotifiedAt: string | null;
	createdAt: string;
	updatedAt: string;
	procedures: Array<{
		id: string;
		waitlistEntryId: string;
		procedureId: string;
		procedure: Procedure;
		createdAt: string;
	}>;
}

export interface CreateAppointmentWaitlistEntryData {
	healthcareProviderId: string;
	scheduledAt: string;
	procedureIds: string[];
}

export interface CreateAppointmentWaitlistEntryResponse {
	waitlistEntry: AppointmentWaitlistEntry;
}
