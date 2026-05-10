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

export type ScheduleExceptionType =
	| "DAY_OFF"
	| "TIME_BLOCK"
	| "SPECIAL_HOURS"
	| "EXTRA_SLOT";

export interface ScheduleException {
	id: string;
	healthcareProviderId: string;
	healthcareProvider: HealthcareProvider;
	date: string;
	type: ScheduleExceptionType;
	startTime: string | null;
	endTime: string | null;
	reason: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface GetSchedulesResponse {
	schedules: Schedule[];
}

export interface GetScheduleExceptionsResponse {
	exceptions: ScheduleException[];
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

export interface CreateScheduleExceptionData {
	healthcareProviderId: string;
	date: string;
	type: ScheduleExceptionType;
	startTime?: string | null;
	endTime?: string | null;
	reason?: string | null;
}

export interface CreateScheduleExceptionResponse {
	exception: ScheduleException;
}

export interface UpdateScheduleExceptionData {
	date?: string;
	type?: ScheduleExceptionType;
	startTime?: string | null;
	endTime?: string | null;
	reason?: string | null;
	isActive?: boolean;
}

export interface UpdateScheduleExceptionResponse {
	exception: ScheduleException;
}
