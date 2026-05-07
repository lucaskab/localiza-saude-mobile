import type { Customer, HealthcareProvider } from "@/types/user";

export interface Rating {
	id: string;
	customerId: string;
	customer: Customer;
	healthcareProviderId: string;
	healthcareProvider: HealthcareProvider;
	rating: number;
	comment: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface RatingStats {
	averageRating: number;
	totalRatings: number;
}

export interface GetRatingsByProviderResponse {
	ratings: Rating[];
	stats: RatingStats;
}

export interface CreateRatingData {
	customerId: string;
	healthcareProviderId: string;
	rating: number;
	comment?: string | null;
}

export interface CreateRatingResponse {
	rating: Rating;
}

export interface UpdateRatingData {
	rating?: number;
	comment?: string | null;
}

export interface UpdateRatingResponse {
	rating: Rating;
}

export interface DeleteRatingResponse {
	message: string;
}
