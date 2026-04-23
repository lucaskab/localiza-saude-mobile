import { useRouter } from "expo-router";
import { Heart, Mail } from "lucide-react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { env } from "@/constants/env";
import { useAuth } from "@/contexts/auth";

export default function Login() {
	const { theme } = useUnistyles();
	const { signInWithGoogle } = useAuth();
	const router = useRouter();
	const [isTesting, setIsTesting] = useState(false);

	const handleGoogleLogin = async () => {
		try {
			await signInWithGoogle();
			// Navigation is handled in signInWithGoogle
		} catch (error) {
			Alert.alert(
				"Login Error",
				error instanceof Error ? error.message : "Failed to login",
			);
		}
	};

	const handleLogin = async (provider: "apple" | "email") => {
		Alert.alert(
			"Coming Soon",
			`${provider === "apple" ? "Apple" : "Email"} authentication will be available soon.`,
		);
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
					<Text style={styles.title}>Welcome to HealthCare</Text>
					<Text style={styles.subtitle}>
						Find and book appointments with healthcare professionals
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
							<Text style={styles.buttonText}>Continue with Google</Text>
						</View>
					</Button>

					{/* Apple Login */}
					<Pressable
						onPress={() => handleLogin("apple")}
						style={({ pressed }) => [
							styles.appleButton,
							pressed && styles.appleButtonPressed,
						]}
					>
						<View style={styles.buttonContent}>
							<Text style={styles.appleIcon}></Text>
							<Text style={styles.appleButtonText}>Continue with Apple</Text>
						</View>
					</Pressable>

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
							By continuing, you agree to our{" "}
							<Text style={styles.termsLink}>Terms of Service</Text> and{" "}
							<Text style={styles.termsLink}>Privacy Policy</Text>
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
	appleIcon: {
		fontSize: 20,
	},
	appleButton: {
		width: "100%",
		height: 56,
		backgroundColor: "#000000",
		borderRadius: theme.radius.lg,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.gap(3),
	},
	appleButtonPressed: {
		opacity: 0.9,
	},
	appleButtonText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#ffffff",
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
