import { Pencil } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { AddressFormFields } from "@/components/address-form-fields";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import { useUpdateCustomer } from "@/hooks/use-customer";
import { getErrorMessage } from "@/services/api";
import { showErrorMessageToast, showSuccessToast } from "@/services/toast";
import type { AddressInput } from "@/types/address";

const emptyAddress: AddressInput = {
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

function toDateInput(value?: string | null) {
	return value ? value.slice(0, 10) : "";
}

export default function CustomerProfileEdit() {
	const { t } = useTranslation();
	const { user, customer, updateCustomerProfile } = useAuth();
	const updateCustomer = useUpdateCustomer();
	const [name, setName] = useState("");
	const [phone, setPhone] = useState("");
	const [cpf, setCpf] = useState("");
	const [dateOfBirth, setDateOfBirth] = useState("");
	const [address, setAddress] = useState<AddressInput>(emptyAddress);

	useEffect(() => {
		setName(user?.name || "");
		setPhone(user?.phone || "");
		setCpf(customer?.cpf || "");
		setDateOfBirth(toDateInput(customer?.dateOfBirth));
		setAddress({
			countryCode: customer?.primaryAddress?.countryCode || "BR",
			postalCode: customer?.primaryAddress?.postalCode || "",
			state: customer?.primaryAddress?.state || "SP",
			city: customer?.primaryAddress?.city || "",
			neighborhood: customer?.primaryAddress?.neighborhood || "",
			street: customer?.primaryAddress?.street || "",
			number: customer?.primaryAddress?.number || "",
			complement: customer?.primaryAddress?.complement || "",
			reference: customer?.primaryAddress?.reference || "",
		});
	}, [customer, user]);

	const handleAddressChange = (field: keyof AddressInput, value: string) => {
		setAddress((current) => ({ ...current, [field]: value }));
	};

	const handleSubmit = async () => {
		if (!customer?.id) {
			return;
		}

		try {
			const response = await updateCustomer.mutateAsync({
				customerId: customer.id,
				data: {
					name: name.trim(),
					phone: phone.trim() || null,
					cpf: cpf.trim() || null,
					dateOfBirth: dateOfBirth || null,
					address: {
						countryCode: address.countryCode || "BR",
						postalCode: address.postalCode,
						state: address.state,
						city: address.city,
						neighborhood: address.neighborhood,
						street: address.street,
						number: address.number,
						complement: address.complement?.trim() || null,
						reference: address.reference?.trim() || null,
					},
				},
			});

			updateCustomerProfile({
				user: response.customer,
				customer: response.customer,
			});
			showSuccessToast("common.profileSavedSuccessfully");
			router.back();
		} catch (error) {
			const message = getErrorMessage(error);
			showErrorMessageToast(message);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
				<ScreenHeader
					title={t("common.editProfile")}
					subtitle={t("onboarding.customerProfileSubtitle")}
					icon={Pencil}
				/>

				<View style={styles.card}>
					<Field label={t("common.name")}>
						<Input value={name} onChangeText={setName} />
					</Field>
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
					<Field label={t("common.dateOfBirth")}>
						<DatePickerInput
							value={dateOfBirth}
							onChange={setDateOfBirth}
							allowClear
						/>
					</Field>

					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>
							{t("onboarding.addressSectionTitle")}
						</Text>
						<Text style={styles.sectionSubtitle}>
							{t("onboarding.addressSectionSubtitle")}
						</Text>
					</View>

					<AddressFormFields values={address} onChange={handleAddressChange} />
				</View>

				<View style={styles.actions}>
					<Button variant="outline" onPress={() => router.back()} style={styles.actionButton}>
						{t("common.cancel")}
					</Button>
					<Button
						onPress={handleSubmit}
						loading={updateCustomer.isPending}
						style={styles.actionButton}
					>
						{t("common.saveChanges")}
					</Button>
				</View>
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
	card: {
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surfacePrimary,
		padding: theme.gap(3),
		gap: theme.gap(2),
	},
	field: {
		gap: theme.gap(1),
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	sectionHeader: {
		gap: theme.gap(1),
		marginTop: theme.gap(1),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	sectionSubtitle: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	actions: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	actionButton: {
		flex: 1,
	},
}));
