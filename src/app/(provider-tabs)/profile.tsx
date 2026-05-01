import { useRouter } from "expo-router";
import {
	Bell,
	BriefcaseBusiness,
	CalendarClock,
	ChevronRight,
	Globe2,
	LogOut,
	MessageSquareText,
	Settings,
	UserRoundCog,
} from "lucide-react-native";
import type { ComponentType } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useProceduresByProvider } from "@/hooks/use-procedures";
import type { TranslationKey } from "@/i18n";

type ProviderMenuItem = {
	icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
	label: TranslationKey;
	description: TranslationKey;
	route?: string;
	testID: string;
};

const providerMenuItems: ProviderMenuItem[] = [
	{
		icon: UserRoundCog,
		label: "common.professionalProfile",
		description: "common.updateSpecialtyBioProfessionalId",
		route: "/provider-profile-edit",
		testID: "provider-profile-menu-professional-profile",
	},
	{
		icon: BriefcaseBusiness,
		label: "common.procedures",
		description: "common.manageProceduresDescription",
		route: "/provider-procedures",
		testID: "provider-profile-menu-procedures",
	},
	{
		icon: CalendarClock,
		label: "common.schedule",
		description: "common.workingScheduleDescription",
		route: "/provider-schedule",
		testID: "provider-profile-menu-schedule",
	},
	{
		icon: MessageSquareText,
		label: "common.reviews",
		description: "common.patientReviewsDescription",
		route: "/(provider-tabs)/ratings",
		testID: "provider-profile-menu-reviews",
	},
	{
		icon: Bell,
		label: "common.notifications",
		description: "common.manageYourNotifications",
		route: "/notification-settings",
		testID: "provider-profile-menu-notifications",
	},
	{
		icon: Globe2,
		label: "common.language",
		description: "common.choosePreferredLanguage",
		route: "/language-settings",
		testID: "provider-profile-menu-language",
	},
	{
		icon: Settings,
		label: "common.settings",
		description: "common.providerAccountSettingsDescription",
		testID: "provider-profile-menu-settings",
	},
];

