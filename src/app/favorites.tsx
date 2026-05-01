import { useRouter } from "expo-router";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
	ArrowLeft,
	Calendar,
	Heart,
	MessageCircle,
	Star,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useFavorites, useRemoveFavorite } from "@/hooks/use-favorites";
import { formatNextAvailableAt } from "@/utils/availability";
import { formatAverageRating, formatReviewCount } from "@/utils/ratings";

export default function FavoritesScreen() {
	const router = useRouter();
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const insets = useSafeAreaInsets();
	const {
		data,
		isLoading,
		error,
		refetch,
		isRefetching,
	} = useFavorites();
	const removeFavoriteMutation = useRemoveFavorite();
	const favorites = data?.favorites || [];

	const handleRemoveFavorite = async (healthcareProviderId: string) => {
		try {
			await removeFavoriteMutation.mutateAsync(healthcareProviderId);
		} catch {
			Alert.alert(t("common.error"), t("common.failedToRemoveThisProviderFromFavorites"));
		}
	};

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.header}>
				<Pressable style={styles.backButton} onPress={() => router.back()}>
					<ArrowLeft
						size={22}
						color={theme.colors.foreground}
						strokeWidth={2.2}
					/>
				</Pressable>
				<View style={styles.headerTextContainer}>
					<Text style={styles.title}>{t("common.favorites")}</Text>
					<Text style={styles.subtitle}>{t("common.yourSavedHealthcareProviders")}</Text>
				</View>
			</View>

			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={refetch}
						tintColor={theme.colors.primary}
					/>
				}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + theme.gap(4) },
				]}
			>
				{isLoading && (
					<View style={styles.centerState}>
						<ActivityIndicator size="large" color={theme.colors.primary} />
						<Text style={styles.centerText}>{t("common.loadingFavorites")}</Text>
					</View>
				)}

				{error && !isLoading && (
					<View style={styles.centerState}>
						<View style={styles.emptyIcon}>
							<Heart
								size={30}
								color={theme.colors.destructive}
								strokeWidth={2.2}
							/>
						</View>
						<Text style={styles.emptyTitle}>{t("common.couldNotLoadFavorites")}</Text>
						<Text style={styles.centerText}>
							{t("common.refreshThePageToTryLoadingYourSavedProvidersAgain")}
						</Text>
						<Button onPress={() => refetch()} style={styles.retryButton}>
							{t("common.retry")}
						</Button>
					</View>
				)}

				{!isLoading && !error && favorites.length === 0 && (
					<View style={styles.centerState}>
						<View style={styles.emptyIcon}>
							<Heart size={30} color={theme.colors.primary} strokeWidth={2.2} />
						</View>
						<Text style={styles.emptyTitle}>{t("common.noFavoritesYet")}</Text>
						<Text style={styles.centerText}>
							{t("common.tapTheHeartOnAProviderCardToSaveThemHere")}
						</Text>
						<Button
							onPress={() => router.push("/(bottom-tabs)/search")}
							style={styles.retryButton}
						>
							{t("common.findProviders")}
						</Button>
					</View>
				)}

				{!isLoading && !error && favorites.length > 0 && (
					<View style={styles.list}>
						<Text style={styles.countText}>
							{t("common.favoriteCount", { count: favorites.length })}
						</Text>
						{favorites.map((provider) => (
							<Pressable
								key={provider.id}
								onPress={() => router.push(`/doctor/${provider.id}`)}
								style={styles.card}
							>
								<View style={styles.cardHeader}>
									{provider.user.image ? (
										<Image
											source={{ uri: provider.user.image }}
											style={styles.avatar}
										/>
									) : (
										<View style={[styles.avatar, styles.avatarFallback]}>
											<Text style={styles.avatarInitial}>
												{provider.user.name.charAt(0).toUpperCase()}
											</Text>
										</View>
									)}

									<View style={styles.providerInfo}>
										<Text style={styles.providerName} numberOfLines={1}>
											{provider.user.name}
										</Text>
										<Text style={styles.providerSpecialty} numberOfLines={1}>
											{provider.specialty || t("common.healthcareProvider")}
										</Text>
									</View>

									<Pressable
										onPress={(event) => {
											event?.stopPropagation();
											handleRemoveFavorite(provider.id);
										}}
										disabled={removeFavoriteMutation.isPending}
										style={styles.favoriteButton}
									>
										<Heart
											size={20}
											color={theme.colors.destructive}
											fill={theme.colors.destructive}
											strokeWidth={2.2}
										/>
									</Pressable>
								</View>

								{provider.bio && (
									<Text style={styles.providerBio} numberOfLines={2}>
										{provider.bio}
									</Text>
								)}

								<View style={styles.statsRow}>
									<View style={styles.statItem}>
										<Star
											size={14}
											color={theme.colors.amber}
											fill={theme.colors.amber}
											strokeWidth={2}
										/>
										<Text style={styles.statText}>
											{formatAverageRating(provider.averageRating)}
										</Text>
										<Text style={styles.mutedStatText}>
											{formatReviewCount(provider.totalRatings)}
										</Text>
									</View>
									<View style={styles.statItem}>
										<Calendar
											size={14}
											color={theme.colors.primary}
											strokeWidth={2}
										/>
										<Text style={styles.availableText}>
											{formatNextAvailableAt(provider.nextAvailableAt)}
										</Text>
									</View>
								</View>

								<View style={styles.actions}>
									<Pressable
										onPress={(event) => {
											event?.stopPropagation();
											router.push(`/doctor/${provider.id}`);
										}}
										style={styles.secondaryButton}
									>
										<MessageCircle
											size={16}
											color={theme.colors.foreground}
											strokeWidth={2}
										/>
										<Text style={styles.secondaryButtonText}>{t("common.details")}</Text>
									</Pressable>
									<Pressable
										onPress={(event) => {
											event?.stopPropagation();
											router.push(`/doctor/${provider.id}/procedures`);
										}}
										style={styles.primaryButton}
									>
										<Text style={styles.primaryButtonText}>{t("common.bookNow")}</Text>
									</Pressable>
								</View>
							</Pressable>
						))}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(3),
		paddingVertical: theme.gap(2),
		backgroundColor: theme.colors.surfacePrimary,
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	backButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.background,
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	headerTextContainer: {
		flex: 1,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	subtitle: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	scrollContent: {
		padding: theme.gap(3),
	},
	centerState: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.gap(8),
		paddingHorizontal: theme.gap(3),
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(1.25),
	},
	emptyIcon: {
		width: 64,
		height: 64,
		borderRadius: 32,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.secondary,
		marginBottom: theme.gap(0.5),
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
		textAlign: "center",
	},
	centerText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		lineHeight: 20,
	},
	retryButton: {
		marginTop: theme.gap(1),
		borderRadius: theme.radius.full,
		minWidth: 140,
	},
	list: {
		gap: theme.gap(2),
	},
	countText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	card: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(1.5),
		boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
	},
	cardHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	avatar: {
		width: 58,
		height: 58,
		borderRadius: theme.radius.lg,
	},
	avatarFallback: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
	},
	avatarInitial: {
		fontSize: 22,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
	},
	providerInfo: {
		flex: 1,
		minWidth: 0,
	},
	providerName: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	providerSpecialty: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	favoriteButton: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#fee2e2",
	},
	providerBio: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		flexWrap: "wrap",
	},
	statItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.5),
	},
	statText: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	mutedStatText: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
	},
	availableText: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.primary,
	},
	actions: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
		paddingTop: theme.gap(1.5),
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
	},
	secondaryButton: {
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
	secondaryButtonText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	primaryButton: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.gap(1.5),
		borderRadius: theme.radius.lg,
		backgroundColor: theme.colors.primary,
	},
	primaryButtonText: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
	},
}));
