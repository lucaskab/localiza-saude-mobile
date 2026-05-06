export type SupportRequestType =
	| "ACCOUNT_DELETION"
	| "DATA_DELETION"
	| "PROBLEM_REPORT"
	| "FEEDBACK"
	| "SUPPORT_CONTACT";

export type SupportRequestStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";

export interface SupportRequest {
	id: string;
	userId: string;
	type: SupportRequestType;
	subject: string | null;
	message: string;
	contactEmail: string | null;
	appVersion: string | null;
	platform: string | null;
	environment: string | null;
	status: SupportRequestStatus;
	createdAt: string;
	updatedAt: string;
}

export interface CreateSupportRequestData {
	type: SupportRequestType;
	subject?: string | null;
	message: string;
	contactEmail?: string | null;
	appVersion?: string | null;
	platform?: string | null;
	environment?: string | null;
}

export interface CreateSupportRequestResponse {
	supportRequest: SupportRequest;
}

export interface AppInfoResponse {
	app: {
		name: string;
		apiVersion: string;
		environment: string;
		serverTime: string;
	};
}
