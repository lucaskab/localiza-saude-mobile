import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import type { PatientProfile } from "@/types/patient-profile";

type ExistingPatientListProps = {
	patientProfiles: PatientProfile[];
	existingPatientProfileId: string;
	onSelectExistingProfile: (profileId: string) => void;
};

export function ExistingPatientList({
	patientProfiles,
	existingPatientProfileId,
	onSelectExistingProfile,
}: ExistingPatientListProps) {
	const { t } = useTranslation();

	if (patientProfiles.length === 0) {
		return (
			<View style={styles.list}>
				<Text style={styles.emptyText}>
					{t("common.noSavedPatientProfilesYet")}
				</Text>
			</View>
		);
	}

	return (
		<View style={styles.list}>
			{patientProfiles.map((profile) => {
				const selected = profile.id === existingPatientProfileId;

				return (
					<Pressable
						key={profile.id}
						style={[
							styles.option,
							selected && styles.optionActive,
						]}
						onPress={() => onSelectExistingProfile(profile.id)}
					>
						<View style={styles.initial}>
							<Text style={styles.initialText}>
								{profile.fullName.charAt(0).toUpperCase()}
							</Text>
						</View>
						<View style={styles.info}>
							<Text style={styles.name}>{profile.fullName}</Text>
							<Text style={styles.meta}>
								{[profile.phone, profile.email]
									.filter(Boolean)
									.join(" • ") || t("common.patientProfile2")}
							</Text>
						</View>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	list: {
		gap: theme.gap(1.5),
	},
	option: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
		padding: theme.gap(1.5),
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
	},
	optionActive: {
		borderColor: theme.colors.primary,
		backgroundColor: `${theme.colors.primary}12`,
	},
	initial: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
	},
	initialText: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
	},
	info: {
		flex: 1,
	},
	name: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	meta: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
}));
