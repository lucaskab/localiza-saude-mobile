import type { Appointment } from "@/types/appointment";

export const buildUtcDateTimeISO = (date: string, time: string) => {
	const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
	const [hours = 0, minutes = 0] = time.split(":").map(Number);

	return new Date(
		Date.UTC(year, month - 1, day, hours, minutes, 0, 0),
	).toISOString();
};

export const getAppointmentPatientName = (appointment: Appointment) =>
	appointment.patientProfile?.fullName ||
	appointment.customer?.name ||
	"Patient";

export const getAppointmentPatientSubtitle = (appointment: Appointment) => {
	if (appointment.patientProfile?.relationshipToCustomer) {
		return appointment.patientProfile.relationshipToCustomer;
	}

	if (appointment.patientProfile) {
		return appointment.customer ? "Patient profile" : "Unregistered patient";
	}

	return "Customer";
};

export const getAppointmentPatientImage = (appointment: Appointment) =>
	appointment.customer?.image || null;

export const getAppointmentPatientEmail = (appointment: Appointment) =>
	appointment.patientProfile?.email || appointment.customer?.email || null;

export const getAppointmentPatientPhone = (appointment: Appointment) =>
	appointment.patientProfile?.phone || appointment.customer?.phone || null;

export const getAppointmentCustomerUserId = (appointment: Appointment) =>
	appointment.customer?.id || null;
