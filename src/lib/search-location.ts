import * as Location from "expo-location";
import type { Address } from "@/types/address";

export type SearchCoordinates = {
	latitude: number;
	longitude: number;
};

export type AddressLocationFallback = {
	coordinates: SearchCoordinates | null;
	city: string;
	neighborhood: string;
};

export function getAddressLocationFallback(
	address?: Address | null,
): AddressLocationFallback | null {
	if (!address) {
		return null;
	}

	const coordinates =
		typeof address.latitude === "number" &&
		typeof address.longitude === "number"
			? {
					latitude: address.latitude,
					longitude: address.longitude,
				}
			: null;

	const city = address.city?.trim() || "";
	const neighborhood = address.neighborhood?.trim() || "";

	if (!coordinates && !city && !neighborhood) {
		return null;
	}

	return {
		coordinates,
		city,
		neighborhood,
	};
}

export async function requestDeviceCoordinates(): Promise<SearchCoordinates> {
	const permission = await Location.requestForegroundPermissionsAsync();

	if (permission.status !== "granted") {
		throw new Error("denied");
	}

	const location = await Location.getCurrentPositionAsync({
		accuracy: Location.Accuracy.Balanced,
	});

	return {
		latitude: location.coords.latitude,
		longitude: location.coords.longitude,
	};
}
