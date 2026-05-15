import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProfileFormData } from "@/components/provider-profile/profile-form";

type ComplianceFieldName =
	| "termsAccepted"
	| "lgpdConsent"
	| "professionalResponsibilityAccepted";

type ComplianceCheckboxProps = {
	control: Control<ProfileFormData>;
	name: ComplianceFieldName;
	title: string;
	description: string;
};

export function ComplianceCheckbox({
	control,
	name,
	title,
	description,
}: ComplianceCheckboxProps) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field }) => (
				<View style={styles.row}>
					<Checkbox
						checked={Boolean(field.value)}
						onCheckedChange={field.onChange}
					/>
					<View style={styles.textContainer}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.description}>{description}</Text>
					</View>
				</View>
			)}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	row: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: theme.gap(2),
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.muted,
	},
	textContainer: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	title: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	description: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
}));
