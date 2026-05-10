import { router, useLocalSearchParams } from "expo-router";
import { Heart } from "lucide-react-native";
import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";

export default function ResetPassword() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { resetPassword } = useAuth();
	const params = useLocalSearchParams<{ error?: string; token?: string }>();
	const token = Array.isArray(params.token) ? params.token[0] : params.token;
	const hasTokenError = Boolean(params.error) || !token;
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleResetPassword = async () => {
		if (!token) {
			Alert.alert(t("common.loginError"), t("common.invalidResetToken"));
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert(t("common.loginError"), t("common.passwordsDoNotMatch"));
			return;
		}

		try {
			setIsSubmitting(true);
			await resetPassword(token, password);
			Alert.alert(
				t("common.resetPassword"),
				t("common.passwordResetSuccess"),
				[
					{
						text: t("common.backToLogin"),
						onPress: () => router.replace("/login"),
					},
				],
			);
		} catch (error) {
			Alert.alert(
				t("common.loginError"),
				error instanceof Error ? error.message : t("common.failedToLogin"),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<View style={styles.container}>
			<View style={styles.card}>
				<View style={styles.logoContainer}>
					<Heart
						size={38}
						color={theme.colors.primaryForeground}
						fill={theme.colors.primaryForeground}
					/>
				</View>
				<Text style={styles.title}>{t("common.resetPassword")}</Text>
				<Text style={styles.subtitle}>
					{hasTokenError
						? t("common.invalidResetToken")
						: t("common.chooseNewPassword")}
				</Text>

				<TextInput
					autoCapitalize="none"
					autoComplete="new-password"
					editable={!hasTokenError}
					placeholder={t("common.newPassword")}
					placeholderTextColor={theme.colors.mutedForeground}
					secureTextEntry
					style={styles.input}
					value={password}
					onChangeText={setPassword}
				/>
				<TextInput
					autoCapitalize="none"
					autoComplete="new-password"
					editable={!hasTokenError}
					placeholder={t("common.confirmPassword")}
					placeholderTextColor={theme.colors.mutedForeground}
					secureTextEntry
					style={styles.input}
					value={confirmPassword}
					onChangeText={setConfirmPassword}
				/>

				<Button
					disabled={hasTokenError || !password || !confirmPassword}
					loading={isSubmitting}
					size="lg"
					style={styles.button}
					onPress={handleResetPassword}
				>
					{isSubmitting
						? t("common.savingPassword")
						: t("common.saveNewPassword")}
				</Button>
				<Button
					size="lg"
					style={styles.button}
					variant="ghost"
					onPress={() => router.replace("/login")}
				>
					{t("common.backToLogin")}
				</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.background,
		padding: theme.gap(4),
	},
	card: {
		width: "100%",
		maxWidth: 420,
		gap: theme.gap(2),
		borderRadius: theme.radius.xl,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surfacePrimary,
		padding: theme.gap(4),
	},
	logoContainer: {
		width: 76,
		height: 76,
		borderRadius: theme.radius.xl,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
	},
	title: {
		fontSize: 26,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	subtitle: {
		fontSize: 15,
		lineHeight: 22,
		color: theme.colors.mutedForeground,
	},
	input: {
		height: 54,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		paddingHorizontal: theme.gap(2),
		fontSize: 16,
		color: theme.colors.foreground,
		backgroundColor: theme.colors.background,
	},
	button: {
		width: "100%",
	},
}));
