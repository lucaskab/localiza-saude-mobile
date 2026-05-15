import type { LucideIcon } from "lucide-react-native";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	type ProfileFormData,
	type ProfileTextField,
} from "@/components/provider-profile/profile-form";
import { Input } from "@/components/ui/input";

type FormInputProps = {
	control: Control<ProfileFormData>;
	icon?: LucideIcon;
	label: string;
	name: ProfileTextField;
	placeholder?: string;
	multiline?: boolean;
	keyboardType?: "default" | "numeric";
};

export function FormInput({
	control,
	icon,
	label,
	name,
	placeholder,
	multiline,
	keyboardType,
}: FormInputProps) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field }) => (
				<View style={styles.fieldGroup}>
					<Text style={styles.fieldLabel}>{label}</Text>
					<Input
						leftIcon={icon}
						value={field.value || ""}
						onChangeText={field.onChange}
						placeholder={placeholder}
						multiline={multiline}
						keyboardType={keyboardType}
					/>
				</View>
			)}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	fieldGroup: {
		gap: theme.gap(1.5),
	},
	fieldLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
}));
