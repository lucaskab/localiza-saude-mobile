import { useRouter } from "expo-router";
import {
	Heart,
	MessageCircle,
	Search as SearchIcon,
	SlidersHorizontal,
} from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
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
import { getProviderLocationLabel } from "@/lib/format-address";
import { hasStoredJson, readStoredJson, writeStoredJson } from "@/lib/json-storage";
import {
	getAddressLocationFallback,
	requestDeviceCoordinates,
	type SearchCoordinates,
} from "@/lib/search-location";
import { formatNextAvailableAt } from "@/utils/availability";

function priceToCents(value: string) {
	const normalized = value.replace(/\D/g, "");
	return normalized ? Number(normalized) * 100 : undefined;
}

function formatDistance(distance?: number | null) {
	if (typeof distance !== "number") return null;
	return distance < 10 ? distance.toFixed(1) : Math.round(distance).toString();
}

const radiusOptions = ["5", "10", "15", "25", "50"];

type SearchScreenStoredFilters = {
	addressFallbackApplied: boolean;
	city: string;
	insurance: string;
	language: string;
	locationSource: "device" | "address" | null;
	maxPrice: string;
	nearMeEnabled: boolean;
	nearMeLocation: SearchCoordinates | null;
	neighborhood: string;
	radiusInKm: string;
	searchQuery: string;
	selectedCategory: string;
	serviceModality: string;
};

const searchFiltersStorageKey = "customer-search-bottom-sheet-filters";

const defaultStoredSearchFilters: SearchScreenStoredFilters = {
	addressFallbackApplied: false,
	city: "",
	insurance: "",
	language: "",
	locationSource: null,
	maxPrice: "",
	nearMeEnabled: true,
	nearMeLocation: null,
	neighborhood: "",
	radiusInKm: "15",
	searchQuery: "",
	selectedCategory: "all",
	serviceModality: "",
};

function getActiveSearchFilterCount(filters: SearchScreenStoredFilters) {
	let count = 0;

	if (filters.selectedCategory !== "all") count += 1;
	if (filters.serviceModality) count += 1;
	if (filters.language) count += 1;
	if (filters.insurance.trim()) count += 1;
	if (filters.maxPrice.trim()) count += 1;
	if (filters.radiusInKm !== defaultStoredSearchFilters.radiusInKm) count += 1;

	if (filters.locationSource !== "address") {
		if (filters.city.trim()) count += 1;
		if (filters.neighborhood.trim()) count += 1;
	}

	return count;
}

