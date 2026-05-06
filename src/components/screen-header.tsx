import { useRouter } from "expo-router";
import { ArrowLeft, type LucideIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
	Pressable,
	Text,
	View,
	type StyleProp,
	type ViewStyle,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type ScreenHeaderProps = {
	title: string;
	subtitle?: string;
	icon?: LucideIcon;
	iconColor?: string;
	iconFill?: string;
	iconBackgroundColor?: string;
	onBackPress?: () => void;
	backButtonTestID?: string;
	testID?: string;
	style?: StyleProp<ViewStyle>;
};

export function ScreenHeader({
	title,
	subtitle,
	icon: Icon,
	iconColor,
	iconFill = "transparent",
	iconBackgroundColor,
	onBackPress,
	backButtonTestID,
	testID,
	style,
}: ScreenHeaderProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const router = useRouter();

	const handleBackPress = () => {
		if (onBackPress) {
			onBackPress();
			return;
		}

		router.back();
	};

	return (
		<View testID={testID} style={[styles.container, style]}>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t("common.goBack")}
				testID={backButtonTestID}
				onPress={handleBackPress}
				style={styles.backButton}
			>
				<ArrowLeft
					size={20}
					color={theme.colors.foreground}
					strokeWidth={2}
				/>
			</Pressable>

			{Icon ? (
				<View
					style={[
						styles.iconContainer,
						iconBackgroundColor ? { backgroundColor: iconBackgroundColor } : null,
					]}
				>
					<Icon
						size={22}
						color={iconColor || theme.colors.primary}
						fill={iconFill}
						strokeWidth={2}
					/>
				</View>
			) : null}

			<View style={styles.copy}>
				<Text style={styles.title}>{title}</Text>
				{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	iconContainer: {
		width: 44,
		height: 44,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	copy: {
		flex: 1,
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	subtitle: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
		marginTop: theme.gap(0.5),
	},
}));
