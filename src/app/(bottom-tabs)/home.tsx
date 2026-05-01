import { useRouter } from "expo-router";
import { MapPin, Search, Star } from "lucide-react-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Image,
	Pressable,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useCategories, getProvidersByCategory } from "@/hooks/use-categories";
import { formatNextAvailableAt } from "@/utils/availability";
import { formatAverageRating, formatRatingCount } from "@/utils/ratings";

export default function Home() {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const [selectedCategory, setSelectedCategory] = useState("all");

	// Fetch categories with their healthcare providers
	const { data, isLoading, error, refetch, isRefetching } = useCategories();

	const categories = data?.categories || [];

	// Get providers based on selected category
	const providers = getProvidersByCategory(categories, selectedCategory);
	const featuredProfessionals = providers.slice(0, 4);

	// Handle refresh
	const onRefresh = async () => {
		await refetch();
	};

	return (
		<View style={styles.container}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={onRefresh}
						tintColor={theme.colors.primary}
						colors={[theme.colors.primary]}
					/>
				}
			>
				{/* Header */}
				<View
					style={[styles.header, { paddingTop: insets.top + theme.gap(3) }]}
				>
					<View style={styles.headerTop}>
						<View>
							<Text style={styles.welcomeText}>{t("common.welcomeBack")}</Text>
							<Text style={styles.headerTitle}>{t("common.findYourCare")}</Text>
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
						onPress={() => router.push("/(bottom-tabs)/search")}
					>
						<Search
							size={20}
							color={theme.colors.mutedForeground}
							strokeWidth={2}
							style={styles.searchIcon}
						/>
						<Text style={styles.searchPlaceholder}>
							{t("common.searchDoctorsSpecialists")}
						</Text>
					</Pressable>
				</View>

				{/* Categories */}
				<View style={styles.categoriesSection}>
					<Text style={styles.sectionTitle}>{t("common.categories")}</Text>

					{isLoading && (
						<View style={styles.categoriesLoading}>
							<ActivityIndicator size="small" color={theme.colors.primary} />
						</View>
					)}

					{!isLoading && categories.length > 0 && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.categoriesScroll}
						>
							{/* All Categories */}
							<Pressable
								onPress={() => setSelectedCategory("all")}
								style={[
									styles.categoryButton,
									selectedCategory === "all" && styles.categoryButtonActive,
								]}
							>
								<Text style={styles.categoryIcon}>🏥</Text>
								<Text style={styles.categoryName}>{t("common.all")}</Text>
							</Pressable>

							{/* API Categories */}
							{categories.map((category) => (
								<Pressable
									key={category.id}
									onPress={() => setSelectedCategory(category.id)}
									style={[
										styles.categoryButton,
										selectedCategory === category.id &&
											styles.categoryButtonActive,
									]}
								>
									<Text style={styles.categoryIcon}>
										{getCategoryIcon(category.name)}
									</Text>
									<Text style={styles.categoryName}>{category.name}</Text>
								</Pressable>
							))}
						</ScrollView>
					)}
				</View>

				{/* Featured Professionals */}
				<View style={styles.professionalsSection}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>{t("common.topRated")}</Text>
						<Pressable onPress={() => router.push("/(bottom-tabs)/search")}>
							<Text style={styles.seeAllButton}>{t("common.seeAll")}</Text>
						</Pressable>
					</View>

					{/* Loading State */}
					{isLoading && (
						<View style={styles.loadingContainer}>
							<ActivityIndicator size="large" color={theme.colors.primary} />
							<Text style={styles.loadingText}>{t("common.loadingProviders")}</Text>
						</View>
					)}

					{/* Error State */}
					{error && !isLoading && (
						<View style={styles.errorContainer}>
							<Text style={styles.errorText}>
								{t("common.failedToLoadHealthcareProviders")}
							</Text>
							<Button onPress={() => refetch()} size="sm">
								{t("common.retry")}
							</Button>
						</View>
					)}

					{/* Empty State */}
					{!isLoading && !error && providers.length === 0 && (
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>
								{selectedCategory !== "all"
									? t("common.noProvidersFoundForThisCategory")
									: t("common.noProvidersFound")}
							</Text>
						</View>
					)}

					{/* Providers List */}
					{!isLoading && !error && providers.length > 0 && (
						<View style={styles.professionalsList}>
							{featuredProfessionals.map((provider) => (
								<Pressable
									key={provider.id}
									onPress={() => router.push(`/doctor/${provider.id}`)}
								>
									<View style={styles.professionalCard}>
										<View style={styles.professionalContent}>
											{provider.user.image ? (
												<Image
													source={{ uri: provider.user.image }}
													style={styles.professionalImage}
												/>
											) : (
												<View
													style={[
														styles.professionalImage,
														styles.professionalImagePlaceholder,
													]}
												>
													<Text style={styles.professionalImageInitial}>
														{provider.user.name.charAt(0).toUpperCase()}
													</Text>
												</View>
											)}
											<View style={styles.professionalInfo}>
												<View style={styles.professionalHeader}>
													<Text
														style={styles.professionalName}
														numberOfLines={1}
													>
														{provider.user.name}
													</Text>
												</View>
												<Text style={styles.professionalSpecialty}>
													{provider.specialty || t("common.healthcareProvider")}
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
															{formatAverageRating(provider.averageRating)}
														</Text>
														<Text style={styles.reviewsText}>
															{formatRatingCount(provider.totalRatings)}
														</Text>
													</View>
												</View>
											</View>
										</View>
										<View style={styles.professionalFooter}>
											<View>
												<Text style={styles.nextAvailableLabel}>
													{t("common.nextAvailable")}
												</Text>
												<Text style={styles.nextAvailableTime}>
													{formatNextAvailableAt(provider.nextAvailableAt)}
												</Text>
											</View>
											<Button
												size="sm"
												style={styles.bookButton}
												onPress={(e) => {
													e?.stopPropagation();
													router.push(`/doctor/${provider.id}/procedures`);
												}}
											>
												{t("common.bookNow")}
											</Button>
										</View>
									</View>
								</Pressable>
							))}
						</View>
					)}
				</View>
			</ScrollView>
		</View>
	);
}

