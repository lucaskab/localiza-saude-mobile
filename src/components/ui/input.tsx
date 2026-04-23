import type { LucideIcon } from "lucide-react-native";
import { useRef } from "react";
import type { TextInputProps, ViewStyle } from "react-native";
import { Pressable, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface InputProps extends Omit<TextInputProps, "style"> {
	containerStyle?: ViewStyle;
	disabled?: boolean;
	error?: boolean;
	leftIcon?: LucideIcon;
	rightIcon?: LucideIcon;
	iconSize?: number;
	multiline?: boolean;
}

export const Input = ({
	disabled = false,
	error = false,
	leftIcon: LeftIcon,
	rightIcon: RightIcon,
	iconSize = 16,
	containerStyle,
	multiline = false,
	...props
}: InputProps) => {
	const { theme } = useUnistyles();
	const inputRef = useRef<TextInput>(null);

	const handleContainerPress = () => {
		if (!disabled && inputRef.current) {
			inputRef.current.focus();
		}
	};

	const styles = StyleSheet.create({
		container: {
			flexDirection: "row",
			alignItems: multiline ? "flex-start" : "center",
			gap: theme.gap(2),
			paddingHorizontal: theme.gap(2.5),
			paddingVertical: multiline ? theme.gap(2) : 0,
			borderRadius: theme.radius.md,
			borderWidth: 1,
			borderColor: error ? theme.colors.destructive : theme.colors.border,
			backgroundColor: theme.colors.background,
			minHeight: multiline ? 100 : undefined,
		},
		disabled: {
			opacity: 0.5,
			backgroundColor: theme.colors.muted,
		},
		input: {
			flex: 1,
			paddingVertical: multiline ? 0 : theme.gap(2),
			fontSize: 15,
			color: theme.colors.foreground,
			textAlignVertical: multiline ? "top" : "center",
		},
		iconContainer: {
			paddingTop: multiline ? theme.gap(0.5) : 0,
		},
	});

	return (
		<Pressable
			onPress={handleContainerPress}
			style={[
				styles.container,
				disabled && styles.disabled,
				error && { borderColor: theme.colors.destructive },
				containerStyle,
			]}
		>
			{LeftIcon && (
				<View style={styles.iconContainer}>
					<LeftIcon
						size={iconSize}
						color={theme.colors.mutedForeground}
						strokeWidth={2}
					/>
				</View>
			)}
			<TextInput
				ref={inputRef}
				editable={!disabled}
				style={styles.input}
				placeholderTextColor={theme.colors.mutedForeground}
				multiline={multiline}
				numberOfLines={multiline ? 4 : 1}
				{...props}
			/>
			{RightIcon && (
				<View style={styles.iconContainer}>
					<RightIcon
						size={iconSize}
						color={theme.colors.mutedForeground}
						strokeWidth={2}
					/>
				</View>
			)}
		</Pressable>
	);
};