export default function Search() {
	const router = useRouter();
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { customer } = useAuth();
	const storedFiltersRef = useRef(
		readStoredJson<SearchScreenStoredFilters>(
			searchFiltersStorageKey,
			defaultStoredSearchFilters,
		),
	);
	const hasStoredFiltersRef = useRef(hasStoredJson(searchFiltersStorageKey));
	const skipAutomaticLocationRef = useRef(
		hasStoredJson(searchFiltersStorageKey) &&
			(storedFiltersRef.current.nearMeEnabled === false ||
				Boolean(storedFiltersRef.current.nearMeLocation) ||
				Boolean(storedFiltersRef.current.locationSource) ||
				Boolean(storedFiltersRef.current.city.trim()) ||
				Boolean(storedFiltersRef.current.neighborhood.trim())),
	);
	const insets = useSafeAreaInsets();
	const [searchQuery, setSearchQuery] = useState(storedFiltersRef.current.searchQuery);
	const [selectedCategory, setSelectedCategory] = useState(
		storedFiltersRef.current.selectedCategory,
	);
	const [isFiltersSheetVisible, setIsFiltersSheetVisible] = useState(false);
	const [serviceModality, setServiceModality] = useState(
		storedFiltersRef.current.serviceModality,
	);
	const [language, setLanguage] = useState(storedFiltersRef.current.language);
	const [insurance, setInsurance] = useState(storedFiltersRef.current.insurance);
	const [city, setCity] = useState(storedFiltersRef.current.city);
	const [neighborhood, setNeighborhood] = useState(storedFiltersRef.current.neighborhood);
	const [nearMeEnabled, setNearMeEnabled] = useState(
		storedFiltersRef.current.nearMeEnabled,
	);
	const [locationSource, setLocationSource] = useState<"device" | "address" | null>(
		storedFiltersRef.current.locationSource,
	);
	const [addressFallbackApplied, setAddressFallbackApplied] = useState(
		storedFiltersRef.current.addressFallbackApplied,
	);
	const [nearMeLocation, setNearMeLocation] = useState<SearchCoordinates | null>(
		storedFiltersRef.current.nearMeLocation,
	);
	const [radiusInKm, setRadiusInKm] = useState(storedFiltersRef.current.radiusInKm);
	const [isLocating, setIsLocating] = useState(false);
	const gpsAttemptedRef = useRef(false);
	const deviceLocationResolvedRef = useRef(false);
	const [maxPrice, setMaxPrice] = useState(storedFiltersRef.current.maxPrice);
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
		latitude: nearMeEnabled ? nearMeLocation?.latitude : undefined,
		longitude: nearMeEnabled ? nearMeLocation?.longitude : undefined,
		radiusInKm:
			nearMeEnabled && nearMeLocation ? Number(radiusInKm) || 15 : undefined,
		maxPriceCents: priceToCents(maxPrice),
		limit: 12,
	});
	const filteredProfessionals =
		providersData?.pages.flatMap((page) => page.healthcareProviders) || [];
	const totalProfessionals = providersData?.pages[0]?.total ?? 0;
	const isLoading = isCategoriesLoading || isProvidersLoading;
	const error = categoriesError || providersError;

	function applyAddressFallback() {
		const fallback = getAddressLocationFallback(customer?.primaryAddress);

		if (!fallback) {
			return false;
		}

		setNearMeEnabled(true);
		setLocationSource("address");

		if (fallback.coordinates) {
			setNearMeLocation(fallback.coordinates);
			setAddressFallbackApplied(false);
			return true;
		}

		setNearMeLocation(null);
		setCity((current) => current || fallback.city);
		setNeighborhood((current) => current || fallback.neighborhood);
		setAddressFallbackApplied(true);
		return true;
	}

	async function initializeNearMeSearch() {
		setIsLocating(true);

		try {
			const coordinates = await requestDeviceCoordinates();
			deviceLocationResolvedRef.current = true;
			setNearMeEnabled(true);
			setLocationSource("device");
			setNearMeLocation(coordinates);
			setAddressFallbackApplied(false);
			return;
		} catch {
			applyAddressFallback();
		} finally {
			setIsLocating(false);
		}
	}

	useEffect(() => {
		if (skipAutomaticLocationRef.current) {
			return;
		}

		let cancelled = false;

		async function run() {
			if (!gpsAttemptedRef.current) {
				gpsAttemptedRef.current = true;
				setIsLocating(true);

				try {
					const coordinates = await requestDeviceCoordinates();
					if (cancelled) {
						return;
					}

					deviceLocationResolvedRef.current = true;
					setNearMeEnabled(true);
					setLocationSource("device");
					setNearMeLocation(coordinates);
					setAddressFallbackApplied(false);
					return;
				} catch {
					// Fall back to the saved address when permission is denied.
				} finally {
					setIsLocating(false);
				}
			}

			if (cancelled || deviceLocationResolvedRef.current) {
				return;
			}

			applyAddressFallback();
		}

		void run();

		return () => {
			cancelled = true;
		};
	}, [customer?.primaryAddress]);

	useEffect(() => {
		writeStoredJson(searchFiltersStorageKey, {
			addressFallbackApplied,
			city,
			insurance,
			language,
			locationSource,
			maxPrice,
			nearMeEnabled,
			nearMeLocation,
			neighborhood,
			radiusInKm,
			searchQuery,
			selectedCategory,
			serviceModality,
		});
	}, [
		addressFallbackApplied,
		city,
		insurance,
		language,
		locationSource,
		maxPrice,
		nearMeEnabled,
		nearMeLocation,
		neighborhood,
		radiusInKm,
		searchQuery,
		selectedCategory,
		serviceModality,
	]);

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
		setSelectedCategory(defaultStoredSearchFilters.selectedCategory);
		setServiceModality(defaultStoredSearchFilters.serviceModality);
		setLanguage(defaultStoredSearchFilters.language);
		setInsurance(defaultStoredSearchFilters.insurance);
		setCity(defaultStoredSearchFilters.city);
		setNeighborhood(defaultStoredSearchFilters.neighborhood);
		setNearMeEnabled(defaultStoredSearchFilters.nearMeEnabled);
		setNearMeLocation(defaultStoredSearchFilters.nearMeLocation);
		setLocationSource(defaultStoredSearchFilters.locationSource);
		setAddressFallbackApplied(defaultStoredSearchFilters.addressFallbackApplied);
		setRadiusInKm(defaultStoredSearchFilters.radiusInKm);
		setMaxPrice(defaultStoredSearchFilters.maxPrice);
		gpsAttemptedRef.current = false;
		deviceLocationResolvedRef.current = false;
		hasStoredFiltersRef.current = false;
		skipAutomaticLocationRef.current = false;
		void initializeNearMeSearch();
	};

	const handleNearMe = async () => {
		if (nearMeEnabled) {
			setNearMeEnabled(false);
			setNearMeLocation(null);
			setLocationSource(null);

			if (addressFallbackApplied) {
				setCity("");
				setNeighborhood("");
				setAddressFallbackApplied(false);
			}

			return;
		}

		gpsAttemptedRef.current = false;
		deviceLocationResolvedRef.current = false;
		await initializeNearMeSearch();
	};

	const isNearMeActive =
		nearMeEnabled && (Boolean(nearMeLocation) || locationSource === "address");
	const nearMeLabel =
		isLocating && !isNearMeActive
			? t("common.locating")
			: isNearMeActive
				? locationSource === "address"
					? t("common.usingMyAddress")
					: t("common.usingMyLocation")
				: t("common.nearMe");
	const activeFilterCount = getActiveSearchFilterCount({
		addressFallbackApplied,
		city,
		insurance,
		language,
		locationSource,
		maxPrice,
		nearMeEnabled,
		nearMeLocation,
		neighborhood,
		radiusInKm,
		searchQuery,
		selectedCategory,
		serviceModality,
	});

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
							activeFilterCount > 0 && styles.filterButtonActive,
						]}
						onPress={() => setIsFiltersSheetVisible(true)}
					>
						<SlidersHorizontal
							size={20}
							color={
								activeFilterCount > 0
									? theme.colors.primaryForeground
									: theme.colors.foreground
							}
							strokeWidth={2}
						/>
						{activeFilterCount > 0 ? (
							<View style={styles.filterButtonBadge}>
								<Text style={styles.filterButtonBadgeText}>
									{activeFilterCount}
								</Text>
							</View>
						) : null}
					</Pressable>
				</View>
			</View>

			<BottomSheet
				isOpen={isFiltersSheetVisible}
				onClose={() => setIsFiltersSheetVisible(false)}
				title={t("common.filters")}
				badgeCount={activeFilterCount}
			>
				<FilterSection title={t("common.specialty")}>
					<FilterChip
						label={t("common.all")}
						active={selectedCategory === "all"}
						onPress={() => setSelectedCategory("all")}
					/>
					{categories.map((category) => (
						<FilterChip
							key={category.id}
							label={category.name}
							active={selectedCategory === category.id}
							onPress={() => setSelectedCategory(category.id)}
						/>
					))}
				</FilterSection>
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
						label={nearMeLabel}
						active={isNearMeActive}
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
				<Button variant="ghost" size="sm" onPress={clearFilters}>
					{t("common.clearFilters")}
				</Button>
			</BottomSheet>

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
														{provider.bio && (
															<Text
																style={styles.professionalBio}
																numberOfLines={2}
															>
																{provider.bio}
															</Text>
														)}
														<View style={styles.professionalStats}>
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
														{getProviderLocationLabel(provider) ? (
															<Text style={styles.professionalMeta} numberOfLines={1}>
																{getProviderLocationLabel(provider)}
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
	filterButtonBadge: {
		position: "absolute",
		top: -6,
		right: -6,
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
	},
	filterButtonBadgeText: {
		fontSize: 11,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
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
