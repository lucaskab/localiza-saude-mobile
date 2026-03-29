import { Calendar, Clock, MapPin, Phone, Video } from "lucide-react-native";
import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockAppointments } from "@/data/appointments";

export default function Appointments() {
	const { theme } = useUnistyles();
	const insets = useSafeAreaInsets();
	const [activeTab, setActiveTab] = useState<"upcoming" | "completed">(
		"upcoming",
	);

	const filteredAppointments = mockAppointments.filter(
		(appointment) =>
			(activeTab === "upcoming" && appointment.status === "upcoming") ||
			(activeTab === "completed" && appointment.status === "completed"),
	);

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + theme.gap(3) }]}>
				<Text style={styles.headerTitle}>My Appointments</Text>

				{/* Tabs */}
				<View style={styles.tabsContainer}>
					<Pressable
						onPress={() => setActiveTab("upcoming")}
						style={[
							styles.tab,
							activeTab === "upcoming" ? styles.tabActive : styles.tabInactive,
						]}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "upcoming"
									? styles.tabTextActive
									: styles.tabTextInactive,
							]}
						>
							Upcoming
						</Text>
					</Pressable>
					<Pressable
						onPress={() => setActiveTab("completed")}
						style={[
							styles.tab,
							activeTab === "completed" ? styles.tabActive : styles.tabInactive,
						]}
					>
						<Text
							style={[
								styles.tabText,
								activeTab === "completed"
									? styles.tabTextActive
									: styles.tabTextInactive,
							]}
						>
							Completed
						</Text>
					</Pressable>
				</View>
			</View>

			{/* Appointments List */}
			<ScrollView
				style={styles.listContainer}
				showsVerticalScrollIndicator={false}
			>
				{filteredAppointments.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Calendar
							size={64}
							color={theme.colors.mutedForeground}
							strokeWidth={1.5}
							style={styles.emptyIcon}
						/>
						<Text style={styles.emptyTitle}>No {activeTab} appointments</Text>
						<Text style={styles.emptyText}>
							You don't have any {activeTab} appointments yet
						</Text>
					</View>
				) : (
					<View style={styles.appointmentsList}>
						{filteredAppointments.map((appointment) => (
							<View key={appointment.id} style={styles.appointmentCard}>
								{/* Status Badge */}
								{appointment.status === "upcoming" && (
									<Badge variant="accent" style={styles.badge}>
										Upcoming
									</Badge>
								)}

								{/* Professional Info */}
								<View style={styles.professionalInfo}>
									<Image
										source={{ uri: appointment.professional.image }}
										style={styles.professionalImage}
									/>
									<View style={styles.professionalDetails}>
										<Text style={styles.professionalName}>
											{appointment.professional.name}
										</Text>
										<Text style={styles.professionalSpecialty}>
											{appointment.professional.specialty}
										</Text>
										<Text style={styles.appointmentType}>
											{appointment.type}
										</Text>
									</View>
								</View>

								{/* Appointment Details */}
								<View style={styles.detailsContainer}>
									<View style={styles.detailRow}>
										<Calendar
											size={16}
											color={theme.colors.primary}
											strokeWidth={2}
										/>
										<Text style={styles.detailText}>{appointment.date}</Text>
									</View>
									<View style={styles.detailRow}>
										<Clock
											size={16}
											color={theme.colors.primary}
											strokeWidth={2}
										/>
										<Text style={styles.detailText}>{appointment.time}</Text>
									</View>
									<View style={styles.detailRow}>
										<MapPin
											size={16}
											color={theme.colors.primary}
											strokeWidth={2}
										/>
										<Text style={styles.detailText}>
											{appointment.professional.distance} away
										</Text>
									</View>
								</View>

								{/* Actions */}
								{appointment.status === "upcoming" && (
									<View style={styles.actionsContainer}>
										<Button
											variant="outline"
											size="sm"
											style={styles.actionButton}
										>
											<View style={styles.iconButton}>
												<Phone
													size={16}
													color={theme.colors.foreground}
													strokeWidth={2}
												/>
												<Text style={styles.detailText}>Call</Text>
											</View>
										</Button>
										<Button size="sm" style={styles.actionButton}>
											<View style={styles.iconButton}>
												<Video
													size={16}
													color={theme.colors.primaryForeground}
													strokeWidth={2}
												/>
												<Text
													style={[
														styles.detailText,
														{ color: theme.colors.primaryForeground },
													]}
												>
													Start Video
												</Text>
											</View>
										</Button>
									</View>
								)}

								{appointment.status === "completed" && (
									<Button
										variant="outline"
										size="sm"
										style={styles.fullWidthButton}
									>
										Book Again
									</Button>
								)}
							</View>
						))}
					</View>
				)}
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
	tabsContainer: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	tab: {
		flex: 1,
		paddingVertical: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		borderRadius: theme.radius.lg,
		alignItems: "center",
	},
	tabActive: {
		backgroundColor: theme.colors.primary,
	},
	tabInactive: {
		backgroundColor: theme.colors.secondary,
	},
	tabText: {
		fontSize: 14,
		fontWeight: "500",
	},
	tabTextActive: {
		color: theme.colors.primaryForeground,
	},
	tabTextInactive: {
		color: theme.colors.secondaryForeground,
	},
	listContainer: {
		flex: 1,
		paddingHorizontal: theme.gap(3),
		paddingVertical: theme.gap(3),
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: theme.gap(8),
	},
	emptyIcon: {
		marginBottom: theme.gap(2),
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "500",
		color: theme.colors.foreground,
		marginBottom: theme.gap(1),
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
	appointmentsList: {
		gap: theme.gap(2),
	},
	appointmentCard: {
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
	badge: {
		marginBottom: theme.gap(1.5),
	},
	professionalInfo: {
		flexDirection: "row",
		gap: theme.gap(2),
		marginBottom: theme.gap(2),
	},
	professionalImage: {
		width: 64,
		height: 64,
		borderRadius: theme.radius.lg,
	},
	professionalDetails: {
		flex: 1,
		justifyContent: "center",
	},
	professionalName: {
		fontSize: 16,
		fontWeight: "500",
		color: theme.colors.foreground,
		marginBottom: theme.gap(0.5),
	},
	professionalSpecialty: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		marginBottom: theme.gap(0.5),
	},
	appointmentType: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	detailsContainer: {
		backgroundColor: `${theme.colors.secondary}80`,
		borderRadius: theme.radius.lg,
		padding: theme.gap(1.5),
		gap: theme.gap(1),
		marginBottom: theme.gap(2),
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	detailText: {
		fontSize: 14,
		color: theme.colors.foreground,
	},
	actionsContainer: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	actionButton: {
		flex: 1,
	},
	iconButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: theme.gap(1),
	},
	fullWidthButton: {
		width: "100%",
	},
}));
