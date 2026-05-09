import { useRouter } from "expo-router";
import * as Location from "expo-location";
import {
	Heart,
	MessageCircle,
	Search as SearchIcon,
	SlidersHorizontal,
	Star,
} from "lucide-react-native";
import { useState, type ReactNode } from "react";
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
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	getServiceModalityLabelKey,
	serviceModalityOptions,
} from "@/constants/service-modalities";
import { useCategories } from "@/hooks/use-categories";
import { useGetOrCreateConversation } from "@/hooks/use-conversations";
import {
	useAddFavorite,
	useFavorites,
	useRemoveFavorite,
} from "@/hooks/use-favorites";
import { useInfiniteHealthcareProviders } from "@/hooks/use-healthcare-providers";
import { getErrorMessage } from "@/services/api";
import { formatNextAvailableAt } from "@/utils/availability";
import { formatAverageRating } from "@/utils/ratings";

function priceToCents(value: string) {
	const normalized = value.replace(/\D/g, "");
	return normalized ? Number(normalized) * 100 : undefined;
}

function formatDistance(distance?: number | null) {
	if (typeof distance !== "number") return null;
	return distance < 10 ? distance.toFixed(1) : Math.round(distance).toString();
}

const radiusOptions = ["5", "10", "15", "25", "50"];

