import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useRouter } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/auth";
import "@/i18n";
import { queryClient } from "@/services/query-client";

function NotificationResponseHandler() {
	const router = useRouter();

	useEffect(() => {
		const handleResponse = (
			response: Notifications.NotificationResponse | null,
		) => {
			const appointmentId =
				response?.notification.request.content.data?.appointmentId;

			if (typeof appointmentId === "string") {
				router.push(`/appointment/${appointmentId}` as never);
			}
		};

		Notifications.getLastNotificationResponseAsync().then(handleResponse);

		const subscription =
			Notifications.addNotificationResponseReceivedListener(handleResponse);

		return () => {
			subscription.remove();
		};
	}, [router]);

	return null;
}

function RootNavigator() {
	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<NotificationResponseHandler />
				<Stack
					screenOptions={{
						headerShown: false,
					}}
				>
					<Stack.Screen name="login" />
					<Stack.Screen name="(bottom-tabs)" />
					<Stack.Screen name="(provider-tabs)" />
					<Stack.Screen name="favorites" />
					<Stack.Screen name="language-settings" />
					<Stack.Screen name="medical-record" />
					<Stack.Screen name="notification-settings" />
					<Stack.Screen name="provider-create-appointment" />
					<Stack.Screen name="provider-profile-edit" />
					<Stack.Screen name="provider-procedures" />
					<Stack.Screen name="provider-schedule" />
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
