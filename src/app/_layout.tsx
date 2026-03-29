import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/auth";

function RootNavigator() {
	return (
		<AuthProvider>
			<Stack
				screenOptions={{
					headerShown: false,
					animation: "none",
				}}
			>
				<Stack.Screen name="login" />
				<Stack.Screen name="(bottom-tabs)" />
				<Stack.Screen name="search" />
				<Stack.Screen name="auth/callback" />
			</Stack>
		</AuthProvider>
	);
}

export default function Layout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<RootNavigator />
		</GestureHandlerRootView>
	);
}
