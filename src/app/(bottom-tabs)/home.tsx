import { useRouter } from "expo-router";
import { MapPin, Search, Star } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import type { Category } from "@/data/professionals";
import { categories, professionals } from "@/data/professionals";

export default function Home() {
	const { theme } = useUnistyles();
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const [selectedCategory, setSelectedCategory] = useState("all");

	const featuredProfessionals = professionals.slice(0, 4);

	return (
		<View style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View
					style={[styles.header, { paddingTop: insets.top + theme.gap(3) }]}
				>
					<View style={styles.headerTop}>
						<View>
							<Text style={styles.welcomeText}>Welcome back,</Text>
							<Text style={styles.headerTitle}>Find Your Care</Text>
						</View>
						<View style={styles.locationButton}>
							<MapPin
								size={24}
								color={theme.colors.primaryForeground}
								strokeWidth={2}
							/>
						</View>
					</View>

					{/* Search Bar */}
					<Pressable
						style={styles.searchContainer}
						onPress={() => router.push("/search")}
					>
						<Search
							size={20}
							color={theme.colors.mutedForeground}
							strokeWidth={2}
							style={styles.searchIcon}
						/>
						<Text style={styles.searchPlaceholder}>
							Search doctors, specialists...
						</Text>
					</Pressable>
				</View>

				{/* Categories */}
				<View style={styles.categoriesSection}>
					<Text style={styles.sectionTitle}>Categories</Text>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.categoriesScroll}
					>
						{categories.map((category: Category) => (
							<Pressable
								key={category.id}
								onPress={() => setSelectedCategory(category.id)}
								style={[
									styles.categoryButton,
									selectedCategory === category.id &&
										styles.categoryButtonActive,
								]}
							>
								<Text style={styles.categoryIcon}>{category.icon}</Text>
								<Text style={styles.categoryName}>{category.name}</Text>
							</Pressable>
						))}
					</ScrollView>
				</View>

				{/* Featured Professionals */}
				<View style={styles.professionalsSection}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Top Rated</Text>
						<Pressable onPress={() => router.push("/search")}>
							<Text style={styles.seeAllButton}>See All</Text>
						</Pressable>
					</View>

					<View style={styles.professionalsList}>
						{featuredProfessionals.map((professional) => (
							<View key={professional.id} style={styles.professionalCard}>
								<View style={styles.professionalContent}>
									<Image
										source={{ uri: professional.image }}
										style={styles.professionalImage}
									/>
									<View style={styles.professionalInfo}>
										<View style={styles.professionalHeader}>
											<Text style={styles.professionalName} numberOfLines={1}>
												{professional.name}
											</Text>
											{professional.verified && (
												<View style={styles.verifiedBadge}>
													<Text style={styles.verifiedText}>✓</Text>
												</View>
											)}
										</View>
										<Text style={styles.professionalSpecialty}>
											{professional.specialty}
										</Text>
										<View style={styles.professionalStats}>
											<View style={styles.ratingContainer}>
												<Star
													size={14}
													color={theme.colors.amber}
													fill={theme.colors.amber}
													strokeWidth={2}
												/>
												<Text style={styles.ratingText}>
													{professional.rating}
												</Text>
												<Text style={styles.reviewsText}>
													({professional.reviews})
												</Text>
											</View>
											<Text style={styles.experienceText}>
												{professional.experience} years
											</Text>
										</View>
									</View>
								</View>
								<View style={styles.professionalFooter}>
									<View>
										<Text style={styles.nextAvailableLabel}>
											Next available
										</Text>
										<Text style={styles.nextAvailableTime}>
											{professional.nextAvailable}
										</Text>
									</View>
									<Button size="sm" style={styles.bookButton}>
										Book Now
									</Button>
								</View>
							</View>
						))}
					</View>
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
	headerTop: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.gap(3),
	},
	welcomeText: {
		fontSize: 14,
		color: theme.colors.primaryForeground,
		opacity: 0.9,
		marginBottom: theme.gap(0.5),
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "500",
		color: theme.colors.primaryForeground,
	},
	locationButton: {
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: `${theme.colors.white}33`,
		alignItems: "center",
		justifyContent: "center",
	},
	searchContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		paddingHorizontal: theme.gap(2),
		paddingVertical: theme.gap(1.5),
	},
	searchIcon: {
		marginRight: theme.gap(1.5),
	},
	searchPlaceholder: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		flex: 1,
	},
	categoriesSection: {
		paddingVertical: theme.gap(3),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "500",
		color: theme.colors.foreground,
		marginBottom: theme.gap(2),
		paddingHorizontal: theme.gap(3),
	},
	categoriesScroll: {
		paddingHorizontal: theme.gap(3),
		gap: theme.gap(1.5),
	},
	categoryButton: {
		minWidth: 72,
		height: 80,
		borderRadius: theme.radius.xl,
		borderWidth: 2,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surfacePrimary,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.gap(1),
	},
	categoryButtonActive: {
		backgroundColor: `${theme.colors.primary}1A`,
		borderColor: theme.colors.primary,
	},
	categoryIcon: {
		fontSize: 28,
		marginBottom: theme.gap(0.5),
	},
	categoryName: {
		fontSize: 11,
		color: theme.colors.foreground,
		textAlign: "center",
	},
	professionalsSection: {
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(3),
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: theme.gap(2),
	},
	seeAllButton: {
		fontSize: 14,
		color: theme.colors.primary,
		fontWeight: "500",
	},
	professionalsList: {
		gap: theme.gap(2),
	},
	professionalCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	professionalContent: {
		flexDirection: "row",
		gap: theme.gap(2),
		marginBottom: theme.gap(2),
	},
	professionalImage: {
		width: 80,
		height: 80,
		borderRadius: theme.radius.xl,
	},
	professionalInfo: {
		flex: 1,
		minWidth: 0,
	},
	professionalHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		marginBottom: theme.gap(0.5),
	},
	professionalName: {
		fontSize: 16,
		fontWeight: "500",
		color: theme.colors.foreground,
		flex: 1,
	},
	verifiedBadge: {
		width: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	verifiedText: {
		fontSize: 12,
		color: theme.colors.primaryForeground,
		fontWeight: "600",
	},
	professionalSpecialty: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(1),
	},
	professionalStats: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	ratingContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.5),
	},
	ratingText: {
		fontSize: 14,
		color: theme.colors.foreground,
		fontWeight: "500",
	},
	reviewsText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	experienceText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	professionalFooter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: theme.gap(2),
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	nextAvailableLabel: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(0.25),
	},
	nextAvailableTime: {
		fontSize: 14,
		color: theme.colors.foreground,
		fontWeight: "500",
	},
	bookButton: {
		borderRadius: theme.radius.full,
	},
}));
