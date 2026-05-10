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
			const screen = response?.notification.request.content.data?.screen;
			const healthcareProviderId =
				response?.notification.request.content.data?.healthcareProviderId;
			const procedureIds =
				response?.notification.request.content.data?.procedureIds;

			if (typeof appointmentId === "string") {
				router.push(`/appointment/${appointmentId}` as never);
				return;
			}

			if (
				screen === "booking" &&
				typeof healthcareProviderId === "string" &&
				typeof procedureIds === "string"
			) {
				router.push(
					`/doctor/${healthcareProviderId}/booking?procedures=${procedureIds}` as never,
				);
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
					<Stack.Screen name="onboarding" />
					<Stack.Screen name="(bottom-tabs)" />
					<Stack.Screen name="(provider-tabs)" />
					<Stack.Screen name="favorites" />
					<Stack.Screen name="language-settings" />
					<Stack.Screen name="medical-record" />
					<Stack.Screen name="notification-settings" />
					<Stack.Screen name="settings" />
					<Stack.Screen name="staff" />
					<Stack.Screen name="provider-create-appointment" />
					<Stack.Screen name="provider-clinic" />
					<Stack.Screen
						name="provider-procedure-create"
						options={{
							presentation: "formSheet",
							sheetAllowedDetents: [0.72, 0.92],
							sheetGrabberVisible: true,
							contentStyle: { backgroundColor: "transparent" },
						}}
					/>
					<Stack.Screen name="provider-profile-edit" />
					<Stack.Screen name="provider-procedures" />
					<Stack.Screen name="provider-ratings" />
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
