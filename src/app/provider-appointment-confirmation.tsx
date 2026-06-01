import { Save } from "lucide-react-native";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { AppointmentConfirmationSettings } from "@/components/provider-profile/appointment-confirmation-settings";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useUpdateHealthcareProvider } from "@/hooks/use-procedures";
import { normalizeAppointmentConfirmationLeadHours } from "@/constants/appointment-notification-lead-hours";
import { showErrorMessageToast, showSuccessToast } from "@/services/toast";

type AppointmentConfirmationForm = {
	appointmentConfirmationReminderHoursBefore: string;
};

export default function ProviderAppointmentConfirmationScreen() {
	const { t } = useTranslation();
	const { healthcareProvider } = useAuth();
	const updateHealthcareProvider = useUpdateHealthcareProvider();
	const { control, handleSubmit, reset } = useForm<AppointmentConfirmationForm>({
		defaultValues: {
			appointmentConfirmationReminderHoursBefore: "24",
		},
	});

	useEffect(() => {
		reset({
			appointmentConfirmationReminderHoursBefore:
				healthcareProvider?.appointmentConfirmationReminderHoursBefore?.toString() ||
				"24",
		});
	}, [healthcareProvider, reset]);

	function onSubmit(values: AppointmentConfirmationForm) {
		if (!healthcareProvider?.id) {
			return;
		}

		updateHealthcareProvider.mutate(
			{
				providerId: healthcareProvider.id,
				data: {
					appointmentConfirmationReminderHoursBefore:
						normalizeAppointmentConfirmationLeadHours(
							values.appointmentConfirmationReminderHoursBefore,
						),
				},
			},
			{
				onSuccess: (response) => {
					reset({
						appointmentConfirmationReminderHoursBefore:
							response.healthcareProvider.appointmentConfirmationReminderHoursBefore?.toString() ||
							"24",
					});
					showSuccessToast("common.appointmentConfirmationSettingsSaved");
				},
				onError: (error) => {
					void error;
					showErrorMessageToast(
						t("common.appointmentConfirmationSettingsSaveFailed"),
					);
				},
			},
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<ScreenHeader
				title={t("common.appointmentConfirmationSettingsTitle")}
				subtitle={t("common.appointmentConfirmationSettingsDescription")}
			/>

			<ScrollView contentContainerStyle={styles.content}>
				<AppointmentConfirmationSettings control={control} />

				<View style={styles.footer}>
					<Button
						onPress={handleSubmit(onSubmit)}
						disabled={updateHealthcareProvider.isPending}
					>
						<Save size={18} color="#fff" />
						{t("common.saveChanges")}
					</Button>
				</View>
			</ScrollView>
		</SafeAreaView>
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
		paddingBottom: theme.gap(6),
	},
	footer: {
		marginTop: theme.gap(1),
	},
}));
