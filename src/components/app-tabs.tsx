import { Tabs } from "expo-router";
import {
	Calendar,
	Home,
	MessageCircle,
	Search,
	User,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

export default function AppTabs() {
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
				name="home"
				options={{
					title: t("common.home"),
					tabBarIcon: ({ color, size, focused }) => (
						<Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					title: t("common.search"),
					tabBarIcon: ({ color, size, focused }) => (
						<Search size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
					),
				}}
			/>
			<Tabs.Screen
				name="appointments"
				options={{
					title: t("common.appointments"),
					tabBarIcon: ({ color, size, focused }) => (
						<Calendar
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
				name="profile"
				options={{
					title: t("common.profile"),
					tabBarIcon: ({ color, size, focused }) => (
						<User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
					),
				}}
			/>
		</Tabs>
	);
}
