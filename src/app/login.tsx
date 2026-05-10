import * as AppleAuthentication from "expo-apple-authentication";
import { Heart } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";

const isAppleSignInEnabled =
	process.env.EXPO_PUBLIC_ENABLE_APPLE_SIGN_IN === "true";

type AuthMode = "sign-in" | "sign-up" | "forgot-password";

export default function Login() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const {
		requestPasswordReset,
		signInWithApple,
		signInWithEmail,
		signInWithGoogle,
		signUpWithEmail,
	} = useAuth();
	const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
	const [isAppleSignInPending, setIsAppleSignInPending] = useState(false);
	const [isEmailAuthPending, setIsEmailAuthPending] = useState(false);

	const changeAuthMode = (nextMode: AuthMode) => {
		setAuthMode(nextMode);
	};

	useEffect(() => {
		if (!isAppleSignInEnabled) {
			setIsAppleAuthAvailable(false);
			return;
		}

		AppleAuthentication.isAvailableAsync()
			.then(setIsAppleAuthAvailable)
			.catch(() => setIsAppleAuthAvailable(false));
	}, []);

	const handleGoogleLogin = async () => {
		try {
			await signInWithGoogle();
			// Navigation is handled in signInWithGoogle
		} catch (error) {
			Alert.alert(
				t("common.loginError"),
				error instanceof Error ? error.message : t("common.failedToLogin"),
			);
		}
	};

	const handleAppleLogin = async () => {
		try {
			setIsAppleSignInPending(true);
			await signInWithApple();
		} catch (error) {
			Alert.alert(
				t("common.loginError"),
				error instanceof Error
					? error.message
					: t("common.failedToLoginWithApple"),
			);
		} finally {
			setIsAppleSignInPending(false);
		}
	};

	const handleEmailAuth = async () => {
		try {
			setIsEmailAuthPending(true);

			if (authMode === "forgot-password") {
				await requestPasswordReset(email.trim());
				Alert.alert(
					t("common.passwordResetEmailSentTitle"),
					t("common.passwordResetEmailSentDescription"),
				);
				return;
			}

			if (authMode === "sign-up") {
				await signUpWithEmail(name.trim(), email.trim(), password);
				return;
			}

			await signInWithEmail(email.trim(), password);
		} catch (error) {
			Alert.alert(
				t("common.loginError"),
				error instanceof Error ? error.message : t("common.failedToLogin"),
			);
		} finally {
			setIsEmailAuthPending(false);
		}
	};

	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Header Section */}
				<View style={styles.header}>
					{/* Logo/Icon */}
					<View style={styles.logoContainer}>
						<Heart
							size={56}
							color={theme.colors.primaryForeground}
							fill={theme.colors.primaryForeground}
						/>
					</View>

					{/* Title */}
					<Text style={styles.title}>
						{authMode === "forgot-password"
							? t("common.forgotPasswordTitle")
							: t("common.welcomeToHealthCare")}
					</Text>
					<Text style={styles.subtitle}>
						{authMode === "forgot-password"
							? t("common.forgotPasswordDescription")
							: t("common.findAndBookAppointmentsWithHealthcareProfessionals")}
					</Text>
				</View>

				{/* Login Buttons Section */}
				<View style={styles.buttonsContainer}>
					{authMode !== "forgot-password" ? (
						<View style={styles.segmentedControl}>
							<Pressable
								onPress={() => changeAuthMode("sign-in")}
								style={[
									styles.segmentedOption,
									authMode === "sign-in" && styles.segmentedOptionActive,
								]}
							>
								<Text
									style={[
										styles.segmentedText,
										authMode === "sign-in" && styles.segmentedTextActive,
									]}
								>
									{t("common.signIn")}
								</Text>
							</Pressable>
							<Pressable
								onPress={() => changeAuthMode("sign-up")}
								style={[
									styles.segmentedOption,
									authMode === "sign-up" && styles.segmentedOptionActive,
								]}
							>
								<Text
									style={[
										styles.segmentedText,
										authMode === "sign-up" && styles.segmentedTextActive,
									]}
								>
									{t("common.createAccount")}
								</Text>
							</Pressable>
						</View>
					) : null}

					{authMode === "sign-up" ? (
						<TextInput
							autoCapitalize="words"
							autoComplete="name"
							placeholder={t("common.name")}
							placeholderTextColor={theme.colors.mutedForeground}
							style={styles.input}
							value={name}
							onChangeText={setName}
						/>
					) : null}
					<TextInput
						autoCapitalize="none"
						autoComplete="email"
						keyboardType="email-address"
						placeholder={t("common.email")}
						placeholderTextColor={theme.colors.mutedForeground}
						style={styles.input}
						value={email}
						onChangeText={setEmail}
					/>
					{authMode !== "forgot-password" ? (
						<TextInput
							autoCapitalize="none"
							autoComplete={
								authMode === "sign-up" ? "new-password" : "current-password"
							}
							placeholder={t("common.password")}
							placeholderTextColor={theme.colors.mutedForeground}
							secureTextEntry
							style={styles.input}
							value={password}
							onChangeText={setPassword}
						/>
					) : null}
					{authMode === "sign-in" ? (
						<Pressable
							style={styles.forgotPasswordButton}
							onPress={() => changeAuthMode("forgot-password")}
						>
							<Text style={styles.forgotPasswordText}>
								{t("common.forgotPasswordLink")}
							</Text>
						</Pressable>
					) : null}

					<Button
						disabled={!email.trim() || isEmailAuthPending}
						loading={isEmailAuthPending}
						size="lg"
						style={styles.button}
						onPress={handleEmailAuth}
					>
						{authMode === "forgot-password"
							? t("common.sendResetLink")
							: authMode === "sign-up"
								? t("common.createAccount")
								: t("common.signIn")}
					</Button>
					{authMode === "forgot-password" ? (
						<Button
							size="lg"
							style={styles.button}
							variant="ghost"
							onPress={() => changeAuthMode("sign-in")}
						>
							{t("common.backToLogin")}
						</Button>
					) : null}

					{authMode !== "forgot-password" ? (
						<>
							<View style={styles.divider}>
								<View style={styles.dividerLine} />
								<Text style={styles.dividerText}>{t("common.or")}</Text>
								<View style={styles.dividerLine} />
							</View>

							{/* Google Login */}
							<Button
								onPress={handleGoogleLogin}
								variant="outline"
								size="lg"
								style={styles.button}
							>
								<View style={styles.buttonContent}>
									<View style={styles.googleIcon}>
										<Text style={styles.googleText}>G</Text>
									</View>
									<Text style={styles.buttonText}>
										{t("common.continueWithGoogle")}
									</Text>
								</View>
							</Button>

							{isAppleAuthAvailable ? (
								<View
									style={[
										styles.appleButtonWrapper,
										isAppleSignInPending && styles.appleButtonWrapperDisabled,
									]}
									pointerEvents={isAppleSignInPending ? "none" : "auto"}
								>
									<AppleAuthentication.AppleAuthenticationButton
										buttonType={
											AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
										}
										buttonStyle={
											AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
										}
										cornerRadius={12}
										style={styles.appleButton}
										onPress={handleAppleLogin}
									/>
								</View>
							) : null}
						</>
					) : null}

					{/* Terms */}
					<View style={styles.termsContainer}>
						<Text style={styles.termsText}>
							{t("common.byContinuingYouAgreeToOur")}{" "}
							<Text style={styles.termsLink}>{t("common.termsOfService")}</Text>{" "}
							{t("common.and")}{" "}
							<Text style={styles.termsLink}>{t("common.privacyPolicy")}</Text>
						</Text>
					</View>
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	scrollContent: {
		flexGrow: 1,
		maxWidth: 448,
		width: "100%",
		alignSelf: "center",
		paddingHorizontal: theme.gap(4),
	},
	header: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.gap(6),
	},
	logoContainer: {
		width: 112,
		height: 112,
		borderRadius: theme.radius.xl,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: theme.gap(6),
		backgroundColor: theme.colors.primary,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 8,
	},
	title: {
		fontSize: 28,
		fontWeight: "500",
		color: theme.colors.foreground,
		textAlign: "center",
		marginBottom: theme.gap(2),
	},
	subtitle: {
		fontSize: 16,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		lineHeight: 24,
		paddingHorizontal: theme.gap(4),
		marginBottom: theme.gap(4),
	},
	buttonsContainer: {
		paddingBottom: theme.gap(8),
		gap: theme.gap(2),
	},
	segmentedControl: {
		flexDirection: "row",
		gap: theme.gap(0.75),
		padding: theme.gap(0.75),
		borderRadius: theme.radius.lg,
		backgroundColor: theme.colors.muted,
	},
	segmentedOption: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 42,
		borderRadius: theme.radius.md,
		paddingHorizontal: theme.gap(0.75),
	},
	segmentedOptionActive: {
		backgroundColor: theme.colors.background,
	},
	segmentedText: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
	segmentedTextActive: {
		color: theme.colors.foreground,
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
	forgotPasswordButton: {
		alignSelf: "flex-end",
		paddingVertical: theme.gap(0.5),
	},
	forgotPasswordText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.primary,
	},
	button: {
		width: "100%",
	},
	divider: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
		paddingVertical: theme.gap(1),
	},
	dividerLine: {
		flex: 1,
		height: 1,
		backgroundColor: theme.colors.border,
	},
	dividerText: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.mutedForeground,
		textTransform: "uppercase",
	},
	buttonContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1.5),
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	googleIcon: {
		width: 20,
		height: 20,
		borderRadius: 4,
		backgroundColor: "#4285F4",
		alignItems: "center",
		justifyContent: "center",
	},
	googleText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#ffffff",
	},
	appleButton: {
		width: "100%",
		height: 56,
	},
	appleButtonWrapper: {
		width: "100%",
		height: 56,
	},
	appleButtonWrapperDisabled: {
		opacity: 0.7,
	},
	termsContainer: {
		paddingTop: theme.gap(3),
		paddingHorizontal: theme.gap(2),
	},
	termsText: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		lineHeight: 18,
	},
	termsLink: {
		color: theme.colors.primary,
		textDecorationLine: "underline",
	},
}));
