export type {
	HealthcareProvider,
	HealthcareProviderFaq,
	Procedure,
} from "@/types/user";

import type { HealthcareProvider } from "@/types/user";

export interface GetHealthcareProvidersResponse {
	healthcareProviders: HealthcareProvider[];
	total: number;
	limit: number;
	offset: number;
	hasMore: boolean;
}

export interface GetHealthcareProviderByIdResponse {
	healthcareProvider: HealthcareProvider;
}
