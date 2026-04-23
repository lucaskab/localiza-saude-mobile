export type AppointmentStatus =
	| "SCHEDULED"
	| "CONFIRMED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "CANCELLED"
	| "NO_SHOW";

export interface User {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	image: string | null;
	role: string;
}

export interface Customer {
	id: string;
	userId: string;
	user: User;
	createdAt: string;
	updatedAt: string;
}

export interface HealthcareProvider {
	id: string;
	userId: string;
	specialty: string | null;
	professionalId: string | null;
	user: User;
	createdAt: string;
	updatedAt: string;
}

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

export interface AppointmentProcedure {
	id: string;
	appointmentId: string;
	procedureId: string;
	procedure: Procedure;
	createdAt: string;
}

export interface Appointment {
	id: string;
	customerId: string;
	customer: Customer;
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

export interface CreateAppointmentData {
	healthcareProviderId: string;
	scheduledAt: Date | string;
	procedureIds: string[];
	notes?: string | null;
}

export interface GetAppointmentsResponse {
	appointments: Appointment[];
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
