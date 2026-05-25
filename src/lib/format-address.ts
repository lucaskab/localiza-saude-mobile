import type { Address } from "@/types/address";

export function formatAddress(address?: Address | null) {
	if (!address) {
		return null;
	}

	if (address.formattedAddress) {
		return address.formattedAddress;
	}

	return [
		`${address.street}, ${address.number}`,
		address.complement,
		address.neighborhood,
		`${address.city} - ${address.state}`,
		address.postalCode,
	]
		.filter(Boolean)
		.join(", ");
}

export function getProviderCareAddress(provider: {
	primaryAddress?: Address | null;
}) {
	return formatAddress(provider.primaryAddress);
}

export function getProviderLocationLabel(provider: {
	primaryAddress?: Address | null;
}) {
	const address = provider.primaryAddress;
	if (!address) {
		return null;
	}

	return [address.neighborhood, address.city].filter(Boolean).join(" · ");
}
