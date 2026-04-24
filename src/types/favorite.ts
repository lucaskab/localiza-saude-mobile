import type { HealthcareProvider } from "@/types/healthcare-provider";

export interface FavoriteKey {
	customerId: string;
	healthcareProviderId: string;
}

export interface GetFavoritesResponse {
	favorites: HealthcareProvider[];
}

export interface AddFavoriteData {
	healthcareProviderId: string;
}

export interface AddFavoriteResponse {
	favorite: FavoriteKey;
}

export interface RemoveFavoriteResponse {
	message: string;
}