export default function Search() {
	const router = useRouter();
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
	const [serviceModality, setServiceModality] = useState("");
	const [language, setLanguage] = useState("");
	const [insurance, setInsurance] = useState("");
	const [city, setCity] = useState("");
	const [neighborhood, setNeighborhood] = useState("");
	const [nearMeLocation, setNearMeLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [radiusInKm, setRadiusInKm] = useState("15");
	const [isLocating, setIsLocating] = useState(false);
	const [maxPrice, setMaxPrice] = useState("");
	const [minRating, setMinRating] = useState("");
	const [onlyVerified, setOnlyVerified] = useState(false);
	const [onlyAvailable, setOnlyAvailable] = useState(false);
	const [onlySuperProfessional, setOnlySuperProfessional] = useState(false);
	const [favoriteMutationProviderId, setFavoriteMutationProviderId] = useState<
		string | null
	>(null);

	const createConversationMutation = useGetOrCreateConversation();
	const { data: favoritesData } = useFavorites();
	const addFavoriteMutation = useAddFavorite();
	const removeFavoriteMutation = useRemoveFavorite();
	const favoriteProviderIds = new Set(
		(favoritesData?.favorites || []).map((provider) => provider.id),
	);

	// Fetch categories with their healthcare providers
	const {
		data,
		isLoading: isCategoriesLoading,
		error: categoriesError,
		refetch: refetchCategories,
	} = useCategories();

	const categories = data?.categories || [];
	const selectedCategoryName =
		selectedCategory === "all"
			? ""
			: categories.find((category) => category.id === selectedCategory)?.name || "";
	const {
		data: providersData,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading: isProvidersLoading,
		error: providersError,
		refetch: refetchProviders,
	} = useInfiniteHealthcareProviders({
		search: searchQuery.trim() || undefined,
		specialty: selectedCategoryName || undefined,
		serviceModality: serviceModality || undefined,
		language: language || undefined,
		insurance: insurance.trim() || undefined,
		city: city.trim() || undefined,
		neighborhood: neighborhood.trim() || undefined,
		latitude: nearMeLocation?.latitude,
		longitude: nearMeLocation?.longitude,
		radiusInKm: nearMeLocation ? Number(radiusInKm) || 15 : undefined,
		maxPriceCents: priceToCents(maxPrice),
		minRating: minRating ? Number(minRating) : undefined,
		verified: onlyVerified || undefined,
		available: onlyAvailable || undefined,
		superProfessional: onlySuperProfessional || undefined,
		limit: 12,
	});
	const filteredProfessionals =
		providersData?.pages.flatMap((page) => page.healthcareProviders) || [];
	const totalProfessionals = providersData?.pages[0]?.total ?? 0;
	const isLoading = isCategoriesLoading || isProvidersLoading;
	const error = categoriesError || providersError;

	const handleOpenChat = async (healthcareProviderId: string) => {
		try {
			const result = await createConversationMutation.mutateAsync({
				participantId: healthcareProviderId,
			});
			router.push(`/chat/${result.conversation.id}`);
		} catch {
			Alert.alert(t("common.error"), t("common.failedToOpenChat"));
		}
	};

	const handleToggleFavorite = async (
		healthcareProviderId: string,
		isFavorite: boolean,
	) => {
		setFavoriteMutationProviderId(healthcareProviderId);

		try {
			if (isFavorite) {
				await removeFavoriteMutation.mutateAsync(healthcareProviderId);
			} else {
				await addFavoriteMutation.mutateAsync({ healthcareProviderId });
			}
		} catch (error) {
			Alert.alert(t("common.error"), getErrorMessage(error));
		} finally {
			setFavoriteMutationProviderId(null);
		}
	};

	const clearFilters = () => {
		setServiceModality("");
		setLanguage("");
		setInsurance("");
		setCity("");
		setNeighborhood("");
		setNearMeLocation(null);
		setRadiusInKm("15");
		setMaxPrice("");
		setMinRating("");
		setOnlyVerified(false);
		setOnlyAvailable(false);
		setOnlySuperProfessional(false);
	};

	const handleNearMe = async () => {
		if (nearMeLocation) {
			setNearMeLocation(null);
			return;
		}

		setIsLocating(true);

		try {
			const permission = await Location.requestForegroundPermissionsAsync();

			if (permission.status !== "granted") {
				Alert.alert(t("common.error"), t("common.locationPermissionDenied"));
				return;
			}

			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});

			setNearMeLocation({
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			});
		} catch {
			Alert.alert(t("common.error"), t("common.locationPermissionDenied"));
		} finally {
			setIsLocating(false);
		}
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + theme.gap(3) }]}>
				<Text style={styles.headerTitle}>{t("common.findProfessional")}</Text>
				<View style={styles.searchRow}>
					<Input
						leftIcon={SearchIcon}
						placeholder={t("common.search2")}
						value={searchQuery}
						onChangeText={setSearchQuery}
						containerStyle={styles.searchInputContainer}
					/>
					<Pressable
						style={[
							styles.filterButton,
							isFilterPanelVisible && styles.filterButtonActive,
						]}
						onPress={() => setIsFilterPanelVisible((visible) => !visible)}
					>
						<SlidersHorizontal
							size={20}
							color={
								isFilterPanelVisible
									? theme.colors.primaryForeground
									: theme.colors.foreground
							}
							strokeWidth={2}
						/>
					</Pressable>
				</View>
				{isFilterPanelVisible ? (
					<View style={styles.filterPanel}>
						<FilterSection title={t("common.serviceModalities")}>
							{serviceModalityOptions.map((item) => (
								<FilterChip
									key={item.value}
									label={t(item.labelKey)}
									active={serviceModality === item.value}
									onPress={() =>
										setServiceModality(
											serviceModality === item.value ? "" : item.value,
										)
									}
								/>
							))}
						</FilterSection>
						<FilterSection title={t("common.attendanceLanguages")}>
							{["Português", "Inglês", "Espanhol"].map((item) => (
								<FilterChip
									key={item}
									label={item}
									active={language === item}
									onPress={() => setLanguage(language === item ? "" : item)}
								/>
							))}
						</FilterSection>
						<FilterSection title={t("common.avgRating")}>
							{["4", "4.5", "4.8"].map((item) => (
								<FilterChip
									key={item}
									label={`${item}+`}
									active={minRating === item}
									onPress={() => setMinRating(minRating === item ? "" : item)}
								/>
							))}
						</FilterSection>
						<View style={styles.filterInputGrid}>
							<Input
								placeholder={t("common.acceptedInsurance")}
								value={insurance}
								onChangeText={setInsurance}
								containerStyle={styles.filterInput}
							/>
							<Input
								placeholder={t("common.maxPrice")}
								value={maxPrice}
								onChangeText={setMaxPrice}
								keyboardType="numeric"
								containerStyle={styles.filterInput}
							/>
						</View>
						<View style={styles.filterInputGrid}>
							<Input
								placeholder={t("common.city")}
								value={city}
								onChangeText={setCity}
								containerStyle={styles.filterInput}
							/>
							<Input
								placeholder={t("common.neighborhood")}
								value={neighborhood}
								onChangeText={setNeighborhood}
								containerStyle={styles.filterInput}
							/>
						</View>
						<View style={styles.locationRow}>
							<FilterChip
								label={
									isLocating
										? "..."
										: nearMeLocation
											? t("common.usingMyLocation")
											: t("common.nearMe")
								}
								active={Boolean(nearMeLocation)}
								onPress={handleNearMe}
							/>
							<Text style={styles.radiusLabel}>{t("common.radiusKm")}</Text>
						</View>
						<View style={styles.radiusChipsRow}>
							{radiusOptions.map((radiusOption) => (
								<FilterChip
									key={radiusOption}
									label={`${radiusOption} km`}
									active={radiusInKm === radiusOption}
									onPress={() => setRadiusInKm(radiusOption)}
								/>
							))}
						</View>
						<View style={styles.filterChipsRow}>
							<FilterChip
								label={t("common.verified")}
								active={onlyVerified}
								onPress={() => setOnlyVerified(!onlyVerified)}
							/>
							<FilterChip
								label={t("common.nextAvailable")}
								active={onlyAvailable}
								onPress={() => setOnlyAvailable(!onlyAvailable)}
							/>
							<FilterChip
								label={t("common.superProfessional")}
								active={onlySuperProfessional}
								onPress={() =>
									setOnlySuperProfessional(!onlySuperProfessional)
								}
							/>
						</View>
						<Button variant="ghost" size="sm" onPress={clearFilters}>
							{t("common.clearFilters")}
						</Button>
					</View>
				) : null}
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
								{t("common.all")}
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
						<Text style={styles.loadingText}>{t("common.searchingProviders")}</Text>
					</View>
				)}

				{/* Error State */}
				{error && !isLoading && (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>
							{t("common.failedToLoadHealthcareProviders")}
						</Text>
						<Button
							onPress={() => {
								refetchCategories();
								refetchProviders();
							}}
							size="sm"
						>
							{t("common.retry")}
						</Button>
					</View>
				)}

				{/* Results Count and List */}
				{!isLoading && !error && (
					<>
						<Text style={styles.resultsCount}>
							{t("common.professionalsFound", {
								count: totalProfessionals,
							})}
						</Text>

						{/* Empty State */}
						{filteredProfessionals.length === 0 && (
							<View style={styles.emptyContainer}>
								<Text style={styles.emptyText}>
									{searchQuery
										? t("common.noProvidersFoundMatchingSearchQuery", {
												searchQuery,
											})
										: selectedCategory !== "all"
											? t("common.noProvidersInThisCategory")
											: t("common.noProvidersAvailable")}
								</Text>
							</View>
						)}

						{/* Providers List */}
						{filteredProfessionals.length > 0 && (
							<View style={styles.resultsList}>
								{filteredProfessionals.map((provider) => {
									const isFavorite = favoriteProviderIds.has(provider.id);
									const isUpdatingFavorite =
										favoriteMutationProviderId === provider.id;

									return (
										<Pressable
											key={provider.id}
											onPress={() => router.push(`/doctor/${provider.id}`)}
										>
											<View style={styles.professionalCard}>
												<View style={styles.professionalContent}>
													{provider.image ? (
														<Image
															source={{ uri: provider.image }}
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
																{provider.name.charAt(0).toUpperCase()}
															</Text>
														</View>
													)}
													<View style={styles.professionalInfo}>
														<View style={styles.professionalHeader}>
															<Text
																style={styles.professionalName}
																numberOfLines={1}
															>
																{provider.displayName || provider.name}
															</Text>
															<Pressable
																onPress={(e) => {
																	e?.stopPropagation();
																	handleToggleFavorite(provider.id, isFavorite);
																}}
																disabled={isUpdatingFavorite}
																style={[
																	styles.favoriteButton,
																	isFavorite && styles.favoriteButtonActive,
																]}
															>
																<Heart
																	size={18}
																	color={
																		isFavorite
																			? theme.colors.destructive
																			: theme.colors.mutedForeground
																	}
																	fill={
																		isFavorite
																			? theme.colors.destructive
																			: "transparent"
																	}
																	strokeWidth={2.2}
																/>
															</Pressable>
														</View>
														<Text
															style={styles.professionalSpecialty}
															numberOfLines={1}
														>
															{[provider.professionalCategory, provider.specialty]
																.filter(Boolean)
																.join(" · ") || t("common.healthcareProvider")}
														</Text>
														{provider.verificationStatus === "VERIFIED" && (
															<Text style={styles.verifiedText}>
																{t("common.verified")}
															</Text>
														)}
														{provider.isSuperProfessional ? (
															<Text style={styles.superProfessionalText}>
																{t("common.superProfessional")}
															</Text>
														) : null}
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
																<Text style={styles.ratingText}>
																	{formatAverageRating(provider.averageRating)}
																</Text>
															</View>
															<View style={styles.statDivider} />
															<Text style={styles.ratingCountText}>
																{t("common.ratingCount", {
																	count: provider.totalRatings ?? 0,
																})}
															</Text>
															<View style={styles.statDivider} />
															<Text style={styles.availableText}>
																{formatNextAvailableAt(
																	provider.nextAvailableAt,
																)}
															</Text>
															{formatDistance(provider.distanceInKm) ? (
																<>
																	<View style={styles.statDivider} />
																	<Text style={styles.locationText}>
																			{t("common.distanceAway", {
																				distance: formatDistance(
																					provider.distanceInKm,
																				) ?? "",
																			})}
																	</Text>
																</>
															) : null}
															{typeof provider.completedAppointments ===
															"number" ? (
																<>
																	<View style={styles.statDivider} />
																	<Text style={styles.ratingCountText}>
																		{t("common.completedAppointmentCount", {
																			count: provider.completedAppointments,
																		})}
																	</Text>
																</>
															) : null}
														</View>
														{provider.serviceModalities?.length ? (
															<Text style={styles.professionalMeta} numberOfLines={1}>
																{provider.serviceModalities
																	.slice(0, 2)
																	.map(
																		(modality) =>
																			t(
																				getServiceModalityLabelKey(modality) ||
																					"common.notInformed",
																			),
																	)
																	.join(" · ")}
															</Text>
														) : null}
														{provider.clinicNeighborhood || provider.clinicCity ? (
															<Text style={styles.professionalMeta} numberOfLines={1}>
																{[
																	provider.clinicNeighborhood,
																	provider.clinicCity,
																]
																	.filter(Boolean)
																	.join(" · ")}
															</Text>
														) : null}
														<View style={styles.professionalActions}>
															<Pressable
																onPress={(e) => {
																	e?.stopPropagation();
																	handleOpenChat(provider.id);
																}}
																style={styles.chatButton}
																disabled={createConversationMutation.isPending}
															>
																<MessageCircle
																	size={16}
																	color={theme.colors.foreground}
																	strokeWidth={2}
																/>
																<Text style={styles.chatButtonText}>{t("common.chat")}</Text>
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
																	{t("common.bookNow")}
																</Text>
															</Pressable>
														</View>
													</View>
												</View>
											</View>
										</Pressable>
									);
								})}
								<View style={styles.paginationFooter}>
									<Text style={styles.paginationText}>
										{t("common.showingProviders", {
											shown: filteredProfessionals.length.toString(),
											total: totalProfessionals.toString(),
										})}
									</Text>
									{hasNextPage ? (
										<Button
											variant="outline"
											size="sm"
											onPress={() => fetchNextPage()}
											disabled={isFetchingNextPage}
										>
											{isFetchingNextPage
												? t("common.loadingMore")
												: t("common.loadMore")}
										</Button>
									) : null}
								</View>
							</View>
						)}
					</>
				)}
			</ScrollView>
		</View>
	);
}

