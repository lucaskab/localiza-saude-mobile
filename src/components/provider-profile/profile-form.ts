import { z } from "zod";
import {
	SERVICE_MODALITY_VALUES,
	type ServiceModality,
} from "@/constants/service-modalities";
import type { HealthcareProvider } from "@/types/user";

export const profileFormSchema = z.object({
	displayName: z.string().nullable(),
	document: z.string().nullable(),
	birthDate: z.string().nullable(),
	gender: z.string().nullable(),
	languages: z.string().nullable(),
	specialty: z.string(),
	professionalCategory: z.string().nullable(),
	professionalId: z.string().nullable(),
	professionalCouncilId: z.string().nullable(),
	licenseState: z.string().nullable(),
	bio: z.string().nullable(),
	approach: z.string().nullable(),
	education: z.string().nullable(),
	certifications: z.string().nullable(),
	yearsOfExperience: z.string().nullable(),
	targetAudiences: z.string().nullable(),
	serviceModalities: z.array(z.enum(SERVICE_MODALITY_VALUES)),
	homeCareRadiusKm: z.string().nullable(),
	acceptedInsurance: z.string().nullable(),
	paymentMethods: z.string().nullable(),
	appointmentConfirmationReminderHoursBefore: z.string().nullable(),
	appointmentReminderHoursBefore: z.string().nullable(),
	cancellationPolicy: z.string().nullable(),
	cancellationPolicyEnabled: z.boolean(),
	cancellationPolicyHoursBefore: z.string().nullable(),
	cancellationPolicyPenaltyType: z
		.enum(["", "FIXED", "PERCENTAGE"])
		.default(""),
	cancellationPolicyFixedFee: z.string().nullable(),
	cancellationPolicyPercentage: z.string().nullable(),
	cancellationPolicyRequiresJustification: z.boolean(),
	birthdayGreetingEmailEnabled: z.boolean(),
	termsAccepted: z.boolean(),
	lgpdConsent: z.boolean(),
	professionalResponsibilityAccepted: z.boolean(),
	faqs: z.array(
		z.object({
			question: z.string(),
			answer: z.string(),
		}),
	),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

export type ProfileTextField = Exclude<
	keyof ProfileFormData,
	| "termsAccepted"
	| "lgpdConsent"
	| "professionalResponsibilityAccepted"
	| "serviceModalities"
	| "cancellationPolicyEnabled"
	| "cancellationPolicyRequiresJustification"
	| "birthdayGreetingEmailEnabled"
	| "faqs"
>;

export const emptyProfileForm: ProfileFormData = {
	displayName: null,
	document: null,
	birthDate: null,
	gender: null,
	languages: null,
	specialty: "",
	professionalCategory: null,
	professionalId: null,
	professionalCouncilId: null,
	licenseState: null,
	bio: null,
	approach: null,
	education: null,
	certifications: null,
	yearsOfExperience: null,
	targetAudiences: null,
	serviceModalities: [],
	homeCareRadiusKm: null,
	acceptedInsurance: null,
	paymentMethods: null,
	appointmentConfirmationReminderHoursBefore: "24",
	appointmentReminderHoursBefore: "1",
	cancellationPolicy: null,
	cancellationPolicyEnabled: false,
	cancellationPolicyHoursBefore: null,
	cancellationPolicyPenaltyType: "",
	cancellationPolicyFixedFee: null,
	cancellationPolicyPercentage: null,
	cancellationPolicyRequiresJustification: false,
	birthdayGreetingEmailEnabled: false,
	termsAccepted: false,
	lgpdConsent: false,
	professionalResponsibilityAccepted: false,
	faqs: [],
};

export function joinList(value?: string[] | null) {
	return value?.join(", ") || null;
}

export function splitList(value?: string | null) {
	return (
		value
			?.split(",")
			.map((item) => item.trim())
			.filter(Boolean) || []
	);
}

export function toAcceptanceDate(
	accepted: boolean,
	currentValue?: string | null,
) {
	if (!accepted) return null;
	return currentValue || new Date().toISOString();
}

export function priceToCents(value?: string | null) {
	const normalizedValue = value?.replace(",", ".").trim();
	if (!normalizedValue) return 0;
	return Math.round((Number(normalizedValue) || 0) * 100);
}

export function getProfileFormDefaults(
	healthcareProvider?: HealthcareProvider | null,
): ProfileFormData {
	return {
		displayName: healthcareProvider?.displayName || null,
		document: healthcareProvider?.document || null,
		birthDate: healthcareProvider?.birthDate?.slice(0, 10) || null,
		gender: healthcareProvider?.gender || null,
		languages: joinList(healthcareProvider?.languages),
		specialty: healthcareProvider?.specialty || "",
		professionalCategory: healthcareProvider?.professionalCategory || null,
		professionalId: healthcareProvider?.professionalId || null,
		professionalCouncilId: healthcareProvider?.professionalCouncilId || null,
		licenseState: healthcareProvider?.licenseState || null,
		bio: healthcareProvider?.bio || null,
		approach: healthcareProvider?.approach || null,
		education: healthcareProvider?.education || null,
		certifications: healthcareProvider?.certifications || null,
		yearsOfExperience:
			healthcareProvider?.yearsOfExperience?.toString() || null,
		targetAudiences: joinList(healthcareProvider?.targetAudiences),
		serviceModalities:
			(healthcareProvider?.serviceModalities as ServiceModality[]) || [],
		homeCareRadiusKm: healthcareProvider?.homeCareRadiusKm?.toString() || null,
		acceptedInsurance: joinList(healthcareProvider?.acceptedInsurance),
		paymentMethods: joinList(healthcareProvider?.paymentMethods),
		appointmentConfirmationReminderHoursBefore:
			healthcareProvider?.appointmentConfirmationReminderHoursBefore?.toString() ||
			"24",
		appointmentReminderHoursBefore:
			healthcareProvider?.appointmentReminderHoursBefore?.toString() || "1",
		cancellationPolicy: healthcareProvider?.cancellationPolicy || null,
		cancellationPolicyEnabled: Boolean(
			healthcareProvider?.cancellationPolicyEnabled,
		),
		cancellationPolicyHoursBefore:
			healthcareProvider?.cancellationPolicyHoursBefore?.toString() || null,
		cancellationPolicyPenaltyType:
			healthcareProvider?.cancellationPolicyPenaltyType || "",
		cancellationPolicyFixedFee:
			healthcareProvider?.cancellationPolicyFixedFeeCents !== null &&
			healthcareProvider?.cancellationPolicyFixedFeeCents !== undefined
				? (healthcareProvider.cancellationPolicyFixedFeeCents / 100).toFixed(2)
				: null,
		cancellationPolicyPercentage:
			healthcareProvider?.cancellationPolicyPercentage?.toString() || null,
		cancellationPolicyRequiresJustification: Boolean(
			healthcareProvider?.cancellationPolicyRequiresJustification,
		),
		birthdayGreetingEmailEnabled: Boolean(
			healthcareProvider?.birthdayGreetingEmailEnabled,
		),
		termsAccepted: Boolean(healthcareProvider?.termsAcceptedAt),
		lgpdConsent: Boolean(healthcareProvider?.lgpdConsentAt),
		professionalResponsibilityAccepted: Boolean(
			healthcareProvider?.professionalResponsibilityAcceptedAt,
		),
		faqs:
			healthcareProvider?.faqs?.map((faq) => ({
				question: faq.question,
				answer: faq.answer,
			})) || [],
	};
}

export function buildProfileUpdatePayload(
	data: ProfileFormData,
	healthcareProvider: HealthcareProvider,
) {
	return {
		displayName: data.displayName?.trim() || null,
		document: data.document?.trim() || null,
		birthDate: data.birthDate?.trim() || null,
		gender: data.gender?.trim() || null,
		languages: splitList(data.languages),
		specialty: data.specialty.trim(),
		professionalCategory: data.professionalCategory?.trim() || null,
		professionalId: data.professionalId?.trim() || null,
		professionalCouncilId: data.professionalCouncilId || null,
		licenseState: data.licenseState?.trim() || null,
		bio: data.bio?.trim() || null,
		approach: data.approach?.trim() || null,
		education: data.education?.trim() || null,
		certifications: data.certifications?.trim() || null,
		yearsOfExperience: data.yearsOfExperience?.trim()
			? Number(data.yearsOfExperience)
			: null,
		targetAudiences: splitList(data.targetAudiences),
		serviceModalities: data.serviceModalities,
		homeCareRadiusKm: data.homeCareRadiusKm?.trim()
			? Number(data.homeCareRadiusKm)
			: null,
		acceptedInsurance: splitList(data.acceptedInsurance),
		paymentMethods: splitList(data.paymentMethods),
		appointmentConfirmationReminderHoursBefore: Math.min(
			Math.max(Number(data.appointmentConfirmationReminderHoursBefore || 24), 1),
			168,
		),
		appointmentReminderHoursBefore: Math.min(
			Math.max(Number(data.appointmentReminderHoursBefore || 1), 1),
			168,
		),
		cancellationPolicy: data.cancellationPolicy?.trim() || null,
		cancellationPolicyEnabled: data.cancellationPolicyEnabled,
		cancellationPolicyHoursBefore: data.cancellationPolicyEnabled
			? Number(data.cancellationPolicyHoursBefore || 0)
			: null,
		cancellationPolicyPenaltyType: data.cancellationPolicyEnabled
			? data.cancellationPolicyPenaltyType || null
			: null,
		cancellationPolicyFixedFeeCents:
			data.cancellationPolicyEnabled &&
			data.cancellationPolicyPenaltyType === "FIXED"
				? priceToCents(data.cancellationPolicyFixedFee)
				: null,
		cancellationPolicyPercentage:
			data.cancellationPolicyEnabled &&
			data.cancellationPolicyPenaltyType === "PERCENTAGE"
				? Number(data.cancellationPolicyPercentage || 0)
				: null,
		cancellationPolicyRequiresJustification:
			data.cancellationPolicyEnabled &&
			data.cancellationPolicyRequiresJustification,
		birthdayGreetingEmailEnabled: data.birthdayGreetingEmailEnabled,
		termsAcceptedAt: toAcceptanceDate(
			data.termsAccepted,
			healthcareProvider.termsAcceptedAt,
		),
		lgpdConsentAt: toAcceptanceDate(
			data.lgpdConsent,
			healthcareProvider.lgpdConsentAt,
		),
		professionalResponsibilityAcceptedAt: toAcceptanceDate(
			data.professionalResponsibilityAccepted,
			healthcareProvider.professionalResponsibilityAcceptedAt,
		),
		faqs: data.faqs
			.map((faq) => ({
				question: faq.question.trim(),
				answer: faq.answer.trim(),
			}))
			.filter((faq) => faq.question && faq.answer),
	};
}
