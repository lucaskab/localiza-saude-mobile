import { useMemo } from "react";
import {
	ActivityIndicator,
	Image,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
	AlertCircle,
	MessageCircle,
	Star,
	TrendingUp,
} from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useRatingsByProvider } from "@/hooks/use-ratings";
import type { Rating } from "@/types/rating";
import {
	formatAverageRating,
	formatReviewCount,
	ratingToFivePointScale,
} from "@/utils/ratings";

export default function ProviderRatings() {
	const { theme } = useUnistyles();
	const insets = useSafeAreaInsets();
	const { healthcareProvider, isLoading: isAuthLoading } = useAuth();
	const providerId = healthcareProvider?.id || "";

	const {
		data,
		isLoading,
		error,
		refetch,
		isRefetching,
	} = useRatingsByProvider(providerId, !!providerId);

	const ratings = useMemo(
		() =>
			[...(data?.ratings || [])].sort(
				(a, b) =>
					new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
			),
		[data?.ratings],
	);

	const writtenReviews = ratings.filter((rating) => rating.comment?.trim());
	const positiveRatings = ratings.filter(
		(rating) => ratingToFivePointScale(rating.rating) >= 4,
	);
	const needsAttentionRatings = ratings.filter(
		(rating) => ratingToFivePointScale(rating.rating) <= 3,
	);
	const distribution = [5, 4, 3, 2, 1].map((stars) => {
		const count = ratings.filter(
			(rating) => Math.round(ratingToFivePointScale(rating.rating)) === stars,
		).length;
		const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;

		return { stars, count, percentage };
	});

	const isInitialLoading = isAuthLoading || (isLoading && ratings.length === 0);

	const renderStars = (rating: number, size = 16) => {
		const fivePointRating = Math.round(ratingToFivePointScale(rating));

		return [1, 2, 3, 4, 5].map((star) => {
			const isFilled = star <= fivePointRating;

			return (
				<Star
					key={star}
					size={size}
					color={theme.colors.amber}
					fill={isFilled ? theme.colors.amber : "transparent"}
					strokeWidth={2}
				/>
			);
		});
	};

	const formatDate = (isoDate: string) =>
		new Date(isoDate).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});

	const getCustomerInitial = (rating: Rating) =>
		rating.customer.user.name.charAt(0).toUpperCase();

	const getRatingTone = (rating: number) => {
		const fivePointRating = ratingToFivePointScale(rating);

		if (fivePointRating >= 4) {
			return {
				label: "Positive",
				color: "#166534",
				backgroundColor: "#dcfce7",
			};
		}

		if (fivePointRating >= 3) {
			return {
				label: "Neutral",
				color: "#92400e",
				backgroundColor: "#fef3c7",
			};
		}

		return {
			label: "Needs attention",
			color: "#991b1b",
			backgroundColor: "#fee2e2",
		};
	};

	if (isInitialLoading) {
		return (
			<SafeAreaView style={styles.centerContainer}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={styles.loadingText}>Loading reviews...</Text>
			</SafeAreaView>
		);
	}

	if (!providerId) {
		return (
			<SafeAreaView style={styles.centerContainer}>
				<View style={styles.errorIcon}>
					<AlertCircle size={28} color={theme.colors.destructive} />
				</View>
				<Text style={styles.errorTitle}>Provider profile unavailable</Text>
				<Text style={styles.errorText}>
					We could not find a provider profile for this account.
				</Text>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={styles.centerContainer}>
				<View style={styles.errorIcon}>
					<AlertCircle size={28} color={theme.colors.destructive} />
				</View>
				<Text style={styles.errorTitle}>Unable to load reviews</Text>
				<Text style={styles.errorText}>
					Refresh the page to try loading patient feedback again.
				</Text>
				<Button onPress={() => refetch()} style={styles.retryButton}>
					Retry
				</Button>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
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
					{ paddingBottom: insets.bottom + theme.gap(14) },
				]}
			>
				<View style={styles.header}>
					<Text style={styles.title}>Reviews</Text>
					<Text style={styles.subtitle}>
						Patient feedback about appointments and care experience.
					</Text>
				</View>

				<View style={styles.summaryCard}>
					<View style={styles.averageBlock}>
						<View style={styles.averageIcon}>
							<Star
								size={28}
								color={theme.colors.amber}
								fill={theme.colors.amber}
								strokeWidth={2}
							/>
						</View>
						<Text style={styles.averageValue}>
							{formatAverageRating(data?.stats.averageRating)}
						</Text>
						<View style={styles.averageStars}>
							{renderStars(data?.stats.averageRating || 0, 18)}
						</View>
						<Text style={styles.averageLabel}>
							{formatReviewCount(data?.stats.totalRatings)}
						</Text>
					</View>

					<View style={styles.distributionContainer}>
						{distribution.map((item) => (
							<View key={item.stars} style={styles.distributionRow}>
								<Text style={styles.distributionLabel}>{item.stars}</Text>
								<Star
									size={12}
									color={theme.colors.amber}
									fill={theme.colors.amber}
									strokeWidth={2}
								/>
								<View style={styles.distributionTrack}>
									<View
										style={[
											styles.distributionFill,
											{ width: `${item.percentage}%` },
										]}
									/>
								</View>
								<Text style={styles.distributionCount}>{item.count}</Text>
							</View>
						))}
					</View>
				</View>

				<View style={styles.insightGrid}>
					<View style={styles.insightCard}>
						<TrendingUp size={20} color="#16a34a" strokeWidth={2.2} />
						<Text style={styles.insightValue}>{positiveRatings.length}</Text>
						<Text style={styles.insightLabel}>Positive ratings</Text>
					</View>
					<View style={styles.insightCard}>
						<MessageCircle
							size={20}
							color={theme.colors.primary}
							strokeWidth={2.2}
						/>
						<Text style={styles.insightValue}>{writtenReviews.length}</Text>
						<Text style={styles.insightLabel}>Written reviews</Text>
					</View>
					<View style={styles.insightCard}>
						<AlertCircle size={20} color="#dc2626" strokeWidth={2.2} />
						<Text style={styles.insightValue}>
							{needsAttentionRatings.length}
						</Text>
						<Text style={styles.insightLabel}>Needs attention</Text>
					</View>
				</View>

				<View style={styles.reviewsSection}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Recent feedback</Text>
						<Text style={styles.sectionCount}>{ratings.length}</Text>
					</View>

					{ratings.length === 0 ? (
						<View style={styles.emptyState}>
							<View style={styles.emptyIcon}>
								<Star size={30} color={theme.colors.amber} strokeWidth={2} />
							</View>
							<Text style={styles.emptyTitle}>No reviews yet</Text>
							<Text style={styles.emptyText}>
								New patient ratings will appear here as soon as they are submitted.
							</Text>
						</View>
					) : (
						<View style={styles.reviewList}>
							{ratings.map((rating) => {
								const tone = getRatingTone(rating.rating);
								const comment = rating.comment?.trim();

								return (
									<View key={rating.id} style={styles.reviewCard}>
										<View style={styles.reviewHeader}>
											<View style={styles.customerAvatarContainer}>
												{rating.customer.user.image ? (
													<Image
														source={{ uri: rating.customer.user.image }}
														style={styles.customerAvatar}
													/>
												) : (
													<View style={styles.customerAvatarFallback}>
														<Text style={styles.customerAvatarInitial}>
															{getCustomerInitial(rating)}
														</Text>
													</View>
												)}
											</View>

											<View style={styles.customerInfo}>
												<Text style={styles.customerName} numberOfLines={1}>
													{rating.customer.user.name}
												</Text>
												<Text style={styles.reviewDate}>
													{formatDate(rating.createdAt)}
												</Text>
											</View>

											<View
												style={[
													styles.toneBadge,
													{ backgroundColor: tone.backgroundColor },
												]}
											>
												<Text style={[styles.toneText, { color: tone.color }]}>
													{tone.label}
												</Text>
											</View>
										</View>

										<View style={styles.reviewRatingRow}>
											<View style={styles.reviewStars}>
												{renderStars(rating.rating)}
											</View>
											<Text style={styles.reviewScore}>
												{ratingToFivePointScale(rating.rating).toFixed(1)}
											</Text>
										</View>

										<Text
											style={[
												styles.reviewComment,
												!comment && styles.reviewCommentMuted,
											]}
											selectable={!!comment}
										>
											{comment || "No written review."}
										</Text>
									</View>
								);
							})}
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	centerContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: theme.gap(3),
		backgroundColor: theme.colors.background,
	},
	loadingText: {
		marginTop: theme.gap(2),
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	errorIcon: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#fee2e2",
		marginBottom: theme.gap(2),
	},
	errorTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.foreground,
		marginBottom: theme.gap(1),
	},
	errorText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		lineHeight: 20,
		marginBottom: theme.gap(3),
	},
	retryButton: {
		minWidth: 120,
		borderRadius: theme.radius.full,
	},
	scrollContent: {
		paddingHorizontal: theme.gap(3),
		paddingTop: theme.gap(3),
		gap: theme.gap(3),
	},
	header: {
		gap: theme.gap(0.75),
	},
	title: {
		fontSize: 32,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	subtitle: {
		fontSize: 15,
		color: theme.colors.mutedForeground,
		lineHeight: 21,
	},
	summaryCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(3),
		boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
	},
	averageBlock: {
		alignItems: "center",
		gap: theme.gap(1),
	},
	averageIcon: {
		width: 58,
		height: 58,
		borderRadius: 29,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: `${theme.colors.amber}1F`,
		borderWidth: 1,
		borderColor: `${theme.colors.amber}4D`,
	},
	averageValue: {
		fontSize: 44,
		fontWeight: "800",
		color: theme.colors.foreground,
		fontVariant: ["tabular-nums"],
	},
	averageStars: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.25),
	},
	averageLabel: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
	},
	distributionContainer: {
		gap: theme.gap(1),
	},
	distributionRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.75),
	},
	distributionLabel: {
		width: 10,
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.foreground,
		textAlign: "center",
	},
	distributionTrack: {
		flex: 1,
		height: 8,
		borderRadius: 4,
		overflow: "hidden",
		backgroundColor: theme.colors.surfaceMuted,
	},
	distributionFill: {
		height: "100%",
		borderRadius: 4,
		backgroundColor: theme.colors.amber,
	},
	distributionCount: {
		width: 22,
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.mutedForeground,
		textAlign: "right",
		fontVariant: ["tabular-nums"],
	},
	insightGrid: {
		flexDirection: "row",
		gap: theme.gap(1.5),
	},
	insightCard: {
		flex: 1,
		minHeight: 118,
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(1),
		justifyContent: "center",
	},
	insightValue: {
		fontSize: 24,
		fontWeight: "800",
		color: theme.colors.foreground,
		fontVariant: ["tabular-nums"],
	},
	insightLabel: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		lineHeight: 16,
	},
	reviewsSection: {
		gap: theme.gap(2),
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	sectionCount: {
		minWidth: 32,
		paddingHorizontal: theme.gap(1.25),
		paddingVertical: theme.gap(0.5),
		borderRadius: theme.radius.full,
		backgroundColor: theme.colors.surfaceSecondary,
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.primary,
		textAlign: "center",
		fontVariant: ["tabular-nums"],
	},
	emptyState: {
		alignItems: "center",
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(4),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(1),
	},
	emptyIcon: {
		width: 62,
		height: 62,
		borderRadius: 31,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: `${theme.colors.amber}1A`,
		marginBottom: theme.gap(1),
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		lineHeight: 20,
	},
	reviewList: {
		gap: theme.gap(2),
	},
	reviewCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(1.5),
	},
	reviewHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	customerAvatarContainer: {
		width: 46,
		height: 46,
		borderRadius: 23,
		overflow: "hidden",
		backgroundColor: theme.colors.surfaceMuted,
	},
	customerAvatar: {
		width: "100%",
		height: "100%",
	},
	customerAvatarFallback: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.primary,
	},
	customerAvatarInitial: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.primaryForeground,
	},
	customerInfo: {
		flex: 1,
		gap: theme.gap(0.25),
	},
	customerName: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	reviewDate: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	toneBadge: {
		paddingHorizontal: theme.gap(1.25),
		paddingVertical: theme.gap(0.5),
		borderRadius: theme.radius.full,
	},
	toneText: {
		fontSize: 11,
		fontWeight: "700",
	},
	reviewRatingRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	reviewStars: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.25),
	},
	reviewScore: {
		fontSize: 13,
		fontWeight: "800",
		color: theme.colors.foreground,
		fontVariant: ["tabular-nums"],
	},
	reviewComment: {
		fontSize: 14,
		lineHeight: 21,
		color: theme.colors.foreground,
	},
	reviewCommentMuted: {
		color: theme.colors.mutedForeground,
		fontStyle: "italic",
	},
}));
