import type { Appointment } from "@/types/appointment";

export const getAppointmentPatientName = (appointment: Appointment) =>
	appointment.patientProfile?.fullName ||
	appointment.customer?.user.name ||
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
	appointment.customer?.user.image || null;

export const getAppointmentPatientEmail = (appointment: Appointment) =>
	appointment.patientProfile?.email || appointment.customer?.user.email || null;

export const getAppointmentPatientPhone = (appointment: Appointment) =>
	appointment.patientProfile?.phone || appointment.customer?.user.phone || null;

export const getAppointmentCustomerUserId = (appointment: Appointment) =>
	appointment.customer?.user.id || null;
