import { Tabs } from "expo-router";
import {
	Calendar,
	ClipboardList,
	LayoutDashboard,
	MessageCircle,
	Star,
	User,
} from "lucide-react-native";
import { useUnistyles } from "react-native-unistyles";

export default function ProviderTabs() {
	const { theme } = useUnistyles();

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
					title: "Dashboard",
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
					title: "Schedule",
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
				name="appointments"
				options={{
					title: "Appointments",
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
					title: "Chats",
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
					title: "Reviews",
					tabBarIcon: ({ color, size, focused }) => (
						<Star
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
					title: "Profile",
					tabBarIcon: ({ color, size, focused }) => (
						<User size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
					),
				}}
			/>
		</Tabs>
	);
}