// Helper function to get category icon based on name
function getCategoryIcon(categoryName: string): string {
	const iconMap: Record<string, string> = {
		Cardiology: "❤️",
		Dermatology: "🧴",
		Pediatrics: "👶",
		Orthopedics: "🦴",
		Neurology: "🧠",
		Psychiatry: "🧘",
		General: "👨‍⚕️",
		Dentistry: "🦷",
		Ophthalmology: "👁️",
		ENT: "👂",
		Gynecology: "🤰",
		Urology: "💧",
	};

	// Try to find a match in the map
	const match = Object.keys(iconMap).find((key) =>
		categoryName.toLowerCase().includes(key.toLowerCase()),
	);

	return match ? iconMap[match] : "⚕️";
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
	categoriesLoading: {
		paddingVertical: theme.gap(4),
		alignItems: "center",
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
	professionalImagePlaceholder: {
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	professionalImageInitial: {
		fontSize: 32,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
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
	loadingContainer: {
		paddingVertical: theme.gap(6),
		alignItems: "center",
		justifyContent: "center",
	},
	loadingText: {
		marginTop: theme.gap(2),
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	errorContainer: {
		paddingVertical: theme.gap(4),
		paddingHorizontal: theme.gap(3),
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.surfaceMuted,
		borderRadius: theme.radius.xl,
	},
	errorText: {
		fontSize: 14,
		color: theme.colors.destructive,
		marginBottom: theme.gap(2),
		textAlign: "center",
	},
	emptyContainer: {
		paddingVertical: theme.gap(6),
		alignItems: "center",
		justifyContent: "center",
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
}));
