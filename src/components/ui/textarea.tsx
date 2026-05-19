import type { TextInputProps, ViewStyle } from "react-native";
import { Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface TextareaProps extends Omit<TextInputProps, "style"> {
	style?: ViewStyle;
	disabled?: boolean;
	errorMessage?: string;
}

export function Textarea({
	disabled = false,
	style,
	errorMessage,
	...props
}: TextareaProps) {
	const { theme } = useUnistyles();

	const styles = StyleSheet.create({
		wrapper: {
			gap: theme.gap(1),
		},
		container: {
			borderWidth: 1,
			borderColor: errorMessage
				? theme.colors.destructive
				: theme.colors.border,
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
		errorText: {
			fontSize: 12,
			fontWeight: "600",
			color: theme.colors.destructive,
		},
	});

	return (
		<View style={styles.wrapper}>
			<View style={[styles.container, disabled && styles.disabled, style]}>
				<TextInput
					multiline
					editable={!disabled}
					style={styles.input}
					placeholderTextColor={theme.colors.mutedForeground}
					{...props}
				/>
			</View>
			{errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
		</View>
	);
}
