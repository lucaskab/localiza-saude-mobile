import { useMemo } from "react";
import type { ViewStyle } from "react-native";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type BadgeVariant = "default" | "secondary" | "accent" | "destructive";

interface BadgeProps {
	children: React.ReactNode;
	variant?: BadgeVariant;
	style?: ViewStyle;
}

export function Badge({ children, variant = "default", style }: BadgeProps) {
	const { theme } = useUnistyles();

	const styles = useMemo(
		() =>
			StyleSheet.create({
				// Base styles
				badge: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					paddingHorizontal: theme.gap(1.5),
					paddingVertical: theme.gap(0.5),
					borderRadius: theme.radius.md,
					alignSelf: "flex-start",
				},

				// Variant styles
				variantDefault: {
					backgroundColor: theme.colors.primary,
				},
				variantSecondary: {
					backgroundColor: theme.colors.secondary,
				},
				variantAccent: {
					backgroundColor: theme.colors.accent,
				},
				variantDestructive: {
					backgroundColor: theme.colors.destructive,
				},

				// Text styles
				text: {
					fontSize: 12,
					fontWeight: "500",
				},
				textDefault: {
					color: theme.colors.primaryForeground,
				},
				textSecondary: {
					color: theme.colors.secondaryForeground,
				},
				textAccent: {
					color: theme.colors.accentForeground,
				},
				textDestructive: {
					color: theme.colors.destructiveForeground,
				},
			}),
		[theme],
	);

	const variantStyle = (() => {
		switch (variant) {
			case "secondary":
				return styles.variantSecondary;
			case "accent":
				return styles.variantAccent;
			case "destructive":
				return styles.variantDestructive;
			default:
				return styles.variantDefault;
		}
	})();

	const textColorStyle = (() => {
		switch (variant) {
			case "secondary":
				return styles.textSecondary;
			case "accent":
				return styles.textAccent;
			case "destructive":
				return styles.textDestructive;
			default:
				return styles.textDefault;
		}
	})();

	return (
		<View style={[styles.badge, variantStyle, style]}>
			{typeof children === "string" ? (
				<Text style={[styles.text, textColorStyle]}>{children}</Text>
			) : (
				children
			)}
		</View>
	);
}
