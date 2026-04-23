export interface User {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	image: string | null;
	role: string;
}

export interface HealthcareProvider {
	id: string;
	userId: string;
	specialty: string | null;
	professionalId: string | null;
	bio: string | null;
	user: User;
	createdAt: string;
	updatedAt: string;
}

export interface Schedule {
	id: string;
	healthcareProviderId: string;
	healthcareProvider: HealthcareProvider;
	dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
	startTime: string; // HH:mm format
	endTime: string; // HH:mm format
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface GetSchedulesResponse {
	schedules: Schedule[];
}

export interface GetScheduleByIdResponse {
	schedule: Schedule;
}

export interface CreateScheduleData {
	healthcareProviderId: string;
	dayOfWeek: number;
	startTime: string;
	endTime: string;
}

export interface CreateScheduleResponse {
	schedule: Schedule;
}

export interface UpdateScheduleData {
	dayOfWeek?: number;
	startTime?: string;
	endTime?: string;
	isActive?: boolean;
}

export interface UpdateScheduleResponse {
	schedule: Schedule;
}
