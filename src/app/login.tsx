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

	const handleDevLogin = () => {
		// Quick dev login bypass
		Alert.alert(
			"Dev Mode",
			"This will skip authentication (development only)",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Continue",
					onPress: () => router.replace("/(bottom-tabs)/home"),
				},
			],
		);
	};

	const testBackendConnection = async () => {
		setIsTesting(true);
		const results: string[] = [];

		try {
			console.log("🧪 Testing backend connection...");
			console.log("📍 Backend URL:", env.EXPO_PUBLIC_BASE_URL);
			console.log("📱 App Scheme:", env.EXPO_PUBLIC_SCHEME);

			results.push(`Backend: ${env.EXPO_PUBLIC_BASE_URL}`);
			results.push(`Scheme: ${env.EXPO_PUBLIC_SCHEME}`);
			results.push("");

			// Test 1: Health check
			console.log("Test 1: Health check...");
			try {
				const healthResponse = await fetch(
					`${env.EXPO_PUBLIC_BASE_URL}/health`,
					{
						method: "GET",
					},
				);
				const healthData = await healthResponse.json();
				console.log("✅ Health check:", healthResponse.status, healthData);
				results.push(`✅ Health: ${healthResponse.status}`);
			} catch (error) {
				console.error("❌ Health check failed:", error);
				results.push(`❌ Health: FAILED`);
				throw error;
			}

			// Test 2: Root endpoint
			console.log("Test 2: Root endpoint...");
			try {
				const rootResponse = await fetch(`${env.EXPO_PUBLIC_BASE_URL}/`, {
					method: "GET",
				});
				console.log("✅ Root endpoint:", rootResponse.status);
				results.push(`✅ Root: ${rootResponse.status}`);
			} catch (error) {
				console.error("❌ Root endpoint failed:", error);
				results.push(`❌ Root: FAILED`);
			}

			// Test 3: Auth session endpoint
			console.log("Test 3: Auth session...");
			try {
				const sessionResponse = await fetch(
					`${env.EXPO_PUBLIC_BASE_URL}/auth/session`,
					{
						method: "GET",
					},
				);
				console.log("✅ Auth session:", sessionResponse.status);
				results.push(`✅ Session: ${sessionResponse.status}`);
			} catch (error) {
				console.error("❌ Session check failed:", error);
				results.push(`❌ Session: FAILED`);
			}

			// Test 4: Google OAuth initiation URL
			console.log("Test 4: OAuth URL...");
			const oauthUrl = `${env.EXPO_PUBLIC_BASE_URL}/auth/sign-in/social?provider=google`;
			console.log("🔗 OAuth URL:", oauthUrl);
			results.push("");
			results.push(`OAuth URL:`);
			results.push(oauthUrl);
			results.push("");

			// Test 5: Callback URL
			const callbackUrl = `${env.EXPO_PUBLIC_BASE_URL}/auth/callback/google`;
			console.log("🔗 Callback URL:", callbackUrl);
			results.push(`Callback URL:`);
			results.push(callbackUrl);

			Alert.alert("✅ Connection Test Passed", results.join("\n"), [
				{
					text: "Copy URLs",
					onPress: () => {
						console.log("=== Connection Test Results ===");
						console.log(results.join("\n"));
						console.log("================================");
					},
				},
				{ text: "OK" },
			]);
		} catch (error) {
			console.error("❌ Connection test failed:", error);
			results.push("");
			results.push(
				`Error: ${error instanceof Error ? error.message : "Unknown"}`,
			);

			Alert.alert(
				"❌ Connection Failed",
				results.join("\n") + "\n\nCheck console for details",
				[
					{
						text: "Troubleshooting",
						onPress: () => {
							Alert.alert(
								"Troubleshooting",
								"1. Backend must be running\n" +
									"2. Use ngrok or your computer's IP\n" +
									"3. Both devices on same WiFi\n" +
									"4. Check backend logs\n" +
									"5. Verify BETTER_AUTH_URL in backend .env",
							);
						},
					},
					{ text: "OK" },
				],
			);
		} finally {
			setIsTesting(false);
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
					<Text style={styles.title}>Welcome to HealthCare</Text>
					<Text style={styles.subtitle}>
						Find and book appointments with healthcare professionals
					</Text>
				</View>

				{/* Login Buttons Section */}
				<View style={styles.buttonsContainer}>
					{/* Dev Login Button (Development Only) */}
					{__DEV__ && (
						<Button
							onPress={handleDevLogin}
							variant="ghost"
							size="sm"
							style={styles.button}
						>
							🔧 Dev Login (Skip Auth)
						</Button>
					)}

					{/* Test Connection Button */}
					<Button
						onPress={testBackendConnection}
						variant="secondary"
						size="lg"
						style={styles.button}
						loading={isTesting}
						disabled={isTesting}
					>
						{isTesting ? "Testing..." : "🧪 Test Backend Connection"}
					</Button>
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
					<Button
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
					</Button>

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
