import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { AddressFormFields } from "@/components/address-form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import { getErrorMessage } from "@/services/api";
import type { AddressInput } from "@/types/address";

const initialAddress: AddressInput = {
	countryCode: "BR",
	postalCode: "",
	state: "SP",
	city: "",
	neighborhood: "",
	street: "",
	number: "",
	complement: "",
	reference: "",
};

export default function OnboardingCustomerProfile() {
	const { t } = useTranslation();
	const { completeCustomerProfile, user, needsOnboarding } = useAuth();
	const [phone, setPhone] = useState("");
	const [cpf, setCpf] = useState("");
	const [address, setAddress] = useState<AddressInput>(initialAddress);
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!user) {
		return <Redirect href="/login" />;
	}

	if (!needsOnboarding || user.onboardingStep !== "CUSTOMER_PROFILE") {
		return <Redirect href="/onboarding" />;
	}

	const handleAddressChange = (field: keyof AddressInput, value: string) => {
		setAddress((current) => ({ ...current, [field]: value }));
	};

	const handleSubmit = async () => {
		setIsSubmitting(true);

		try {
			await completeCustomerProfile({ phone, cpf, address });
		} catch (error) {
			Alert.alert(t("common.error"), getErrorMessage(error));
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<Text style={styles.badge}>{t("onboarding.customerProfileBadge")}</Text>
				<Text style={styles.title}>{t("onboarding.customerProfileTitle")}</Text>
				<Text style={styles.subtitle}>{t("onboarding.customerProfileSubtitle")}</Text>

				<View style={styles.form}>
					<Field label={t("onboarding.phone")}>
						<Input
							value={phone}
							onChangeText={setPhone}
							keyboardType="phone-pad"
							placeholder="(11) 99999-9999"
						/>
					</Field>
					<Field label={t("onboarding.cpf")}>
						<Input
							value={cpf}
							onChangeText={setCpf}
							keyboardType="numeric"
							placeholder="000.000.000-00"
						/>
					</Field>

					<Text style={styles.sectionTitle}>{t("onboarding.addressSectionTitle")}</Text>
					<Text style={styles.sectionSubtitle}>{t("onboarding.addressSectionSubtitle")}</Text>
					<AddressFormFields values={address} onChange={handleAddressChange} />
				</View>

				<Button onPress={handleSubmit} disabled={isSubmitting}>
					{isSubmitting ? t("onboarding.creating") : t("onboarding.continue")}
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
		padding: theme.gap(3),
		gap: theme.gap(2),
	},
	badge: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.primary,
		textTransform: "uppercase",
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	subtitle: {
		fontSize: 16,
		color: theme.colors.mutedForeground,
		lineHeight: 22,
	},
	form: {
		gap: theme.gap(2),
		marginTop: theme.gap(1),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
		marginTop: theme.gap(1),
	},
	sectionSubtitle: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	field: {
		gap: theme.gap(1),
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
}));
