import { useState } from "react";
import {
	BadgeCheck,
	CalendarCheck,
	ChevronRight,
	HeartPulse,
	ShieldCheck,
	Sparkles,
	Stethoscope,
	UserRound,
	type LucideIcon,
} from "lucide-react-native";
import { Redirect } from "expo-router";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { getErrorMessage } from "@/services/api";

type OnboardingRole = "CUSTOMER" | "HEALTHCARE_PROVIDER";

export default function Onboarding() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { completeOnboarding, isHealthcareProvider, needsOnboarding } =
		useAuth();
	const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(null);

	if (!needsOnboarding) {
		return (
			<Redirect
				href={
					isHealthcareProvider
						? "/(provider-tabs)/dashboard"
						: "/(bottom-tabs)/home"
				}
			/>
		);
	}

	const handleSelectRole = async (role: OnboardingRole) => {
		setSelectedRole(role);

		try {
			await completeOnboarding(role);
		} catch (error) {
			setSelectedRole(null);
			Alert.alert(t("common.error"), getErrorMessage(error));
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<View style={styles.logoContainer}>
						<Stethoscope
							size={32}
							color={theme.colors.primaryForeground}
							strokeWidth={2.5}
						/>
					</View>
					<Text style={styles.badge}>{t("common.firstAccess")}</Text>
					<Text style={styles.title}>{t("common.howDoYouWantToUseApp")}</Text>
					<Text style={styles.subtitle}>
						{t("common.chooseAccountTypeFirstLogin")}
					</Text>
				</View>

				<View style={styles.cardsContainer}>
					<RoleCard
						actionLabel={t("common.createPatientAccount")}
						description={t("common.patientOnboardingDescription")}
						disabled={Boolean(selectedRole)}
						icon={UserRound}
						isLoading={selectedRole === "CUSTOMER"}
						onPress={() => handleSelectRole("CUSTOMER")}
						title={t("common.iWantToCareForMyHealth")}
						items={[
							t("common.bookAndTrackAppointments"),
							t("common.saveFavoriteProfessionals"),
							t("common.keepMedicalRecordUpdated"),
						]}
					/>

					<RoleCard
						actionLabel={t("common.createProviderAccount")}
						description={t("common.providerOnboardingDescription")}
						disabled={Boolean(selectedRole)}
						icon={HeartPulse}
						isLoading={selectedRole === "HEALTHCARE_PROVIDER"}
						onPress={() => handleSelectRole("HEALTHCARE_PROVIDER")}
						title={t("common.iAmHealthcareProvider")}
						items={[
							t("common.submitDataForVerification"),
							t("common.registerProceduresAndPrices"),
							t("common.organizeScheduleAndCare"),
						]}
					/>
				</View>

				<View style={styles.trustContainer}>
					<TrustItem icon={ShieldCheck} label={t("common.secureSession")} />
					<TrustItem icon={BadgeCheck} label={t("common.professionalVerification")} />
					<TrustItem icon={CalendarCheck} label={t("common.guidedSetup")} />
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function RoleCard({
	actionLabel,
	description,
	disabled,
	icon: Icon,
	isLoading,
	items,
	onPress,
	title,
}: {
	actionLabel: string;
	description: string;
	disabled: boolean;
	icon: LucideIcon;
	isLoading: boolean;
	items: string[];
	onPress: () => void;
	title: string;
}) {
	const { theme } = useUnistyles();

	return (
		<View style={styles.roleCard}>
			<View style={styles.roleHeader}>
				<View style={styles.roleIcon}>
					<Icon size={26} color={theme.colors.primary} strokeWidth={2.4} />
				</View>
				<View style={styles.roleCopy}>
					<Text style={styles.roleTitle}>{title}</Text>
					<Text style={styles.roleDescription}>{description}</Text>
				</View>
			</View>

			<View style={styles.benefitsContainer}>
				{items.map((item) => (
					<View key={item} style={styles.benefitItem}>
						<Sparkles size={16} color={theme.colors.primary} />
						<Text style={styles.benefitText}>{item}</Text>
					</View>
				))}
			</View>

			<Button
				disabled={disabled}
				loading={isLoading}
				onPress={onPress}
				size="lg"
				style={styles.roleButton}
			>
				<View style={styles.buttonContent}>
					<Text style={styles.buttonText}>{actionLabel}</Text>
					{isLoading ? null : (
						<ChevronRight
							size={18}
							color={theme.colors.primaryForeground}
							strokeWidth={2.4}
						/>
					)}
				</View>
			</Button>
		</View>
	);
}

function TrustItem({
	icon: Icon,
	label,
}: {
	icon: LucideIcon;
	label: string;
}) {
	const { theme } = useUnistyles();

	return (
		<View style={styles.trustItem}>
			<Icon size={16} color={theme.colors.primary} strokeWidth={2.3} />
			<Text style={styles.trustText}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	scrollContent: {
		flexGrow: 1,
		maxWidth: 560,
		width: "100%",
		alignSelf: "center",
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(4),
	},
	header: {
		alignItems: "center",
		paddingTop: theme.gap(4),
		paddingBottom: theme.gap(3),
	},
	logoContainer: {
		width: 64,
		height: 64,
		borderRadius: theme.radius.xl,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: theme.gap(2),
		backgroundColor: theme.colors.primary,
	},
	badge: {
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.primary,
		textTransform: "uppercase",
		marginBottom: theme.gap(1),
	},
	title: {
		fontSize: 28,
		lineHeight: 34,
		fontWeight: "700",
		color: theme.colors.foreground,
		textAlign: "center",
	},
	subtitle: {
		marginTop: theme.gap(1.5),
		fontSize: 15,
		lineHeight: 23,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
	cardsContainer: {
		gap: theme.gap(2),
	},
	roleCard: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.xl,
		backgroundColor: theme.colors.surfacePrimary,
		padding: theme.gap(2),
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 3,
	},
	roleHeader: {
		flexDirection: "row",
		gap: theme.gap(1.5),
		alignItems: "flex-start",
	},
	roleIcon: {
		width: 48,
		height: 48,
		borderRadius: theme.radius.lg,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.surfaceSecondary,
	},
	roleCopy: {
		flex: 1,
	},
	roleTitle: {
		fontSize: 20,
		lineHeight: 25,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	roleDescription: {
		marginTop: theme.gap(0.75),
		fontSize: 14,
		lineHeight: 21,
		color: theme.colors.mutedForeground,
	},
	benefitsContainer: {
		marginTop: theme.gap(2),
		gap: theme.gap(1),
	},
	benefitItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.surfaceMuted,
		paddingHorizontal: theme.gap(1.25),
		paddingVertical: theme.gap(1),
	},
	benefitText: {
		flex: 1,
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	roleButton: {
		marginTop: theme.gap(2),
		width: "100%",
	},
	buttonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
	},
	trustContainer: {
		marginTop: theme.gap(3),
		gap: theme.gap(1),
	},
	trustItem: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(0.75),
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.surfacePrimary,
		padding: theme.gap(1.25),
	},
	trustText: {
		fontSize: 13,
		fontWeight: "600",
		color: theme.colors.mutedForeground,
	},
}));
