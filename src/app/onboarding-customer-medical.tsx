import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth";
import { getErrorMessage } from "@/services/api";

export default function OnboardingCustomerMedical() {
	const { t } = useTranslation();
	const { finishCustomerOnboarding, user, needsOnboarding } = useAuth();
	const [bloodType, setBloodType] = useState("");
	const [allergies, setAllergies] = useState("");
	const [medications, setMedications] = useState("");
	const [chronicPain, setChronicPain] = useState("");
	const [preExistingConditions, setPreExistingConditions] = useState("");
	const [surgeries, setSurgeries] = useState("");
	const [familyHistory, setFamilyHistory] = useState("");
	const [lifestyleNotes, setLifestyleNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSkipping, setIsSkipping] = useState(false);

	if (!user) {
		return <Redirect href="/login" />;
	}

	if (!needsOnboarding || user.onboardingStep !== "CUSTOMER_MEDICAL") {
		return <Redirect href="/onboarding" />;
	}

	const handleSubmit = async () => {
		setIsSubmitting(true);

		try {
			await finishCustomerOnboarding({
				medicalRecord: {
					bloodType: bloodType || null,
					allergies,
					medications,
					chronicPain,
					preExistingConditions,
					surgeries,
					familyHistory,
					lifestyleNotes,
				},
			});
		} catch (error) {
			Alert.alert(t("common.error"), getErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSkip = async () => {
		setIsSkipping(true);

		try {
			await finishCustomerOnboarding({ skipMedicalRecord: true });
		} catch (error) {
			Alert.alert(t("common.error"), getErrorMessage(error));
		} finally {
			setIsSkipping(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.badge}>{t("onboarding.customerMedicalBadge")}</Text>
				<Text style={styles.title}>{t("onboarding.customerMedicalTitle")}</Text>
				<Text style={styles.subtitle}>{t("onboarding.customerMedicalSubtitle")}</Text>

				<View style={styles.form}>
					<Field label={t("onboarding.medicalBloodType")}>
						<Input
							value={bloodType}
							onChangeText={setBloodType}
							placeholder="A+"
							autoCapitalize="characters"
						/>
					</Field>
					<Field label={t("onboarding.medicalAllergies")}>
						<Input value={allergies} onChangeText={setAllergies} />
					</Field>
					<Field label={t("onboarding.medicalMedications")}>
						<Textarea value={medications} onChangeText={setMedications} />
					</Field>
					<Field label={t("onboarding.medicalChronicPain")}>
						<Textarea value={chronicPain} onChangeText={setChronicPain} />
					</Field>
					<Field label={t("onboarding.medicalConditions")}>
						<Textarea
							value={preExistingConditions}
							onChangeText={setPreExistingConditions}
						/>
					</Field>
					<Field label={t("onboarding.medicalSurgeries")}>
						<Textarea value={surgeries} onChangeText={setSurgeries} />
					</Field>
					<Field label={t("onboarding.medicalFamilyHistory")}>
						<Textarea value={familyHistory} onChangeText={setFamilyHistory} />
					</Field>
					<Field label={t("onboarding.medicalLifestyle")}>
						<Textarea value={lifestyleNotes} onChangeText={setLifestyleNotes} />
					</Field>
				</View>

				<Button onPress={handleSubmit} disabled={isSubmitting || isSkipping}>
					{isSubmitting ? t("onboarding.creating") : t("onboarding.finish")}
				</Button>
				<Button
					variant="outline"
					onPress={handleSkip}
					disabled={isSubmitting || isSkipping}
				>
					{isSkipping ? t("onboarding.skipping") : t("onboarding.skipMedical")}
				</Button>
			</ScrollView>
		</SafeAreaView>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<View style={styles.field}>
			<Text style={styles.label}>{label}</Text>
			{children}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	content: {
		padding: theme.spacing.lg,
		gap: theme.spacing.md,
		paddingBottom: theme.spacing["2xl"],
	},
	badge: {
		fontSize: theme.fontSize.sm,
		fontWeight: "700",
		color: theme.colors.primary,
		textTransform: "uppercase",
	},
	title: {
		fontSize: theme.fontSize["2xl"],
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	subtitle: {
		fontSize: theme.fontSize.md,
		color: theme.colors.mutedForeground,
		lineHeight: 22,
	},
	form: {
		gap: theme.spacing.md,
		marginTop: theme.spacing.sm,
	},
	field: {
		gap: theme.spacing.xs,
	},
	label: {
		fontSize: theme.fontSize.sm,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
}));
