export interface RatingUser {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	image: string | null;
	role: string;
}

export interface RatingCustomer {
	id: string;
	userId: string;
	user: RatingUser;
	createdAt: string;
	updatedAt: string;
}

export interface RatingHealthcareProvider {
	id: string;
	userId: string;
	user: RatingUser;
	createdAt: string;
	updatedAt: string;
}

export interface Rating {
	id: string;
	customerId: string;
	customer: RatingCustomer;
	healthcareProviderId: string;
	healthcareProvider: RatingHealthcareProvider;
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
