import * as AppleAuthentication from "expo-apple-authentication";
import { Heart } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";

export default function Login() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { signInWithApple, signInWithGoogle } = useAuth();
	const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
	const [isAppleSignInPending, setIsAppleSignInPending] = useState(false);

	useEffect(() => {
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
					<Text style={styles.title}>{t("common.welcomeToHealthCare")}</Text>
					<Text style={styles.subtitle}>
						{t("common.findAndBookAppointmentsWithHealthcareProfessionals")}
					</Text>
				</View>

				{/* Login Buttons Section */}
				<View style={styles.buttonsContainer}>
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
							<Text style={styles.buttonText}>{t("common.continueWithGoogle")}</Text>
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

					{/* Email Login Option */}
					{/*<Button
						variant="ghost"
						size="lg"
						style={styles.button}
						onPress={() => handleLogin("email")}
					>
						<View style={styles.buttonContent}>
							<Mail size={20} color={theme.colors.foreground} strokeWidth={2} />
							<Text
								style={[styles.buttonText, { color: theme.colors.foreground }]}
							>
								Continue with Email
							</Text>
						</View>
					</Button>*/}

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
	button: {
		width: "100%",
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
