import { Tabs } from "expo-router";
import {
	ClipboardList,
	LayoutDashboard,
	MessageCircle,
	User,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

export default function ProviderTabs() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: theme.colors.mutedForeground,
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: "500",
				},
			}}
		>
			<Tabs.Screen
				name="dashboard"
				options={{
					title: t("common.dashboard"),
					tabBarButtonTestID: "provider-tab-dashboard",
					tabBarIcon: ({ color, size, focused }) => (
						<LayoutDashboard
							size={size}
							color={color}
							strokeWidth={focused ? 2.5 : 2}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="schedule"
				options={{
					href: null,
				}}
			/>
			<Tabs.Screen
				name="appointments"
				options={{
					title: t("common.appointments"),
					tabBarButtonTestID: "provider-tab-appointments",
					tabBarIcon: ({ color, size, focused }) => (
						<ClipboardList
							size={size}
							color={color}
							strokeWidth={focused ? 2.5 : 2}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="chats"
				options={{
					title: t("common.chats"),
					tabBarButtonTestID: "provider-tab-chats",
					tabBarIcon: ({ color, size, focused }) => (
						<MessageCircle
							size={size}
							color={color}
							strokeWidth={focused ? 2.5 : 2}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="ratings"
				options={{
					href: null,
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					title: t("common.profile"),
					tabBarButtonTestID: "provider-tab-profile",
					tabBarIcon: ({ color, size, focused }) => (
						<User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
					),
				}}
			/>
		</Tabs>
	);
}
