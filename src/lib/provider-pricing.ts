import type { HealthcareProvider } from "@/types/user";

export function canDisplayProviderPrices(
	provider?: Pick<HealthcareProvider, "professionalCouncil"> | null,
) {
	return provider?.professionalCouncil?.allowsPriceDisplay !== false;
}
