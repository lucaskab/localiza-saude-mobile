import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function FieldLabel({
	label,
	required = false,
}: {
	label: string;
	required?: boolean;
}) {
	return (
		<Text style={styles.label}>
			{label}
			{required ? <Text style={styles.required}> *</Text> : null}
		</Text>
	);
}

export function FieldGroup({
	label,
	required = false,
	children,
}: {
	label: string;
	required?: boolean;
	children: ReactNode;
}) {
	return (
		<View style={styles.group}>
			<FieldLabel label={label} required={required} />
			{children}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	group: {
		gap: theme.gap(1.5),
	},
	label: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	required: {
		color: theme.colors.destructive,
	},
}));
