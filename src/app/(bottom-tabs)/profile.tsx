import { useRouter } from "expo-router";
import {
	Bell,
	ChevronRight,
	CreditCard,
	Heart,
	HelpCircle,
	LogOut,
	Settings,
} from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth";
import { useFavorites } from "@/hooks/use-favorites";

const menuItems = [
	{
		icon: Bell,
		label: "Notifications",
		description: "Manage your notifications",
	},
	{
		icon: Heart,
		label: "Favorites",
		description: "Your favorite professionals",
	},
	{
		icon: CreditCard,
		label: "Payment Methods",
		description: "Manage payment options",
	},
	{
		icon: Settings,
		label: "Settings",
		description: "App preferences",
	},
	{
		icon: HelpCircle,
		label: "Help & Support",
		description: "Get help with the app",
	},
];

export default function Profile() {
	const { theme } = useUnistyles();
	const { signOut, user } = useAuth();
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { data: favoritesData } = useFavorites();
	const favoritesCount = favoritesData?.favorites.length ?? 0;

	return (
		<View style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View
					style={[styles.header, { paddingTop: insets.top + theme.gap(3) }]}
				>
					<Text style={styles.headerTitle}>Profile</Text>

					{/* User Info */}
					<View style={styles.userInfo}>
						<Avatar source={user?.image} size="md" />
						<View style={styles.userDetails}>
							<Text style={styles.userName}>{user?.name || "John Doe"}</Text>
							<Text style={styles.userEmail}>
								{user?.email || "johndoe@email.com"}
							</Text>
							<Text style={styles.userPhone}>+1 (555) 123-4567</Text>
						</View>
					</View>

					<Button variant="secondary" size="sm" style={styles.editButton}>
						Edit Profile
					</Button>
				</View>

				{/* Stats */}
				<View style={styles.statsContainer}>
					<View style={styles.statCard}>
						<Text style={styles.statValue}>12</Text>
						<Text style={styles.statLabel}>Appointments</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statValue}>5</Text>
						<Text style={styles.statLabel}>Reviews</Text>
					</View>
					<View style={styles.statCard}>
						<Text style={styles.statValue}>{favoritesCount}</Text>
						<Text style={styles.statLabel}>Favorites</Text>
					</View>
				</View>

				{/* Menu Items */}
				<View style={styles.menuContainer}>
					<View style={styles.menuList}>
						{menuItems.map((item) => {
							const Icon = item.icon;
							return (
								<Pressable
									key={item.label}
									onPress={() => {
										if (item.label === "Favorites") {
											router.push("/favorites");
										}
									}}
									style={({ pressed }) => [
										styles.menuItem,
										pressed && styles.menuItemPressed,
									]}
								>
									<View style={styles.menuIconContainer}>
										<Icon
											size={20}
											color={theme.colors.primary}
											strokeWidth={2}
										/>
									</View>
									<View style={styles.menuContent}>
										<Text style={styles.menuLabel}>{item.label}</Text>
										<Text style={styles.menuDescription}>
											{item.description}
										</Text>
									</View>
									<ChevronRight
										size={20}
										color={theme.colors.mutedForeground}
										strokeWidth={2}
									/>
								</Pressable>
							);
						})}
					</View>

					{/* Logout Button */}
					<Pressable
						onPress={signOut}
						style={({ pressed }) => [
							styles.logoutItem,
							pressed && styles.logoutItemPressed,
						]}
					>
						<View style={styles.logoutIconContainer}>
							<LogOut
								size={20}
								color={theme.colors.destructive}
								strokeWidth={2}
							/>
						</View>
						<View style={styles.menuContent}>
							<Text style={styles.logoutLabel}>Logout</Text>
							<Text style={styles.menuDescription}>
								Sign out of your account
							</Text>
						</View>
					</Pressable>
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
	header: {
		backgroundColor: theme.colors.primary,
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(4),
		borderBottomLeftRadius: theme.radius.xl,
		borderBottomRightRadius: theme.radius.xl,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "500",
		color: theme.colors.primaryForeground,
		marginBottom: theme.gap(3),
	},
	userInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},

	userDetails: {
		flex: 1,
	},
	userName: {
		fontSize: 18,
		fontWeight: "500",
		color: theme.colors.primaryForeground,
	},
	userEmail: {
		fontSize: 14,
		color: theme.colors.primaryForeground,
		opacity: 0.9,
		marginTop: theme.gap(0.5),
	},
	userPhone: {
		fontSize: 14,
		color: theme.colors.primaryForeground,
		opacity: 0.9,
		marginTop: theme.gap(0.5),
	},
	editButton: {
		marginTop: theme.gap(3),
	},
	statsContainer: {
		flexDirection: "row",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(3),
		paddingVertical: theme.gap(3),
	},
	statCard: {
		flex: 1,
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		alignItems: "center",
	},
	statValue: {
		fontSize: 24,
		color: theme.colors.primary,
		fontWeight: "600",
		marginBottom: theme.gap(0.5),
	},
	statLabel: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	menuContainer: {
		flex: 1,
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(3),
	},
	menuList: {
		gap: theme.gap(1),
	},
	menuItem: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	menuItemPressed: {
		backgroundColor: theme.colors.secondary,
		opacity: 0.5,
	},
	menuIconContainer: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	menuContent: {
		flex: 1,
	},
	menuLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	menuDescription: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	logoutItem: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		marginTop: theme.gap(1),
	},
	logoutItemPressed: {
		backgroundColor: `${theme.colors.destructive}1A`,
	},
	logoutIconContainer: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: `${theme.colors.destructive}1A`,
		alignItems: "center",
		justifyContent: "center",
	},
	logoutLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.destructive,
	},
}));
