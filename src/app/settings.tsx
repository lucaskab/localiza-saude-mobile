import Constants from "expo-constants";
import {
	AlertTriangle,
	ChevronRight,
	Info,
	LifeBuoy,
	MessageSquare,
	Send,
	ShieldAlert,
	Trash2,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet as RNStyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppInfo, useCreateSupportRequest } from "@/hooks/use-settings";
import type { TranslationKey } from "@/i18n";
import { getErrorMessage } from "@/services/api";
import { showErrorMessageToast, showSuccessToast } from "@/services/toast";
import type { SupportRequestType } from "@/types/settings";

type SettingsAction = {
	type: SupportRequestType;
	icon: typeof Trash2;
	title: TranslationKey;
	description: TranslationKey;
	destructive?: boolean;
};

type SettingsFormValues = {
	subject: string;
	message: string;
	contactEmail: string;
};

const supportRequestFormSchema = z.object({
	subject: z.string().trim().max(160).optional(),
	message: z.string().trim().min(10).max(5000),
	contactEmail: z
		.string()
		.trim()
		.optional()
		.refine((value) => !value || z.string().email().safeParse(value).success, {
			message: "Invalid email",
		}),
});

const actions: SettingsAction[] = [
	{
		type: "ACCOUNT_DELETION",
		icon: Trash2,
		title: "common.requestAccountDeletion",
		description: "common.requestAccountDeletionDescription",
		destructive: true,
	},
	{
		type: "DATA_DELETION",
		icon: ShieldAlert,
		title: "common.requestDataDeletion",
		description: "common.requestDataDeletionDescription",
		destructive: true,
	},
	{
		type: "PROBLEM_REPORT",
		icon: AlertTriangle,
		title: "common.reportProblem",
		description: "common.reportProblemDescription",
	},
	{
		type: "FEEDBACK",
		icon: MessageSquare,
		title: "common.sendFeedback",
		description: "common.sendFeedbackDescription",
	},
	{
		type: "SUPPORT_CONTACT",
		icon: LifeBuoy,
		title: "common.contactSupport",
		description: "common.contactSupportDescription",
	},
];

const defaultFormValues: SettingsFormValues = {
	subject: "",
	message: "",
	contactEmail: "",
};

export default function SettingsScreen() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const [selectedAction, setSelectedAction] = useState<SettingsAction | null>(
		null,
	);
	const { data: appInfo, isLoading: isAppInfoLoading } = useAppInfo();
	const createRequest = useCreateSupportRequest();

	const { control, handleSubmit, reset } = useForm<SettingsFormValues>({
		defaultValues: defaultFormValues,
	});

	useEffect(() => {
		if (selectedAction) {
			reset(defaultFormValues);
		}
	}, [selectedAction, reset]);

	const deviceInfo = useMemo(
		() => ({
			appVersion: Constants.expoConfig?.version ?? "1.0.0",
			environment: process.env.APP_VARIANT || process.env.NODE_ENV || "development",
			platform: Platform.OS,
			apiUrl:
				Platform.OS === "android"
					? process.env.EXPO_PUBLIC_ANDROID_API_URL
					: process.env.EXPO_PUBLIC_BASE_URL,
		}),
		[],
	);

	const closeModal = () => {
		if (createRequest.isPending) {
			return;
		}

		setSelectedAction(null);
	};

	const onSubmit = async (values: SettingsFormValues) => {
		if (!selectedAction) {
			return;
		}

		const parsed = supportRequestFormSchema.safeParse(values);

		if (!parsed.success) {
			Alert.alert(t("common.checkTheForm"), t("common.messageMustHaveAtLeast10Characters"));
			return;
		}

		try {
			await createRequest.mutateAsync({
				type: selectedAction.type,
				subject: parsed.data.subject || null,
				message: parsed.data.message,
				contactEmail: parsed.data.contactEmail || null,
				appVersion: deviceInfo.appVersion,
				platform: deviceInfo.platform,
				environment: deviceInfo.environment,
			});

			setSelectedAction(null);
			showSuccessToast("common.requestSubmittedDescription");
		} catch (error) {
			showErrorMessageToast(getErrorMessage(error));
		}
	};

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<ScreenHeader
					title={t("common.settings")}
					subtitle={t("common.settingsDescription")}
					icon={Info}
					backButtonTestID="settings-back-button"
				/>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("common.accountAndData")}</Text>
					{actions.slice(0, 2).map((action) => (
						<SettingsActionRow
							key={action.type}
							action={action}
							onPress={() => setSelectedAction(action)}
						/>
					))}
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("common.supportAndFeedback")}</Text>
					{actions.slice(2).map((action) => (
						<SettingsActionRow
							key={action.type}
							action={action}
							onPress={() => setSelectedAction(action)}
						/>
					))}
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>{t("common.aboutApp")}</Text>
					<View style={styles.aboutCard}>
						<AboutRow label={t("common.appVersion")} value={deviceInfo.appVersion} />
						<AboutRow label={t("common.platform")} value={deviceInfo.platform} />
						<AboutRow
							label={t("common.environment")}
							value={deviceInfo.environment}
						/>
						<AboutRow
							label={t("common.apiUrl")}
							value={deviceInfo.apiUrl || t("common.notSet")}
						/>
						{isAppInfoLoading ? (
							<View style={styles.loadingRow}>
								<ActivityIndicator size="small" color={theme.colors.primary} />
								<Text style={styles.aboutValue}>{t("common.loading")}</Text>
							</View>
						) : (
							<>
								<AboutRow
									label={t("common.apiVersion")}
									value={appInfo?.app.apiVersion || t("common.notAvailable")}
								/>
								<AboutRow
									label={t("common.apiEnvironment")}
									value={appInfo?.app.environment || t("common.notAvailable")}
								/>
								<AboutRow
									label={t("common.serverTime")}
									value={
										appInfo?.app.serverTime
											? new Date(appInfo.app.serverTime).toLocaleString()
											: t("common.notAvailable")
									}
								/>
							</>
						)}
					</View>
				</View>
			</ScrollView>

			<Modal
				visible={Boolean(selectedAction)}
				transparent
				animationType="slide"
				onRequestClose={closeModal}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					style={styles.modalOverlay}
				>
					<Pressable style={styles.modalBackdrop} onPress={closeModal} />
					<View style={styles.modalCard}>
						<View style={styles.modalHandle} />
						<Text style={styles.modalTitle}>
							{selectedAction ? t(selectedAction.title) : ""}
						</Text>
						<Text style={styles.modalDescription}>
							{selectedAction ? t(selectedAction.description) : ""}
						</Text>

						<View style={styles.formGroup}>
							<Text style={styles.fieldLabel}>{t("common.subjectOptional")}</Text>
							<Controller
								control={control}
								name="subject"
								render={({ field }) => (
									<Input
										value={field.value}
										onChangeText={field.onChange}
										placeholder={t("common.subjectOptional")}
									/>
								)}
							/>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.fieldLabel}>{t("common.message")}</Text>
							<Controller
								control={control}
								name="message"
								render={({ field }) => (
									<Input
										value={field.value}
										onChangeText={field.onChange}
										placeholder={t("common.describeYourRequest")}
										multiline
									/>
								)}
							/>
						</View>

						<View style={styles.formGroup}>
							<Text style={styles.fieldLabel}>
								{t("common.contactEmailOptional")}
							</Text>
							<Controller
								control={control}
								name="contactEmail"
								render={({ field }) => (
									<Input
										value={field.value}
										onChangeText={field.onChange}
										placeholder="name@email.com"
										keyboardType="email-address"
										autoCapitalize="none"
									/>
								)}
							/>
						</View>

						<View style={styles.modalActions}>
							<Button variant="secondary" onPress={closeModal}>
								{t("common.cancel")}
							</Button>
							<Button
								onPress={handleSubmit(onSubmit)}
								loading={createRequest.isPending}
								disabled={createRequest.isPending}
							>
								<View style={styles.submitContent}>
									<Send
										size={16}
										color={theme.colors.primaryForeground}
										strokeWidth={2}
									/>
									<Text style={styles.submitText}>{t("common.submitRequest")}</Text>
								</View>
							</Button>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}

