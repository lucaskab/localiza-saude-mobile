import { useMemo } from "react";
import type { TextInputProps, ViewStyle } from "react-native";
import { TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface TextareaProps extends Omit<TextInputProps, "style"> {
	style?: ViewStyle;
	disabled?: boolean;
}

export function Textarea({ disabled = false, style, ...props }: TextareaProps) {
	const { theme } = useUnistyles();

	const styles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					borderWidth: 1,
					borderColor: theme.colors.border,
					borderRadius: theme.radius.lg,
					backgroundColor: theme.colors.surfaceInput,
					paddingHorizontal: theme.gap(2),
					paddingVertical: theme.gap(2),
					minHeight: 100,
				},
				input: {
					flex: 1,
					fontSize: 14,
					color: theme.colors.foreground,
					textAlignVertical: "top",
				},
				disabled: {
					opacity: 0.5,
				},
			}),
		[theme],
	);

	return (
		<View style={[styles.container, disabled && styles.disabled, style]}>
			<TextInput
				multiline
				editable={!disabled}
				style={styles.input}
				placeholderTextColor={theme.colors.mutedForeground}
				{...props}
			/>
		</View>
	);
}
