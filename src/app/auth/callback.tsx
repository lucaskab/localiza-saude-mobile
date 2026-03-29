import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { authClient } from "@/services/auth/better-auth";

export default function AuthCallback() {
	const { theme } = useUnistyles();
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleCallback = async () => {
			try {
				// Wait a moment for Better Auth to process the callback
				await new Promise((resolve) => setTimeout(resolve, 500));

				// Check if session exists
				const session = await authClient.getSession();

				if (session.data?.session.token && session.data?.user) {
					router.replace("/(bottom-tabs)/home");
				} else {
					setError("Failed to complete sign in");
					setTimeout(() => {
						router.replace("/login");
					}, 2000);
				}
			} catch (error) {
				setError("An error occurred during sign in");
				setTimeout(() => {
					router.replace("/login");
				}, 2000);
			}
		};

		handleCallback();
	}, [router]);

	return (
		<View style={styles.container}>
			<ActivityIndicator size="large" color={theme.colors.primary} />
			<Text style={styles.text}>
				{error || "Completing sign in..."}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(2),
	},
	text: {
		fontSize: 16,
		color: theme.colors.mutedForeground,
	},
}));
