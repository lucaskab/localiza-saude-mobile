import { useMemo } from "react";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";
import { Check } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface CheckboxProps extends Omit<PressableProps, "onPress"> {
	checked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	disabled?: boolean;
}

export function Checkbox({
	checked = false,
	onCheckedChange,
	disabled = false,
	...props
}: CheckboxProps) {
	const { theme } = useUnistyles();

	const styles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					width: 24,
					height: 24,
					borderRadius: theme.radius.sm,
					borderWidth: 2,
					borderColor: checked ? theme.colors.primary : theme.colors.border,
					backgroundColor: checked
						? theme.colors.primary
						: theme.colors.surfacePrimary,
					alignItems: "center",
					justifyContent: "center",
				},
				pressed: {
					opacity: 0.7,
				},
				disabled: {
					opacity: 0.5,
				},
			}),
		[theme, checked],
	);

	const handlePress = () => {
		if (!disabled && onCheckedChange) {
			onCheckedChange(!checked);
		}
	};

	return (
		<Pressable
			onPress={handlePress}
			disabled={disabled}
			style={({ pressed }) => [
				styles.container,
				pressed && !disabled && styles.pressed,
				disabled && styles.disabled,
			]}
			{...props}
		>
			{checked && (
				<Check
					size={16}
					color={theme.colors.primaryForeground}
					strokeWidth={3}
				/>
			)}
		</Pressable>
	);
}
