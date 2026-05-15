import { Plus, Users } from "lucide-react-native";
import type { Control } from "react-hook-form";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { ProviderAppointmentFormData } from "@/components/provider-appointments/form";
import { ExistingPatientList } from "@/components/provider-appointments/existing-patient-list";
import { NewPatientForm } from "@/components/provider-appointments/new-patient-form";
import type { PatientProfile } from "@/types/patient-profile";

type PatientSectionProps = {
	control: Control<ProviderAppointmentFormData>;
	patientMode: "existing" | "new";
	existingPatientProfileId: string;
	patientProfiles: PatientProfile[];
	todayDate: string;
	onSelectNewMode: () => void;
	onSelectExistingMode: () => void;
	onSelectExistingProfile: (profileId: string) => void;
};

export function PatientSection({
	control,
	patientMode,
	existingPatientProfileId,
	patientProfiles,
	todayDate,
	onSelectNewMode,
	onSelectExistingMode,
	onSelectExistingProfile,
}: PatientSectionProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();

	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<Users size={20} color={theme.colors.primary} strokeWidth={2} />
				<Text style={styles.sectionTitle}>{t("common.patient")}</Text>
			</View>

			<View style={styles.modeGrid}>
				<Pressable
					style={[
						styles.modeButton,
						patientMode === "new" && styles.modeButtonActive,
					]}
					onPress={onSelectNewMode}
				>
					<Plus
						size={18}
						color={
							patientMode === "new"
								? theme.colors.primaryForeground
								: theme.colors.foreground
						}
					/>
					<Text
						style={[
							styles.modeButtonText,
							patientMode === "new" && styles.modeButtonTextActive,
						]}
					>
						{t("common.new")}
					</Text>
				</Pressable>
				<Pressable
					style={[
						styles.modeButton,
						patientMode === "existing" && styles.modeButtonActive,
					]}
					onPress={onSelectExistingMode}
				>
					<Users
						size={18}
						color={
							patientMode === "existing"
								? theme.colors.primaryForeground
								: theme.colors.foreground
						}
					/>
					<Text
						style={[
							styles.modeButtonText,
							patientMode === "existing" && styles.modeButtonTextActive,
						]}
					>
						{t("common.saved")}
					</Text>
				</Pressable>
			</View>

			{patientMode === "existing" ? (
				<ExistingPatientList
					patientProfiles={patientProfiles}
					existingPatientProfileId={existingPatientProfileId}
					onSelectExistingProfile={onSelectExistingProfile}
				/>
			) : null}

			{patientMode === "new" ? (
				<NewPatientForm control={control} todayDate={todayDate} />
			) : null}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	section: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(3),
		gap: theme.gap(2),
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	modeGrid: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	modeButton: {
		flex: 1,
		minHeight: 48,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(0.5),
	},
	modeButtonActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	modeButtonText: {
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	modeButtonTextActive: {
		color: theme.colors.primaryForeground,
	},
}));
