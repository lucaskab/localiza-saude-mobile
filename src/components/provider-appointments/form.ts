import { z } from "zod";
import { buildRecurrencePayload, type RecurrenceFormValue } from "@/components/appointments/recurrence-fields";

const optionalTextSchema = z.string().transform((value) => {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
});

const optionalDateSchema = z.string().transform((value, context) => {
	const trimmed = value.trim();

	if (!trimmed) {
		return null;
	}

	if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
		context.addIssue({
			code: "custom",
			message: "Use YYYY-MM-DD for date of birth",
		});
		return z.NEVER;
	}

	return trimmed;
});

export const providerAppointmentSchema = z
	.object({
		selectedDate: z.date(),
		selectedTime: z.string().min(1, "Choose an available time"),
		selectedProcedureIds: z.array(z.string()).min(1, "Choose a procedure"),
		patientMode: z.enum(["existing", "new"]),
		existingPatientProfileId: z.string(),
		patientFullName: z.string(),
		patientDateOfBirth: optionalDateSchema,
		patientCpf: optionalTextSchema,
		patientPhone: optionalTextSchema,
		patientEmail: optionalTextSchema,
		patientGender: optionalTextSchema,
		patientNotes: optionalTextSchema,
		patientBloodType: optionalTextSchema,
		patientMedications: optionalTextSchema,
		patientAllergies: optionalTextSchema,
		patientChronicPain: optionalTextSchema,
		patientPreExistingConditions: optionalTextSchema,
		patientEmergencyContactName: optionalTextSchema,
		patientEmergencyContactPhone: optionalTextSchema,
		notes: optionalTextSchema,
	})
	.superRefine((value, context) => {
		if (value.patientMode === "existing" && !value.existingPatientProfileId) {
			context.addIssue({
				code: "custom",
				path: ["existingPatientProfileId"],
				message: "Choose a patient profile",
			});
		}

		if (value.patientMode === "new" && !value.patientFullName.trim()) {
			context.addIssue({
				code: "custom",
				path: ["patientFullName"],
				message: "Patient name is required",
			});
		}
	});

export type ProviderAppointmentFormData = z.input<
	typeof providerAppointmentSchema
>;
export type ParsedProviderAppointmentData = z.output<
	typeof providerAppointmentSchema
>;

export const formatUtcDateForApi = (date: Date) => {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, "0");
	const day = String(date.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

export const parseCalendarDateAsUtc = (dateString: string) => {
	const [year, month, day] = dateString.split("-").map(Number);
	return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
};

export const formatUtcDateForDisplay = (date: Date) =>
	date.toLocaleDateString("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		timeZone: "UTC",
	});

export const providerAppointmentDefaultValues: ProviderAppointmentFormData = {
	selectedDate: parseCalendarDateAsUtc(formatUtcDateForApi(new Date())),
	selectedTime: "",
	selectedProcedureIds: [],
	patientMode: "new",
	existingPatientProfileId: "",
	patientFullName: "",
	patientDateOfBirth: "",
	patientCpf: "",
	patientPhone: "",
	patientEmail: "",
	patientGender: "",
	patientNotes: "",
	patientBloodType: "",
	patientMedications: "",
	patientAllergies: "",
	patientChronicPain: "",
	patientPreExistingConditions: "",
	patientEmergencyContactName: "",
	patientEmergencyContactPhone: "",
	notes: "",
};

export function buildCalendarState({
	activeSchedules,
	bookingAvailabilityDays,
	scheduleExceptions,
	selectedDate,
	selectedColor,
}: {
	activeSchedules: Array<{ dayOfWeek: number }>;
	bookingAvailabilityDays: number;
	scheduleExceptions: Array<{
		date: string;
		type: string;
		isActive: boolean;
		startTime: string | null;
		endTime: string | null;
	}>;
	selectedDate: Date;
	selectedColor: string;
}) {
	const today = parseCalendarDateAsUtc(formatUtcDateForApi(new Date()));
	const max = new Date(today);
	max.setUTCDate(max.getUTCDate() + bookingAvailabilityDays);
	const availableDaysOfWeek = new Set(
		activeSchedules.map((schedule) => schedule.dayOfWeek),
	);
	const marked: Record<
		string,
		{
			selected?: boolean;
			selectedColor?: string;
			disabled?: boolean;
			disableTouchEvent?: boolean;
		}
	> = {};

	marked[formatUtcDateForApi(selectedDate)] = {
		selected: true,
		selectedColor,
	};

	for (let i = 0; i <= bookingAvailabilityDays; i++) {
		const date = new Date(today);
		date.setUTCDate(date.getUTCDate() + i);
		const dayOfWeek = date.getUTCDay();
		const dateStr = formatUtcDateForApi(date);
		const exceptionsForDate = scheduleExceptions.filter(
			(exception) => exception.date.slice(0, 10) === dateStr,
		);
		const hasDayOff = exceptionsForDate.some(
			(exception) =>
				exception.type === "DAY_OFF" &&
				(!exception.startTime || !exception.endTime),
		);
		const hasDateSpecificAvailability = exceptionsForDate.some((exception) =>
			["SPECIAL_HOURS", "EXTRA_SLOT"].includes(exception.type),
		);

		if (
			hasDayOff ||
			(!hasDateSpecificAvailability && !availableDaysOfWeek.has(dayOfWeek))
		) {
			marked[dateStr] = {
				...marked[dateStr],
				disabled: true,
				disableTouchEvent: true,
			};
		}
	}

	return {
		markedDates: marked,
		minDate: formatUtcDateForApi(today),
		maxDate: formatUtcDateForApi(max),
	};
}

export function buildCreateAppointmentPayload({
	values,
	providerId,
	recurrence,
}: {
	values: ParsedProviderAppointmentData;
	providerId: string;
	recurrence: RecurrenceFormValue;
}) {
	const [time, period] = values.selectedTime.split(" ");
	const [hours, minutes] = time.split(":").map(Number);
	const hour24 =
		period === "PM" && hours !== 12
			? hours + 12
			: period === "AM" && hours === 12
				? 0
				: hours;
	const appointmentDate = new Date(values.selectedDate);
	appointmentDate.setUTCHours(hour24, minutes, 0, 0);

	const customer =
		values.patientMode === "existing"
			? ({
					type: "EXISTING_PROFILE",
					patientProfileId: values.existingPatientProfileId,
				} as const)
			: ({
					type: "NEW_PROFILE",
					profile: {
						fullName: values.patientFullName.trim(),
						dateOfBirth: values.patientDateOfBirth,
						cpf: values.patientCpf,
						phone: values.patientPhone,
						email: values.patientEmail,
						gender: values.patientGender,
						notes: values.patientNotes,
						bloodType: values.patientBloodType,
						medications: values.patientMedications,
						allergies: values.patientAllergies,
						chronicPain: values.patientChronicPain,
						preExistingConditions: values.patientPreExistingConditions,
						emergencyContactName: values.patientEmergencyContactName,
						emergencyContactPhone: values.patientEmergencyContactPhone,
					},
				} as const);

	return {
		healthcareProviderId: providerId,
		scheduledAt: appointmentDate.toISOString(),
		procedureIds: values.selectedProcedureIds,
		notes: values.notes,
		customer,
		recurrence: buildRecurrencePayload(recurrence),
	};
}
