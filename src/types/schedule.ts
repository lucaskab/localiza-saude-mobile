import type { HealthcareProvider } from "@/types/user";

export interface Schedule {
	id: string;
	healthcareProviderId: string;
	healthcareProvider: HealthcareProvider;
	dayOfWeek: number;
	startTime: string;
	endTime: string;
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
