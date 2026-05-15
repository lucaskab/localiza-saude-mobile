import type { TranslationKey } from "@/i18n";
import type { NotificationPreference, NotificationType } from "@/types/notification";

export const notificationOptions: {
	type: NotificationType;
	title: TranslationKey;
	description: TranslationKey;
}[] = [
	{
		type: "APPOINTMENT_CONFIRMATION_REMINDER",
		title: "common.appointmentConfirmationReminderNotification",
		description: "common.appointmentConfirmationReminderNotificationDescription",
	},
	{
		type: "APPOINTMENT_REMINDER",
		title: "common.appointmentReminderNotification",
		description: "common.appointmentReminderNotificationDescription",
	},
	{
		type: "APPOINTMENT_STATUS_UPDATE",
		title: "common.appointmentStatusNotification",
		description: "common.appointmentStatusNotificationDescription",
	},
	{
		type: "NEW_APPOINTMENT_REQUEST",
		title: "common.newAppointmentRequestNotification",
		description: "common.newAppointmentRequestNotificationDescription",
	},
	{
		type: "WAITLIST_SLOT_AVAILABLE",
		title: "common.waitlistSlotAvailableNotification",
		description: "common.waitlistSlotAvailableNotificationDescription",
	},
];

export function defaultNotificationPreference(
	type: NotificationType,
): NotificationPreference {
	return {
		type,
		pushEnabled: true,
		emailEnabled: false,
	};
}

export function buildUpdatedNotificationPreferences(
	preferences: NotificationPreference[],
	type: NotificationType,
	channel: "pushEnabled" | "emailEnabled",
	enabled: boolean,
) {
	return notificationOptions.map((option) => {
		const currentPreference =
			preferences.find((preference) => preference.type === option.type) ||
			defaultNotificationPreference(option.type);

		return {
			type: option.type,
			pushEnabled:
				option.type === type && channel === "pushEnabled"
					? enabled
					: currentPreference.pushEnabled,
			emailEnabled:
				option.type === type && channel === "emailEnabled"
					? enabled
					: currentPreference.emailEnabled,
		};
	});
}