function SettingsActionRow({
	action,
	onPress,
}: {
	action: SettingsAction;
	onPress: () => void;
}) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const Icon = action.icon;

	return (
		<Pressable
			testID={`settings-action-${action.type}`}
			onPress={onPress}
			style={({ pressed }) => [
				styles.menuItem,
				pressed && styles.menuItemPressed,
			]}
		>
			<View
				style={[
					styles.menuIconContainer,
					action.destructive && styles.destructiveIconContainer,
				]}
			>
				<Icon
					size={20}
					color={action.destructive ? theme.colors.destructive : theme.colors.primary}
					strokeWidth={2}
				/>
			</View>
			<View style={styles.menuContent}>
				<Text
					style={[
						styles.menuLabel,
						action.destructive && styles.destructiveText,
					]}
				>
					{t(action.title)}
				</Text>
				<Text style={styles.menuDescription}>{t(action.description)}</Text>
			</View>
			<ChevronRight
				size={20}
				color={theme.colors.mutedForeground}
				strokeWidth={2}
			/>
		</Pressable>
	);
}

function AboutRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.aboutRow}>
			<Text style={styles.aboutLabel}>{label}</Text>
			<Text style={styles.aboutValue}>{value}</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	content: {
		padding: theme.gap(3),
		gap: theme.gap(3),
	},
	section: {
		gap: theme.gap(1),
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: "600",
		color: theme.colors.mutedForeground,
		paddingHorizontal: theme.gap(0.5),
		marginBottom: theme.gap(0.5),
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
	destructiveIconContainer: {
		backgroundColor: `${theme.colors.destructive}1A`,
	},
	menuContent: {
		flex: 1,
	},
	menuLabel: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	destructiveText: {
		color: theme.colors.destructive,
	},
	menuDescription: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
		lineHeight: 16,
	},
	aboutCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		gap: theme.gap(1.5),
	},
	aboutRow: {
		gap: theme.gap(0.25),
	},
	aboutLabel: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	aboutValue: {
		fontSize: 14,
		color: theme.colors.foreground,
	},
	loadingRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "flex-end",
	},
	modalBackdrop: {
		...RNStyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.45)",
	},
	modalCard: {
		backgroundColor: theme.colors.background,
		borderTopLeftRadius: theme.radius.xl,
		borderTopRightRadius: theme.radius.xl,
		padding: theme.gap(3),
		gap: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	modalHandle: {
		width: 44,
		height: 4,
		borderRadius: 999,
		backgroundColor: theme.colors.border,
		alignSelf: "center",
		marginBottom: theme.gap(1),
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	modalDescription: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
	formGroup: {
		gap: theme.gap(1),
	},
	fieldLabel: {
		fontSize: 13,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	modalActions: {
		flexDirection: "row",
		gap: theme.gap(1.5),
	},
	submitContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	submitText: {
		color: theme.colors.primaryForeground,
		fontWeight: "600",
	},
}));
