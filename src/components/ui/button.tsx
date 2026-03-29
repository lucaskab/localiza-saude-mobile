import { useMemo } from "react";
import type { PressableProps, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type ButtonVariant =
	| "default"
	| "outline"
	| "ghost"
	| "destructive"
	| "secondary";
type ButtonSize = "default" | "sm" | "lg";

interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
	children: React.ReactNode;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	loading?: boolean;
	style?: ViewStyle;
	ref?: React.Ref<View>;
}

export function Button({
	children,
	onPress,
	variant = "default",
	size = "default",
	disabled = false,
	loading = false,
	style,
	ref,
	...props
}: ButtonProps) {
	const { theme } = useUnistyles();

	const styles = useMemo(
		() =>
			StyleSheet.create({
				// Base styles
				baseButton: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					borderRadius: theme.radius.lg,
				},

				// Variant styles
				variantDefault: {
					backgroundColor: theme.colors.primary,
				},
				variantSecondary: {
					backgroundColor: theme.colors.secondary,
				},
				variantOutline: {
					backgroundColor: "transparent",
					borderWidth: 2,
					borderColor: theme.colors.border,
				},
				variantGhost: {
					backgroundColor: "transparent",
				},
				variantDestructive: {
					backgroundColor: theme.colors.destructive,
				},

				// Size styles
				sizeDefault: {
					height: 48,
					paddingHorizontal: theme.gap(2),
				},
				sizeSm: {
					height: 40,
					paddingHorizontal: theme.gap(1.5),
				},
				sizeLg: {
					height: 56,
					paddingHorizontal: theme.gap(3),
				},

				// State styles
				pressed: {
					opacity: 0.7,
				},
				disabled: {
					opacity: 0.5,
				},

				// Content styles
				loader: {
					marginRight: theme.gap(1),
				},
				text: {
					fontSize: 16,
					fontWeight: "500",
					textAlign: "center",
				},
				textDefault: {
					color: theme.colors.primaryForeground,
				},
				textSecondary: {
					color: theme.colors.secondaryForeground,
				},
				textOutline: {
					color: theme.colors.foreground,
				},
				textGhost: {
					color: theme.colors.foreground,
				},
				textDestructive: {
					color: theme.colors.destructiveForeground,
				},
				textSm: {
					fontSize: 14,
				},
				textLg: {
					fontSize: 16,
				},
			}),
		[theme],
	);

	const isDisabled = disabled || loading;

	// Get variant styles
	const variantStyle = (() => {
		switch (variant) {
			case "secondary":
				return styles.variantSecondary;
			case "outline":
				return styles.variantOutline;
			case "ghost":
				return styles.variantGhost;
			case "destructive":
				return styles.variantDestructive;
			default:
				return styles.variantDefault;
		}
	})();

	// Get size styles
	const sizeStyle = (() => {
		switch (size) {
			case "sm":
				return styles.sizeSm;
			case "lg":
				return styles.sizeLg;
			default:
				return styles.sizeDefault;
		}
	})();

	// Get text color style
	const textColorStyle = (() => {
		switch (variant) {
			case "secondary":
				return styles.textSecondary;
			case "outline":
				return styles.textOutline;
			case "ghost":
				return styles.textGhost;
			case "destructive":
				return styles.textDestructive;
			default:
				return styles.textDefault;
		}
	})();

	// Get text size style
	const textSizeStyle = (() => {
		switch (size) {
			case "sm":
				return styles.textSm;
			case "lg":
				return styles.textLg;
			default:
				return null;
		}
	})();

	// Get loader color
	const loaderColor = (() => {
		switch (variant) {
			case "secondary":
				return theme.colors.secondaryForeground;
			case "outline":
			case "ghost":
				return theme.colors.foreground;
			case "destructive":
				return theme.colors.destructiveForeground;
			default:
				return theme.colors.primaryForeground;
		}
	})();

	return (
		<Pressable
			ref={ref}
			onPress={onPress}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.baseButton,
				variantStyle,
				sizeStyle,
				pressed && !isDisabled && styles.pressed,
				isDisabled && styles.disabled,
				style,
			]}
			{...props}
		>
			{loading && (
				<ActivityIndicator
					size="small"
					color={loaderColor}
					style={styles.loader}
				/>
			)}
			{typeof children === "string" ? (
				<Text style={[styles.text, textColorStyle, textSizeStyle]}>
					{children}
				</Text>
			) : (
				children
			)}
		</Pressable>
	);
}
