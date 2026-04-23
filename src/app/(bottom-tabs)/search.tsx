import { useRouter } from "expo-router";
import {
	MessageCircle,
	Search as SearchIcon,
	SlidersHorizontal,
	Star,
} from "lucide-react-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProvidersByCategory, useCategories } from "@/hooks/use-categories";
import { useGetOrCreateConversation } from "@/hooks/use-conversations";

export default function Search() {
	const router = useRouter();
	const { theme } = useUnistyles();
	const insets = useSafeAreaInsets();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");

	const createConversationMutation = useGetOrCreateConversation();

	// Fetch categories with their healthcare providers
	const { data, isLoading, error, refetch } = useCategories();

	const categories = data?.categories || [];

	// Get providers based on selected category
	const providers = getProvidersByCategory(categories, selectedCategory);

	// Client-side filtering for search
	const filteredProfessionals = providers.filter((provider) => {
		const matchesSearch =
			provider.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(provider.specialty?.toLowerCase() || "").includes(
				searchQuery.toLowerCase(),
			);
		return matchesSearch;
	});

	const handleOpenChat = async (healthcareProviderId: string) => {
		try {
			const result = await createConversationMutation.mutateAsync({
				participantId: healthcareProviderId,
			});
			router.push(`/chat/${result.conversation.id}`);
		} catch {
			Alert.alert("Error", "Failed to open chat");
		}
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + theme.gap(3) }]}>
				<Text style={styles.headerTitle}>Find Professional</Text>
				<View style={styles.searchRow}>
					<Input
						leftIcon={SearchIcon}
						placeholder="Search..."
						value={searchQuery}
						onChangeText={setSearchQuery}
						containerStyle={styles.searchInputContainer}
					/>
					<Pressable style={styles.filterButton}>
						<SlidersHorizontal
							size={20}
							color={theme.colors.foreground}
							strokeWidth={2}
						/>
					</Pressable>
				</View>
			</View>

			{/* Category Filter */}
			<View style={styles.categorySection}>
				{isLoading ? (
					<View style={styles.categoryLoading}>
						<ActivityIndicator size="small" color={theme.colors.primary} />
					</View>
				) : (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={styles.categoryScroll}
					>
						{/* All Categories */}
						<Pressable
							onPress={() => setSelectedCategory("all")}
							style={[
								styles.categoryChip,
								selectedCategory === "all" && styles.categoryChipActive,
							]}
						>
							<Text style={styles.categoryIcon}>🏥</Text>
							<Text
								style={[
									styles.categoryText,
									selectedCategory === "all" && styles.categoryTextActive,
								]}
							>
								All
							</Text>
						</Pressable>

						{/* API Categories */}
						{categories.map((category) => (
							<Pressable
								key={category.id}
								onPress={() => setSelectedCategory(category.id)}
								style={[
									styles.categoryChip,
									selectedCategory === category.id && styles.categoryChipActive,
								]}
							>
								<Text style={styles.categoryIcon}>
									{getCategoryIcon(category.name)}
								</Text>
								<Text
									style={[
										styles.categoryText,
										selectedCategory === category.id &&
											styles.categoryTextActive,
									]}
								>
									{category.name}
								</Text>
							</Pressable>
						))}
					</ScrollView>
				)}
			</View>

			{/* Results */}
			<ScrollView
				style={styles.resultsContainer}
				showsVerticalScrollIndicator={false}
			>
				{/* Loading State */}
				{isLoading && (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text style={styles.loadingText}>Searching providers...</Text>
					</View>
				)}

				{/* Error State */}
				{error && !isLoading && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>
							Failed to load healthcare providers
						</Text>
						<Button onPress={() => refetch()} size="sm">
							Retry
						</Button>
					</View>
				)}

				{/* Results Count and List */}
				{!isLoading && !error && (
					<>
						<Text style={styles.resultsCount}>
							{filteredProfessionals.length} professional
							{filteredProfessionals.length !== 1 ? "s" : ""} found
						</Text>

						{/* Empty State */}
						{filteredProfessionals.length === 0 && (
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>
									{searchQuery
										? `No providers found matching "${searchQuery}"`
										: selectedCategory !== "all"
											? "No providers in this category"
											: "No providers available"}
								</Text>
							</View>
						)}

						{/* Providers List */}
						{filteredProfessionals.length > 0 && (
							<View style={styles.resultsList}>
								{filteredProfessionals.map((provider) => {
									return (
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
														<Text
															style={styles.professionalSpecialty}
															numberOfLines={1}
														>
															{provider.specialty || "Healthcare Provider"}
														</Text>
														{provider.bio && (
															<Text
																style={styles.professionalBio}
																numberOfLines={2}
															>
																{provider.bio}
															</Text>
														)}
														<View style={styles.professionalStats}>
															<View style={styles.statItem}>
																<Star
																	size={12}
																	color={theme.colors.amber}
																	fill={theme.colors.amber}
																	strokeWidth={2}
																/>
																<Text style={styles.ratingText}>4.8</Text>
															</View>
															<View style={styles.statDivider} />
															<Text style={styles.availableText}>
																Available today
															</Text>
														</View>
														<View style={styles.professionalActions}>
															<Pressable
																onPress={(e) => {
																	e?.stopPropagation();
																	handleOpenChat(provider.user.id);
																}}
																style={styles.chatButton}
																disabled={createConversationMutation.isPending}
															>
																<MessageCircle
																	size={16}
																	color={theme.colors.foreground}
																	strokeWidth={2}
																/>
																<Text style={styles.chatButtonText}>Chat</Text>
															</Pressable>
															<Pressable
																onPress={(e) => {
																	e?.stopPropagation();
																	router.push(
																		`/doctor/${provider.id}/procedures`,
																	);
																}}
																style={styles.bookButton}
															>
																<Text style={styles.bookButtonText}>
																	Book Now
																</Text>
															</Pressable>
														</View>
													</View>
												</View>
											</View>
										</Pressable>
									);
								})}
							</View>
						)}
					</>
				)}
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
		backgroundColor: theme.colors.surfacePrimary,
		paddingHorizontal: theme.gap(3),
		paddingBottom: theme.gap(2),
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	headerTitle: {
		fontSize: 24,
		fontWeight: "500",
		color: theme.colors.foreground,
		marginBottom: theme.gap(2),
	},
	searchRow: {
		flexDirection: "row",
		gap: theme.gap(1.5),
	},
	searchInputContainer: {
		flex: 1,
	},
	filterButton: {
		width: 48,
		height: 48,
		borderRadius: theme.radius.lg,
		borderWidth: 2,
		borderColor: theme.colors.border,
		backgroundColor: "transparent",
		alignItems: "center",
		justifyContent: "center",
	},
	categorySection: {
		paddingVertical: theme.gap(2),
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	categoryLoading: {
		paddingVertical: theme.gap(2),
		alignItems: "center",
	},
	categoryScroll: {
		paddingHorizontal: theme.gap(3),
		gap: theme.gap(1.5),
	},
	categoryChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		paddingVertical: theme.gap(1),
		borderRadius: theme.radius.full,
		backgroundColor: theme.colors.secondary,
	},
	categoryChipActive: {
		backgroundColor: theme.colors.primary,
	},
	categoryIcon: {
		fontSize: 14,
	},
	categoryText: {
		fontSize: 14,
		color: theme.colors.secondaryForeground,
		fontWeight: "500",
	},
	categoryTextActive: {
		color: theme.colors.primaryForeground,
	},
	resultsContainer: {
		flex: 1,
		paddingHorizontal: theme.gap(3),
		paddingTop: theme.gap(2),
	},
	resultsCount: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(2),
	},
	resultsList: {
		gap: theme.gap(1.5),
		paddingBottom: theme.gap(3),
	},
	professionalCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(1.5),
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
		gap: theme.gap(1.5),
	},
	professionalImage: {
		width: 64,
		height: 64,
		borderRadius: theme.radius.lg,
	},
	professionalImagePlaceholder: {
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	professionalImageInitial: {
		fontSize: 24,
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
		marginBottom: theme.gap(0.5),
	},
	professionalBio: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		lineHeight: 16,
		marginBottom: theme.gap(1),
	},
	professionalStats: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	professionalActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
		marginTop: theme.gap(2),
	},
	chatButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
		paddingVertical: theme.gap(1.5),
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
	},
	chatButtonText: {
		fontSize: 14,
		color: theme.colors.foreground,
		fontWeight: "500",
	},
	bookButton: {
		flex: 1,
		paddingVertical: theme.gap(1.5),
		borderRadius: theme.radius.lg,
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	bookButtonText: {
		fontSize: 14,
		color: theme.colors.primaryForeground,
		fontWeight: "500",
	},
	statItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.5),
	},
	statDivider: {
		width: 1,
		height: 12,
		backgroundColor: theme.colors.border,
	},
	ratingText: {
		fontSize: 12,
		color: theme.colors.foreground,
		fontWeight: "500",
	},
	availableText: {
		fontSize: 12,
		color: theme.colors.primary,
		fontWeight: "500",
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
		marginTop: theme.gap(3),
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
		paddingHorizontal: theme.gap(3),
	},
}));
