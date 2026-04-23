import { Tabs } from "expo-router";
import {
	Calendar,
	Home,
	MessageCircle,
	Search,
	User,
} from "lucide-react-native";
import { useUnistyles } from "react-native-unistyles";

export default function AppTabs() {
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
				name="home"
				options={{
					title: "Home",
					tabBarIcon: ({ color, size, focused }) => (
						<Home size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					title: "Search",
					tabBarIcon: ({ color, size, focused }) => (
						<Search size={size} color={color} strokeWidth={focused ? 2.5 : 2} />
					),
				}}
			/>
			<Tabs.Screen
				name="appointments"
				options={{
					title: "Appointments",
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
