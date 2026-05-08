import type { TranslationKey } from "@/i18n";

export const SERVICE_MODALITIES = {
	IN_PERSON: "IN_PERSON",
	ONLINE: "ONLINE",
	HOME_CARE: "HOME_CARE",
} as const;

export const SERVICE_MODALITY_VALUES = [
	SERVICE_MODALITIES.IN_PERSON,
	SERVICE_MODALITIES.ONLINE,
	SERVICE_MODALITIES.HOME_CARE,
] as const;

export type ServiceModality = (typeof SERVICE_MODALITY_VALUES)[number];

export const serviceModalityOptions: Array<{
	value: ServiceModality;
	labelKey: TranslationKey;
	descriptionKey: TranslationKey;
}> = [
	{
		value: SERVICE_MODALITIES.IN_PERSON,
		labelKey: "common.serviceModalityInPerson",
		descriptionKey: "common.serviceModalityInPersonDescription",
	},
	{
		value: SERVICE_MODALITIES.ONLINE,
		labelKey: "common.serviceModalityOnline",
		descriptionKey: "common.serviceModalityOnlineDescription",
	},
	{
		value: SERVICE_MODALITIES.HOME_CARE,
		labelKey: "common.serviceModalityHomeCare",
		descriptionKey: "common.serviceModalityHomeCareDescription",
	},
];

export function getServiceModalityLabelKey(value?: string | null) {
	return serviceModalityOptions.find((option) => option.value === value)
		?.labelKey;
}