export default function ProviderProfile() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { healthcareProvider, signOut } = useAuth();
	const insets = useSafeAreaInsets();
	const router = useRouter();

	const {
		data: proceduresData,
		isLoading: isProceduresLoading,
	} = useProceduresByProvider({
		healthcareProviderId: healthcareProvider?.id || "",
		enabled: !!healthcareProvider?.id,
	});

	const proceduresCount = proceduresData?.procedures.length ?? 0;
	const hasProfessionalId = Boolean(healthcareProvider?.professionalId);

	const handleSignOut = () => {
		Alert.alert(t("common.logout"), t("common.doYouWantToSignOutOfYourAccount"), [
			{ text: t("common.cancel"), style: "cancel" },
			{
				text: t("common.logout"),
				style: "destructive",
				onPress: () => signOut(),
			},
		]);
	};

	return (
		<View style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View
					style={[styles.header, { paddingTop: insets.top + theme.gap(3) }]}
				>
					<Text style={styles.headerTitle}>{t("common.profile")}</Text>

					<View style={styles.userInfo}>
						<Avatar source={healthcareProvider?.user?.image} size="md" />
						<View style={styles.userDetails}>
							<Text style={styles.userName}>
								{healthcareProvider?.user?.name || t("common.provider")}
							</Text>
							<Text style={styles.userEmail}>
								{healthcareProvider?.user?.email || t("common.notSet")}
							</Text>
							<Text style={styles.userSpecialty}>
								{healthcareProvider?.specialty || t("common.specialty")}
							</Text>
						</View>
					</View>

					<Button
						variant="secondary"
						size="sm"
						style={styles.editButton}
						testID="provider-profile-edit-button"
						onPress={() => router.push("/provider-profile-edit" as never)}
					>
						{t("common.editProfile")}
					</Button>
				</View>

				<View style={styles.statsContainer}>
					<View style={styles.statCard}>
						{isProceduresLoading ? (
							<ActivityIndicator size="small" color={theme.colors.primary} />
						) : (
							<Text style={styles.statValue}>{proceduresCount}</Text>
						)}
						<Text style={styles.statLabel}>{t("common.procedures")}</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statValue}>
							{hasProfessionalId ? t("common.yes") : t("common.no")}
						</Text>
						<Text style={styles.statLabel}>{t("common.professionalID")}</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statValue}>
							{healthcareProvider?.specialty ? t("common.yes") : t("common.no")}
						</Text>
						<Text style={styles.statLabel}>{t("common.specialty")}</Text>
					</View>
				</View>

				<View style={styles.menuContainer}>
					<View style={styles.menuList}>
						{providerMenuItems.map((item) => {
							const Icon = item.icon;

							return (
								<Pressable
									key={item.label}
									testID={item.testID}
									onPress={() => {
										if (item.route) {
											router.push(item.route as never);
										}
									}}
									style={({ pressed }) => [
										styles.menuItem,
										pressed && styles.menuItemPressed,
									]}
								>
									<View style={styles.menuIconContainer}>
										<Icon
											size={20}
											color={theme.colors.primary}
											strokeWidth={2}
										/>
									</View>
									<View style={styles.menuContent}>
										<Text style={styles.menuLabel}>{t(item.label)}</Text>
										<Text style={styles.menuDescription}>
											{t(item.description)}
										</Text>
									</View>
									{item.route ? (
										<ChevronRight
											size={20}
											color={theme.colors.mutedForeground}
											strokeWidth={2}
										/>
									) : null}
								</Pressable>
							);
						})}
					</View>

					<Pressable
						onPress={handleSignOut}
						style={({ pressed }) => [
							styles.logoutItem,
							pressed && styles.logoutItemPressed,
						]}
					>
						<View style={styles.logoutIconContainer}>
							<LogOut
								size={20}
								color={theme.colors.destructive}
								strokeWidth={2}
							/>
						</View>
						<View style={styles.menuContent}>
							<Text style={styles.logoutLabel}>{t("common.logout")}</Text>
							<Text style={styles.menuDescription}>
								{t("common.signOutOfYourProviderAccount")}
							</Text>
						</View>
					</Pressable>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(4),
		borderBottomLeftRadius: theme.radius.xl,
		borderBottomRightRadius: theme.radius.xl,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "500",
		color: theme.colors.primaryForeground,
		marginBottom: theme.gap(3),
	},
	userInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	userDetails: {
		flex: 1,
	},
	userName: {
		fontSize: 18,
		fontWeight: "500",
		color: theme.colors.primaryForeground,
	},
	userEmail: {
		fontSize: 14,
		color: theme.colors.primaryForeground,
		opacity: 0.9,
		marginTop: theme.gap(0.5),
	},
	userSpecialty: {
		fontSize: 14,
		color: theme.colors.primaryForeground,
		opacity: 0.9,
		marginTop: theme.gap(0.5),
	},
	editButton: {
		marginTop: theme.gap(3),
	},
	statsContainer: {
		flexDirection: "row",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(3),
		paddingVertical: theme.gap(3),
	},
	statCard: {
		flex: 1,
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 78,
	},
	statValue: {
		fontSize: 22,
		color: theme.colors.primary,
		fontWeight: "600",
		marginBottom: theme.gap(0.5),
	},
	statLabel: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
	menuContainer: {
		flex: 1,
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(3),
	},
	menuList: {
		gap: theme.gap(1),
	},
	menuItem: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	menuItemPressed: {
		backgroundColor: theme.colors.secondary,
		opacity: 0.5,
	},
	menuIconContainer: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	menuContent: {
		flex: 1,
	},
	menuLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	menuDescription: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	logoutItem: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		marginTop: theme.gap(1),
	},
	logoutItemPressed: {
		backgroundColor: `${theme.colors.destructive}1A`,
	},
	logoutIconContainer: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: `${theme.colors.destructive}1A`,
		alignItems: "center",
		justifyContent: "center",
	},
	logoutLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.destructive,
	},
}));