function FilterSection({
	children,
	title,
}: {
	children: ReactNode;
	title: string;
}) {
	return (
		<View style={styles.filterSection}>
			<Text style={styles.filterSectionTitle}>{title}</Text>
			<View style={styles.filterChipsRow}>{children}</View>
		</View>
	);
}

function FilterChip({
	active,
	label,
	onPress,
}: {
	active: boolean;
	label: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={[styles.filterChip, active && styles.filterChipActive]}
		>
			<Text
				style={[styles.filterChipText, active && styles.filterChipTextActive]}
			>
				{label}
			</Text>
		</Pressable>
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
	filterButtonActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	filterPanel: {
		marginTop: theme.gap(2),
		gap: theme.gap(2),
		padding: theme.gap(2),
		borderRadius: theme.radius.lg,
		backgroundColor: theme.colors.background,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	filterSection: {
		gap: theme.gap(1),
	},
	filterSectionTitle: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.mutedForeground,
		textTransform: "uppercase",
	},
	filterChipsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.gap(1),
	},
	filterChip: {
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(0.75),
		borderRadius: theme.radius.full,
		backgroundColor: theme.colors.secondary,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	filterChipActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	filterChipText: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.secondaryForeground,
	},
	filterChipTextActive: {
		color: theme.colors.primaryForeground,
	},
	filterInputGrid: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	filterInput: {
		flex: 1,
	},
	locationRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: theme.gap(1),
	},
	radiusLabel: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.mutedForeground,
	},
	radiusChipsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.gap(1),
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
	paginationFooter: {
		alignItems: "center",
		gap: theme.gap(1),
		paddingVertical: theme.gap(1.5),
	},
	paginationText: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
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
	favoriteButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.background,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	favoriteButtonActive: {
		backgroundColor: "#fee2e2",
		borderColor: "#fecaca",
	},
	professionalSpecialty: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(0.5),
	},
	verifiedText: {
		fontSize: 12,
		color: theme.colors.primary,
		fontWeight: "600",
		marginBottom: theme.gap(0.5),
	},
	superProfessionalText: {
		fontSize: 12,
		color: theme.colors.amber,
		fontWeight: "700",
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
		flexWrap: "wrap",
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
	ratingCountText: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		fontWeight: "500",
	},
	availableText: {
		fontSize: 12,
		color: theme.colors.primary,
		fontWeight: "500",
	},
	locationText: {
		fontSize: 12,
		color: theme.colors.foreground,
		fontWeight: "600",
	},
	professionalMeta: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(1),
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
