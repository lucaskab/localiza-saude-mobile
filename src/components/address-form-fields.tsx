import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import { Input } from "@/components/ui/input";
import type { AddressInput } from "@/types/address";

const BRAZILIAN_STATES = [
	"AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
	"PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

type AddressFormFieldsProps = {
	values: AddressInput;
	onChange: (field: keyof AddressInput, value: string) => void;
};

export function AddressFormFields({ values, onChange }: AddressFormFieldsProps) {
	const { t } = useTranslation();

	return (
		<View style={styles.grid}>
			<Field label={t("onboarding.addressPostalCode")}>
				<Input
					value={values.postalCode}
					onChangeText={(value) => onChange("postalCode", value)}
					keyboardType="numeric"
					placeholder="00000-000"
				/>
			</Field>
			<Field label={t("onboarding.addressState")}>
				<Input
					value={values.state}
					onChangeText={(value) => onChange("state", value.toUpperCase())}
					placeholder="SP"
					maxLength={2}
					autoCapitalize="characters"
				/>
			</Field>
			<Field label={t("onboarding.addressCity")}>
				<Input value={values.city} onChangeText={(value) => onChange("city", value)} />
			</Field>
			<Field label={t("onboarding.addressNeighborhood")}>
				<Input
					value={values.neighborhood}
					onChangeText={(value) => onChange("neighborhood", value)}
				/>
			</Field>
			<Field label={t("onboarding.addressStreet")}>
				<Input value={values.street} onChangeText={(value) => onChange("street", value)} />
			</Field>
			<Field label={t("onboarding.addressNumber")}>
				<Input value={values.number} onChangeText={(value) => onChange("number", value)} />
			</Field>
			<Field label={t("onboarding.addressComplement")}>
				<Input
					value={values.complement ?? ""}
					onChangeText={(value) => onChange("complement", value)}
					placeholder={t("onboarding.addressComplementPlaceholder")}
				/>
			</Field>
			<Field label={t("onboarding.addressReference")}>
				<Input
					value={values.reference ?? ""}
					onChangeText={(value) => onChange("reference", value)}
					placeholder={t("onboarding.addressReferencePlaceholder")}
				/>
			</Field>
		</View>
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
	grid: {
		gap: theme.spacing.md,
	},
	field: {
		gap: theme.spacing.xs,
	},
	label: {
		fontSize: theme.fontSize.sm,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	hint: {
		fontSize: theme.fontSize.xs,
		color: theme.colors.mutedForeground,
	},
}));
