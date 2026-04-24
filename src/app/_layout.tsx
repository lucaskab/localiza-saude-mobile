import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/auth";
import { queryClient } from "@/services/query-client";

function RootNavigator() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<Stack
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen name="login" />
					<Stack.Screen name="(bottom-tabs)" />
					<Stack.Screen name="(provider-tabs)" />
					<Stack.Screen name="favorites" />
					<Stack.Screen name="medical-record" />
				</Stack>
			</AuthProvider>
		</QueryClientProvider>
	);
}

export default function Layout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<RootNavigator />
		</GestureHandlerRootView>
	);
}
