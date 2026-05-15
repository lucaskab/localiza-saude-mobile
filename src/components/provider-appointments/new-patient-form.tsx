import { HeartPulse, Mail, Phone, ShieldPlus, User } from "lucide-react-native";
import { Controller, type Control } from "react-hook-form";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import type { ProviderAppointmentFormData } from "@/components/provider-appointments/form";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type NewPatientFormProps = {
	control: Control<ProviderAppointmentFormData>;
	todayDate: string;
};

export function NewPatientForm({
	control,
	todayDate,
}: NewPatientFormProps) {
	const { t } = useTranslation();

	return (
		<View style={styles.form}>
			<Controller
				control={control}
				name="patientFullName"
				render={({ field: { value, onChange } }) => (
					<Input
						leftIcon={User}
						placeholder={t("common.fullName")}
						value={value}
						onChangeText={onChange}
					/>
				)}
			/>
			<View style={styles.fieldRow}>
				<Controller
					control={control}
					name="patientDateOfBirth"
					render={({ field: { value, onChange } }) => (
						<DatePickerInput
							placeholder="common.birthDate"
							title="common.selectBirthDate"
							value={value}
							onChange={onChange}
							containerStyle={styles.fieldHalf}
							maxDate={todayDate}
							allowClear
						/>
					)}
				/>
				<Controller
					control={control}
					name="patientGender"
					render={({ field: { value, onChange } }) => (
						<Input
							placeholder={t("common.gender")}
							value={value}
							onChangeText={onChange}
							containerStyle={styles.fieldHalf}
						/>
					)}
				/>
			</View>
			<View style={styles.fieldRow}>
				<Controller
					control={control}
					name="patientPhone"
					render={({ field: { value, onChange } }) => (
						<Input
							leftIcon={Phone}
							placeholder={t("common.phone")}
							value={value}
							onChangeText={onChange}
							keyboardType="phone-pad"
							containerStyle={styles.fieldHalf}
						/>
					)}
				/>
				<Controller
					control={control}
					name="patientEmail"
					render={({ field: { value, onChange } }) => (
						<Input
							leftIcon={Mail}
							placeholder={t("common.email")}
							value={value}
							onChangeText={onChange}
							autoCapitalize="none"
							keyboardType="email-address"
							containerStyle={styles.fieldHalf}
						/>
					)}
				/>
			</View>
			<Controller
				control={control}
				name="patientCpf"
				render={({ field: { value, onChange } }) => (
					<Input
						placeholder={t("common.cPF")}
						value={value}
						onChangeText={onChange}
					/>
				)}
			/>
			<Text style={styles.fieldGroupTitle}>{t("common.healthContext")}</Text>
			<View style={styles.fieldRow}>
				<Controller
					control={control}
					name="patientBloodType"
					render={({ field: { value, onChange } }) => (
						<Input
							leftIcon={ShieldPlus}
							placeholder={t("common.bloodType")}
							value={value}
							onChangeText={onChange}
							containerStyle={styles.fieldHalf}
						/>
					)}
				/>
				<Controller
					control={control}
					name="patientMedications"
					render={({ field: { value, onChange } }) => (
						<Input
							placeholder={t("common.medications")}
							value={value}
							onChangeText={onChange}
							containerStyle={styles.fieldHalf}
						/>
					)}
				/>
			</View>
			<Controller
				control={control}
				name="patientAllergies"
				render={({ field: { value, onChange } }) => (
					<Input
						leftIcon={HeartPulse}
						placeholder={t("common.allergies")}
						value={value}
						onChangeText={onChange}
					/>
				)}
			/>
			<Controller
				control={control}
				name="patientChronicPain"
				render={({ field: { value, onChange } }) => (
					<Input
						leftIcon={HeartPulse}
						placeholder={t("common.chronicPain2")}
						value={value}
						onChangeText={onChange}
					/>
				)}
			/>
			<Controller
				control={control}
				name="patientPreExistingConditions"
				render={({ field: { value, onChange } }) => (
					<Textarea
						placeholder={t("common.preExistingConditionsSurgeriesFamilyHistory")}
						value={value}
						onChangeText={onChange}
					/>
				)}
			/>
			<View style={styles.fieldRow}>
				<Controller
					control={control}
					name="patientEmergencyContactName"
					render={({ field: { value, onChange } }) => (
						<Input
							placeholder={t("common.emergencyContact")}
							value={value}
							onChangeText={onChange}
							containerStyle={styles.fieldHalf}
						/>
					)}
				/>
				<Controller
					control={control}
					name="patientEmergencyContactPhone"
					render={({ field: { value, onChange } }) => (
						<Input
							placeholder={t("common.emergencyPhone")}
							value={value}
							onChangeText={onChange}
							keyboardType="phone-pad"
							containerStyle={styles.fieldHalf}
						/>
					)}
				/>
			</View>
			<Controller
				control={control}
				name="patientNotes"
				render={({ field: { value, onChange } }) => (
					<Textarea
						placeholder={t("common.additionalPatientNotes")}
						value={value}
						onChangeText={onChange}
					/>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	form: {
		gap: theme.gap(1.5),
	},
	fieldRow: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	fieldHalf: {
		flex: 1,
	},
	fieldGroupTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.foreground,
		textTransform: "uppercase",
		marginTop: theme.gap(1),
	},
}));
