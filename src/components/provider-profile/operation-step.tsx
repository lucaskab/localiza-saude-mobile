import { Clock, CreditCard, FileText, MapPin, ShieldCheck } from "lucide-react-native";
import { Controller, type Control, useWatch } from "react-hook-form";
import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { serviceModalityOptions } from "@/constants/service-modalities";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormInput } from "@/components/provider-profile/form-input";
import type { ProfileFormData } from "@/components/provider-profile/profile-form";

type ProviderOperationStepProps = {
	control: Control<ProfileFormData>;
	onManageClinic: () => void;
};

export function ProviderOperationStep({
	control,
	onManageClinic,
}: ProviderOperationStepProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const cancellationPolicyEnabled = useWatch({
		control,
		name: "cancellationPolicyEnabled",
	});
	const cancellationPolicyPenaltyType = useWatch({
		control,
		name: "cancellationPolicyPenaltyType",
	});

	return (
		<View style={styles.card}>
			<Text style={styles.sectionSubtitle}>
				{t("common.attendanceAndOperation")}
			</Text>
			<Controller
				control={control}
				name="serviceModalities"
				render={({ field: { value, onChange } }) => (
					<View style={styles.fieldGroup}>
						<Text style={styles.fieldLabel}>{t("common.serviceModalities")}</Text>
						<View style={styles.checkboxList}>
							{serviceModalityOptions.map((option) => {
								const checked = value.includes(option.value);

								return (
									<View key={option.value} style={styles.checkboxOption}>
										<Checkbox
											checked={checked}
											onCheckedChange={(nextChecked) => {
												onChange(
													nextChecked
														? [...value, option.value]
														: value.filter((item) => item !== option.value),
												);
											}}
										/>
										<View style={styles.checkboxTextContent}>
											<Text style={styles.checkboxTitle}>
												{t(option.labelKey)}
											</Text>
											<Text style={styles.checkboxDescription}>
												{t(option.descriptionKey)}
											</Text>
										</View>
									</View>
								);
							})}
						</View>
					</View>
				)}
			/>
			<View style={styles.infoBox}>
				<MapPin size={18} color={theme.colors.primary} />
				<View style={styles.infoBoxContent}>
					<Text style={styles.infoBoxTitle}>
						{t("common.inPersonCareLocation")}
					</Text>
					<Text style={styles.infoBoxText}>
						{t("common.inPersonCareLocationDescription")}
					</Text>
				</View>
			</View>
			<Button variant="outline" onPress={onManageClinic}>
				{t("common.manageClinic")}
			</Button>
			<Controller
				control={control}
				name="birthdayGreetingEmailEnabled"
				render={({ field }) => (
					<View style={styles.complianceRow}>
						<Checkbox
							checked={Boolean(field.value)}
							onCheckedChange={field.onChange}
						/>
						<View style={styles.complianceTextContainer}>
							<Text style={styles.complianceTitle}>
								{t("common.birthdayGreetingEmailEnabled")}
							</Text>
							<Text style={styles.complianceDescription}>
								{t("common.birthdayGreetingEmailDescription")}
							</Text>
						</View>
					</View>
				)}
			/>
			<FormInput
				control={control}
				icon={MapPin}
				name="homeCareRadiusKm"
				label={t("common.homeCareRadiusKm")}
				placeholder="10"
				keyboardType="numeric"
			/>
			<FormInput
				control={control}
				icon={Clock}
				name="appointmentConfirmationReminderHoursBefore"
				label={t("common.appointmentConfirmationReminderHoursBefore")}
				placeholder="24"
				keyboardType="numeric"
			/>
			<FormInput
				control={control}
				icon={Clock}
				name="appointmentReminderHoursBefore"
				label={t("common.appointmentReminderHoursBefore")}
				placeholder="1"
				keyboardType="numeric"
			/>
			<FormInput
				control={control}
				icon={ShieldCheck}
				name="acceptedInsurance"
				label={t("common.acceptedInsurance")}
				placeholder={t("common.commaSeparatedExamplesInsurance")}
			/>
			<FormInput
				control={control}
				icon={CreditCard}
				name="paymentMethods"
				label={t("common.paymentMethods")}
				placeholder={t("common.commaSeparatedExamplesPayments")}
			/>
			<FormInput
				control={control}
				icon={FileText}
				name="cancellationPolicy"
				label={t("common.cancellationPolicy")}
				placeholder={t("common.describeCancellationPolicy")}
				multiline
			/>
			<Controller
				control={control}
				name="cancellationPolicyEnabled"
				render={({ field }) => (
					<View style={styles.complianceRow}>
						<Checkbox
							checked={Boolean(field.value)}
							onCheckedChange={field.onChange}
						/>
						<View style={styles.complianceTextContainer}>
							<Text style={styles.complianceTitle}>
								{t("common.applyAutomaticCancellationPolicy")}
							</Text>
							<Text style={styles.complianceDescription}>
								{t("common.applyAutomaticCancellationPolicyDescription")}
							</Text>
						</View>
					</View>
				)}
			/>
			{cancellationPolicyEnabled ? (
				<View style={styles.cancellationPolicyBox}>
					<FormInput
						control={control}
						icon={Clock}
						name="cancellationPolicyHoursBefore"
						label={t("common.minimumNoticeHours")}
						placeholder="24"
						keyboardType="numeric"
					/>
					<Controller
						control={control}
						name="cancellationPolicyPenaltyType"
						render={({ field }) => (
							<View style={styles.segmentedGroup}>
								<Button
									variant={field.value === "" ? "default" : "outline"}
									onPress={() => field.onChange("")}
								>
									{t("common.noAutomaticFee")}
								</Button>
								<Button
									variant={field.value === "FIXED" ? "default" : "outline"}
									onPress={() => field.onChange("FIXED")}
								>
									{t("common.fixedFee")}
								</Button>
								<Button
									variant={
										field.value === "PERCENTAGE" ? "default" : "outline"
									}
									onPress={() => field.onChange("PERCENTAGE")}
								>
									{t("common.percentageFee")}
								</Button>
							</View>
						)}
					/>
					{cancellationPolicyPenaltyType === "FIXED" ? (
						<FormInput
							control={control}
							icon={CreditCard}
							name="cancellationPolicyFixedFee"
							label={t("common.fixedFeeBRL")}
							placeholder="50,00"
							keyboardType="numeric"
						/>
					) : null}
					{cancellationPolicyPenaltyType === "PERCENTAGE" ? (
						<FormInput
							control={control}
							icon={CreditCard}
							name="cancellationPolicyPercentage"
							label={t("common.percentageOfAppointment")}
							placeholder="50"
							keyboardType="numeric"
						/>
					) : null}
					<Controller
						control={control}
						name="cancellationPolicyRequiresJustification"
						render={({ field }) => (
							<View style={styles.complianceRow}>
								<Checkbox
									checked={Boolean(field.value)}
									onCheckedChange={field.onChange}
								/>
								<View style={styles.complianceTextContainer}>
									<Text style={styles.complianceTitle}>
										{t("common.requireCancellationJustification")}
									</Text>
									<Text style={styles.complianceDescription}>
										{t(
											"common.requireCancellationJustificationDescription",
										)}
									</Text>
								</View>
							</View>
						)}
					/>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	card: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(3),
		marginBottom: theme.gap(2),
	},
	sectionSubtitle: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	fieldGroup: {
		gap: theme.gap(1.5),
	},
	fieldLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	checkboxList: {
		gap: theme.gap(1.25),
	},
	checkboxOption: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: theme.gap(1.5),
		padding: theme.gap(1.75),
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.background,
	},
	checkboxTextContent: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	checkboxTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	checkboxDescription: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		lineHeight: 17,
	},
	infoBox: {
		flexDirection: "row",
		gap: theme.gap(1.5),
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.muted,
	},
	infoBoxContent: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	infoBoxTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	infoBoxText: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
	complianceRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: theme.gap(2),
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.muted,
	},
	complianceTextContainer: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	complianceTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	complianceDescription: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
	cancellationPolicyBox: {
		gap: theme.gap(2),
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.surfacePrimary,
	},
	segmentedGroup: {
		gap: theme.gap(1),
	},
}));
