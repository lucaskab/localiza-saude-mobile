import { useLocalSearchParams, useRouter } from "expo-router";
import {
	ArrowLeft,
	Award,
	Calendar,
	CheckCircle2,
	Clock,
	DollarSign,
	Sparkles,
	Star,
	Briefcase,
	X,
} from "lucide-react-native";
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth";
import { useHealthcareProvider } from "@/hooks/use-healthcare-providers";
import {
	useCreateRating,
	useRatingsByProvider,
	useUpdateRating,
} from "@/hooks/use-ratings";
import { getErrorMessage } from "@/services/api";
import type { Rating } from "@/types/rating";
import {
	fivePointRatingToApiRating,
	formatAverageRating,
	formatReviewCount,
	ratingToFivePointScale,
} from "@/utils/ratings";

export default function DoctorDetails() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { theme } = useUnistyles();
	const insets = useSafeAreaInsets();
	const { customer, isCustomer, user } = useAuth();
	const [selectedRating, setSelectedRating] = useState(0);
	const [ratingComment, setRatingComment] = useState("");
	const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);

	// Fetch healthcare provider from API
	const { data, isLoading, error, refetch } = useHealthcareProvider(
		id || "",
		!!id,
	);
	const { data: ratingsData, refetch: refetchRatings } = useRatingsByProvider(
		id || "",
		!!id,
	);
	const createRatingMutation = useCreateRating();
	const updateRatingMutation = useUpdateRating();

	const provider = data?.healthcareProvider;
	const isOwnRating = (rating: Rating) =>
		rating.customerId === customer?.id || rating.customer.userId === user?.id;
	const existingRating = useMemo(
		() => ratingsData?.ratings.find(isOwnRating),
		[customer?.id, ratingsData?.ratings, user?.id],
	);
	const isSavingRating =
		createRatingMutation.isPending || updateRatingMutation.isPending;
	const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
	const ratingLabel = selectedRating > 0 ? ratingLabels[selectedRating] : "Rate";

	const openRatingModal = () => {
		if (existingRating) {
			setSelectedRating(ratingToFivePointScale(existingRating.rating));
			setRatingComment(existingRating.comment ?? "");
		} else {
			setSelectedRating(0);
			setRatingComment("");
		}

		setIsRatingModalVisible(true);
	};

	useEffect(() => {
		if (!existingRating) {
			setSelectedRating(0);
			setRatingComment("");
			return;
		}

		setSelectedRating(ratingToFivePointScale(existingRating.rating));
		setRatingComment(existingRating.comment ?? "");
	}, [existingRating]);

	// Loading state
	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={styles.loadingText}>Loading provider details...</Text>
			</View>
		);
	}

	// Error state
	if (error || !provider) {
		return (
			<View style={styles.errorContainer}>
				<Text style={styles.errorTitle}>Provider not found</Text>
				<Text style={styles.errorText}>
					{error ? "Failed to load provider details" : "Provider not found"}
				</Text>
				<Button onPress={() => router.back()} style={styles.errorButton}>
					Go Back
				</Button>
				{error && (
					<Button
						variant="outline"
						onPress={() => refetch()}
						style={styles.retryButton}
					>
						Retry
					</Button>
				)}
			</View>
		);
	}

	const providerUser = provider.user;
	const averageRating = ratingsData?.stats.averageRating ?? provider.averageRating;
	const totalRatings = ratingsData?.stats.totalRatings ?? provider.totalRatings;

	const handleSubmitRating = async () => {
		if (!provider || selectedRating === 0) {
			Alert.alert("Rating required", "Choose a star rating before submitting.");
			return;
		}
		if (!customer?.id) {
			Alert.alert(
				"Customer profile required",
				"We could not find your customer profile. Please sign in again and try once more.",
			);
			return;
		}

		const payload = {
			rating: fivePointRatingToApiRating(selectedRating),
			comment: ratingComment.trim() || null,
		};

		try {
			const latestRatings = existingRating
				? ratingsData
				: (await refetchRatings()).data;
			const ratingToUpdate =
				existingRating || latestRatings?.ratings.find(isOwnRating);

			if (ratingToUpdate) {
				await updateRatingMutation.mutateAsync({
					ratingId: ratingToUpdate.id,
					healthcareProviderId: provider.id,
					data: payload,
				});
			} else {
				await createRatingMutation.mutateAsync({
					customerId: customer.id,
					healthcareProviderId: provider.id,
					...payload,
				});
			}

			setIsRatingModalVisible(false);
			Alert.alert("Thank you", "Your rating was saved.");
		} catch (error) {
			Alert.alert("Error", getErrorMessage(error));
		}
	};

	// Calculate stats
	const totalProcedures = provider.procedures.length;
	const lowestPrice =
		totalProcedures > 0
			? Math.min(...provider.procedures.map((p) => p.priceInCents)) / 100
			: 0;
	const avgDuration =
		totalProcedures > 0
			? Math.round(
					provider.procedures.reduce((acc, p) => acc + p.durationInMinutes, 0) /
						totalProcedures,
				)
			: 0;

	// Working hours (mock data - could come from API in future)
	const workingHours = [
		{ day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" },
		{ day: "Saturday", hours: "10:00 AM - 2:00 PM" },
		{ day: "Sunday", hours: "Closed" },
	];

	return (
		<View style={styles.container}>
			{/* Header with Image */}
			<View style={styles.headerContainer}>
				{providerUser.image ? (
					<Image
						source={{ uri: providerUser.image }}
						style={styles.headerImage}
					/>
				) : (
					<View style={[styles.headerImage, styles.headerImagePlaceholder]}>
						<Text style={styles.headerImageInitial}>
							{providerUser.name.charAt(0).toUpperCase()}
						</Text>
					</View>
				)}
				<View style={styles.headerOverlay} />
				<Pressable
					style={[styles.backButton, { top: insets.top + 16 }]}
					onPress={() => router.back()}
				>
					<ArrowLeft
						size={24}
						color={theme.colors.foreground}
						strokeWidth={2}
					/>
				</Pressable>
			</View>

			<ScrollView
				style={styles.scrollView}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + 100 },
				]}
			>
				{/* Basic Info */}
				<View style={styles.infoCard}>
					<View style={styles.infoHeader}>
						<View style={styles.infoTitleContainer}>
							<View style={styles.nameRow}>
								<Text style={styles.name} numberOfLines={2}>
									{providerUser.name}
								</Text>
								{providerUser.emailVerified && (
									<View style={styles.verifiedBadge}>
										<CheckCircle2
											size={20}
											color={theme.colors.primary}
											strokeWidth={2.5}
										/>
									</View>
								)}
							</View>
							<Text style={styles.specialty}>
								{provider.specialty || "Healthcare Provider"}
							</Text>
							{provider.professionalId && (
								<Text style={styles.professionalId}>
									License: {provider.professionalId}
								</Text>
							)}
						</View>
					</View>

					<View style={styles.statsRow}>
						<View style={styles.statItem}>
							<Star
								size={18}
								color={theme.colors.amber}
								fill={theme.colors.amber}
								strokeWidth={2}
							/>
							<Text style={styles.statValue}>
								{formatAverageRating(averageRating)}
							</Text>
							<Text style={styles.statLabel}>
								({formatReviewCount(totalRatings)})
							</Text>
						</View>
						<View style={styles.statItem}>
							<Briefcase
								size={18}
								color={theme.colors.mutedForeground}
								strokeWidth={2}
							/>
							<Text style={styles.statLabel}>
								{totalProcedures} procedure{totalProcedures !== 1 ? "s" : ""}
							</Text>
						</View>
					</View>
				</View>

				{/* Stats Cards */}
				<View style={styles.statsGrid}>
					<View style={styles.statsCard}>
						<Award size={24} color={theme.colors.primary} strokeWidth={2} />
						<Text style={styles.statsCardLabel}>Verified</Text>
						<Text style={styles.statsCardValue}>
							{providerUser.emailVerified ? "Yes" : "No"}
						</Text>
					</View>
					<View style={styles.statsCard}>
						<DollarSign
							size={24}
							color={theme.colors.primary}
							strokeWidth={2}
						/>
						<Text style={styles.statsCardLabel}>From</Text>
						<Text style={styles.statsCardValue}>
							{lowestPrice > 0 ? `$${lowestPrice}` : "N/A"}
						</Text>
					</View>
					<View style={styles.statsCard}>
						<Clock size={24} color={theme.colors.primary} strokeWidth={2} />
						<Text style={styles.statsCardLabel}>Avg Time</Text>
						<Text style={styles.statsCardValue}>
							{avgDuration > 0 ? `${avgDuration} min` : "N/A"}
						</Text>
					</View>
				</View>

				{/* About */}
				{provider.bio && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>About</Text>
						<Text style={styles.aboutText}>{provider.bio}</Text>
					</View>
				)}

				{/* Rating Prompt */}
				{isCustomer && (
					<Pressable
						style={styles.ratingPrompt}
						onPress={openRatingModal}
						disabled={isSavingRating}
					>
						<View style={styles.ratingPromptIcon}>
							<Sparkles size={22} color="#ffffff" strokeWidth={2.4} />
						</View>
						<View style={styles.ratingPromptContent}>
							<Text style={styles.ratingPromptTitle}>
								{existingRating ? "Update your rating" : "Rate this provider"}
							</Text>
							<Text style={styles.ratingPromptSubtitle}>
								Your feedback helps other patients choose with confidence.
							</Text>
						</View>
						<View style={styles.ratingPromptStars}>
							{[1, 2, 3].map((star) => (
								<Star
									key={star}
									size={18}
									color={theme.colors.amber}
									fill={theme.colors.amber}
									strokeWidth={2}
								/>
							))}
						</View>
					</Pressable>
				)}

				{/* Procedures */}
				{provider.procedures.length > 0 && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>
							Available Procedures ({provider.procedures.length})
						</Text>
						<View style={styles.proceduresContainer}>
							{provider.procedures.map((procedure) => (
								<View key={procedure.id} style={styles.procedureCard}>
									<View style={styles.procedureHeader}>
										<Text style={styles.procedureName}>{procedure.name}</Text>
										<Text style={styles.procedurePrice}>
											${(procedure.priceInCents / 100).toFixed(2)}
										</Text>
									</View>
									{procedure.description && (
										<Text style={styles.procedureDescription} numberOfLines={2}>
											{procedure.description}
										</Text>
									)}
									<View style={styles.procedureFooter}>
										<View style={styles.procedureDuration}>
											<Clock
												size={14}
												color={theme.colors.mutedForeground}
												strokeWidth={2}
											/>
											<Text style={styles.procedureDurationText}>
												{procedure.durationInMinutes} min
											</Text>
										</View>
									</View>
								</View>
							))}
						</View>
					</View>
				)}

				{/* Contact Info */}
				{(providerUser.email || providerUser.phone) && (
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>Contact Information</Text>
						<View style={styles.contactContainer}>
							{providerUser.email && (
								<View style={styles.contactRow}>
									<Text style={styles.contactLabel}>Email:</Text>
									<Text style={styles.contactValue}>{providerUser.email}</Text>
								</View>
							)}
							{providerUser.phone && (
								<View style={styles.contactRow}>
									<Text style={styles.contactLabel}>Phone:</Text>
									<Text style={styles.contactValue}>{providerUser.phone}</Text>
								</View>
							)}
						</View>
					</View>
				)}

				{/* Working Hours */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Working Hours</Text>
					<View style={styles.workingHoursContainer}>
						{workingHours.map((schedule) => (
							<View key={schedule.day} style={styles.workingHourRow}>
								<View style={styles.workingHourDay}>
									<Clock
										size={16}
										color={theme.colors.mutedForeground}
										strokeWidth={2}
									/>
									<Text style={styles.workingHourDayText}>{schedule.day}</Text>
								</View>
								<Text style={styles.workingHourTime}>{schedule.hours}</Text>
							</View>
						))}
					</View>
				</View>
			</ScrollView>

			{/* Fixed Bottom Button */}
			<View
				style={[
					styles.bottomBar,
					{
						paddingBottom: insets.bottom + 16,
					},
				]}
			>
				<View style={styles.bottomBarContent}>
					<View style={styles.nextAvailableContainer}>
						<Text style={styles.nextAvailableLabel}>
							{totalProcedures > 0 ? "Book" : "Next available"}
						</Text>
						<View style={styles.nextAvailableRow}>
							<Calendar
								size={16}
								color={theme.colors.primary}
								strokeWidth={2}
							/>
							<Text style={styles.nextAvailableTime}>
								{totalProcedures > 0
									? `${totalProcedures} options`
									: "Coming soon"}
							</Text>
						</View>
					</View>
					<Button
						style={styles.bookButton}
						disabled={totalProcedures === 0}
						onPress={() => {
							router.push(`/doctor/${provider.id}/procedures`);
						}}
					>
						Book Appointment
					</Button>
				</View>
			</View>

			<Modal
				animationType="fade"
				transparent
				visible={isRatingModalVisible}
				onRequestClose={() => setIsRatingModalVisible(false)}
			>
				<KeyboardAvoidingView
					behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
					style={styles.ratingModalOverlay}
				>
					<Pressable
						style={styles.ratingModalBackdrop}
						onPress={() => setIsRatingModalVisible(false)}
						disabled={isSavingRating}
					/>
					<View style={styles.ratingModalCard}>
						<Pressable
							style={styles.ratingModalCloseButton}
							onPress={() => setIsRatingModalVisible(false)}
							disabled={isSavingRating}
						>
							<X
								size={20}
								color={theme.colors.mutedForeground}
								strokeWidth={2.2}
							/>
						</Pressable>

						<View style={styles.ratingModalHero}>
							<View style={styles.ratingModalBadge}>
								<Sparkles size={28} color="#ffffff" strokeWidth={2.5} />
							</View>
							<Text style={styles.ratingModalTitle}>
								{existingRating ? "Update your rating" : "How was your visit?"}
							</Text>
							<Text style={styles.ratingModalSubtitle}>
								{providerUser.name} will receive your feedback after you submit.
							</Text>
						</View>

						<View style={styles.ratingModalStars}>
							{[1, 2, 3, 4, 5].map((rating) => {
								const isSelected = rating <= selectedRating;

								return (
									<Pressable
										key={rating}
										onPress={() => setSelectedRating(rating)}
										style={[
											styles.ratingModalStarButton,
											isSelected && styles.ratingModalStarButtonSelected,
										]}
										disabled={isSavingRating}
									>
										<Star
											size={30}
											color={theme.colors.amber}
											fill={isSelected ? theme.colors.amber : "transparent"}
											strokeWidth={2.2}
										/>
									</Pressable>
								);
							})}
						</View>
						<Text style={styles.ratingModalSelectedLabel}>{ratingLabel}</Text>

						<Textarea
							placeholder="Optional review"
							value={ratingComment}
							onChangeText={setRatingComment}
							disabled={isSavingRating}
							style={styles.ratingModalCommentInput}
						/>

						<View style={styles.ratingModalActions}>
							<Button
								variant="outline"
								style={styles.ratingModalActionButton}
								onPress={() => setIsRatingModalVisible(false)}
								disabled={isSavingRating}
							>
								Cancel
							</Button>
							<Button
								style={styles.ratingModalActionButton}
								disabled={selectedRating === 0}
								loading={isSavingRating}
								onPress={handleSubmitRating}
							>
								{existingRating ? "Update" : "Submit"}
							</Button>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.background,
	},
	loadingText: {
		marginTop: theme.gap(2),
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	errorContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: theme.gap(3),
		backgroundColor: theme.colors.background,
	},
	errorTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.foreground,
		marginBottom: theme.gap(1),
	},
	errorText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(3),
		textAlign: "center",
	},
	errorButton: {
		minWidth: 120,
	},
	retryButton: {
		minWidth: 120,
		marginTop: theme.gap(2),
	},
	headerContainer: {
		position: "relative",
		width: "100%",
		height: 280,
	},
	headerImage: {
		width: "100%",
		height: "100%",
		resizeMode: "cover",
	},
	headerImagePlaceholder: {
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	headerImageInitial: {
		fontSize: 80,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
	},
	headerOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.1)",
	},
	backButton: {
		position: "absolute",
		left: 16,
		width: 48,
		height: 48,
		borderRadius: 24,
		backgroundColor: theme.colors.surfacePrimary,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingTop: theme.gap(3),
	},
	infoCard: {
		backgroundColor: theme.colors.surfacePrimary,
		marginHorizontal: theme.gap(3),
		borderRadius: theme.radius.xl,
		padding: theme.gap(3),
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
	infoHeader: {
		marginBottom: theme.gap(2),
	},
	infoTitleContainer: {
		flex: 1,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
		marginBottom: theme.gap(0.5),
		flexWrap: "wrap",
	},
	name: {
		fontSize: 24,
		fontWeight: "600",
		color: theme.colors.foreground,
		flex: 1,
	},
	verifiedBadge: {
		width: 24,
		height: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	specialty: {
		fontSize: 16,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(0.5),
	},
	professionalId: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		fontFamily: "monospace",
	},
	statsRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(3),
		flexWrap: "wrap",
	},
	statItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	statValue: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	statLabel: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	statsGrid: {
		flexDirection: "row",
		marginHorizontal: theme.gap(3),
		marginTop: theme.gap(3),
		gap: theme.gap(2),
	},
	statsCard: {
		flex: 1,
		backgroundColor: `${theme.colors.primary}1A`,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2.5),
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: `${theme.colors.primary}33`,
	},
	statsCardLabel: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(1),
	},
	statsCardValue: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.foreground,
		marginTop: theme.gap(0.25),
	},
	section: {
		marginHorizontal: theme.gap(3),
		marginTop: theme.gap(3),
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: theme.colors.foreground,
		marginBottom: theme.gap(2),
	},
	aboutText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		lineHeight: 22,
	},
	ratingPrompt: {
		marginHorizontal: theme.gap(3),
		marginTop: theme.gap(3),
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(2.5),
		borderWidth: 1,
		borderColor: `${theme.colors.amber}66`,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		boxShadow: "0 10px 24px rgba(245, 158, 11, 0.16)",
	},
	ratingPromptIcon: {
		width: 46,
		height: 46,
		borderRadius: 23,
		backgroundColor: theme.colors.amber,
		alignItems: "center",
		justifyContent: "center",
	},
	ratingPromptContent: {
		flex: 1,
		gap: theme.gap(0.5),
	},
	ratingPromptTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	ratingPromptSubtitle: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		lineHeight: 18,
	},
	ratingPromptStars: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.25),
	},
	ratingModalOverlay: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.gap(2.5),
		paddingVertical: theme.gap(4),
	},
	ratingModalBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(15, 23, 42, 0.58)",
	},
	ratingModalCard: {
		width: "100%",
		maxWidth: 430,
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		padding: theme.gap(3),
		borderWidth: 1,
		borderColor: `${theme.colors.amber}4D`,
		gap: theme.gap(2.25),
		boxShadow: "0 22px 50px rgba(15, 23, 42, 0.24)",
	},
	ratingModalCloseButton: {
		position: "absolute",
		right: theme.gap(2),
		top: theme.gap(2),
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: theme.colors.background,
		alignItems: "center",
		justifyContent: "center",
		zIndex: 1,
	},
	ratingModalHero: {
		alignItems: "center",
		paddingHorizontal: theme.gap(2),
		paddingTop: theme.gap(1),
		gap: theme.gap(1),
	},
	ratingModalBadge: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: theme.colors.amber,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: theme.gap(0.5),
		boxShadow: "0 10px 22px rgba(245, 158, 11, 0.28)",
	},
	ratingModalTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: theme.colors.foreground,
		textAlign: "center",
	},
	ratingModalSubtitle: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
		lineHeight: 20,
	},
	ratingModalStars: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(0.5),
	},
	ratingModalStarButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "transparent",
		backgroundColor: theme.colors.background,
	},
	ratingModalStarButtonSelected: {
		backgroundColor: `${theme.colors.amber}1F`,
		borderColor: `${theme.colors.amber}66`,
	},
	ratingModalSelectedLabel: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.foreground,
		textAlign: "center",
		minHeight: 20,
	},
	ratingModalCommentInput: {
		minHeight: 116,
	},
	ratingModalActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	ratingModalActionButton: {
		flex: 1,
		borderRadius: theme.radius.full,
	},
	proceduresContainer: {
		gap: theme.gap(2),
	},
	procedureCard: {
		backgroundColor: theme.colors.background,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	procedureHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: theme.gap(1),
		gap: theme.gap(2),
	},
	procedureName: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.foreground,
		flex: 1,
	},
	procedurePrice: {
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.primary,
	},
	procedureDescription: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		lineHeight: 20,
		marginBottom: theme.gap(1),
	},
	procedureFooter: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	procedureDuration: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.5),
	},
	procedureDurationText: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	contactContainer: {
		gap: theme.gap(2),
	},
	contactRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	contactLabel: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		minWidth: 60,
	},
	contactValue: {
		fontSize: 14,
		color: theme.colors.foreground,
		fontWeight: "500",
		flex: 1,
	},
	workingHoursContainer: {
		gap: theme.gap(2),
	},
	workingHourRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	workingHourDay: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	workingHourDayText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
	},
	workingHourTime: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	bottomBar: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: theme.colors.surfacePrimary,
		borderTopWidth: 1,
		borderTopColor: theme.colors.border,
		paddingHorizontal: theme.gap(3),
		paddingTop: theme.gap(2),
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: -2,
		},
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 5,
	},
	bottomBarContent: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(2),
	},
	nextAvailableContainer: {
		flex: 1,
	},
	nextAvailableLabel: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(0.5),
	},
	nextAvailableRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	nextAvailableTime: {
		fontSize: 14,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	bookButton: {
		borderRadius: theme.radius.full,
		paddingHorizontal: theme.gap(3),
	},
}));
