import {
	MapPin,
	Search as SearchIcon,
	SlidersHorizontal,
	Star,
} from "lucide-react-native";
import { useState } from "react";
import {
	Image,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import type { Category } from "@/data/professionals";
import { categories, professionals } from "@/data/professionals";

export default function Search() {
	const { theme } = useUnistyles();
	const insets = useSafeAreaInsets();
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");

	const filteredProfessionals = professionals.filter((professional) => {
		const matchesSearch =
			professional.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			professional.specialty.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesCategory =
			selectedCategory === "all" ||
			professional.categoryId === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={[styles.header, { paddingTop: insets.top + theme.gap(3) }]}>
				<Text style={styles.headerTitle}>Find Professional</Text>
				<View style={styles.searchRow}>
					<View style={styles.searchInputContainer}>
						<SearchIcon
							size={20}
							color={theme.colors.mutedForeground}
							strokeWidth={2}
							style={styles.searchIcon}
						/>
						<TextInput
							placeholder="Search..."
							value={searchQuery}
							onChangeText={setSearchQuery}
							style={styles.searchInput}
							placeholderTextColor={theme.colors.mutedForeground}
						/>
					</View>
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
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.categoryScroll}
				>
					{categories.map((category: Category) => (
						<Pressable
							key={category.id}
							onPress={() => setSelectedCategory(category.id)}
							style={[
								styles.categoryChip,
								selectedCategory === category.id && styles.categoryChipActive,
							]}
						>
							<Text style={styles.categoryIcon}>{category.icon}</Text>
							<Text
								style={[
									styles.categoryText,
									selectedCategory === category.id && styles.categoryTextActive,
								]}
							>
								{category.name}
							</Text>
						</Pressable>
					))}
				</ScrollView>
			</View>

			{/* Results */}
			<ScrollView
				style={styles.resultsContainer}
				showsVerticalScrollIndicator={false}
			>
				<Text style={styles.resultsCount}>
					{filteredProfessionals.length} professionals found
				</Text>

				<View style={styles.resultsList}>
					{filteredProfessionals.map((professional) => (
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
									<Text style={styles.professionalSpecialty} numberOfLines={1}>
										{professional.specialty}
									</Text>
									<View style={styles.professionalStats}>
										<View style={styles.statItem}>
											<Star
												size={12}
												color={theme.colors.amber}
												fill={theme.colors.amber}
												strokeWidth={2}
											/>
											<Text style={styles.ratingText}>
												{professional.rating}
											</Text>
										</View>
										<View style={styles.statItem}>
											<MapPin
												size={12}
												color={theme.colors.mutedForeground}
												strokeWidth={2}
											/>
											<Text style={styles.distanceText}>
												{professional.distance}
											</Text>
										</View>
										<Text style={styles.priceText}>${professional.price}</Text>
									</View>
								</View>
							</View>
						</View>
					))}
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
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: theme.colors.surfaceInput,
		borderRadius: theme.radius.lg,
		paddingHorizontal: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
	},
	searchIcon: {
		marginRight: theme.gap(1.5),
	},
	searchInput: {
		flex: 1,
		fontSize: 14,
		color: theme.colors.foreground,
		paddingVertical: theme.gap(1.5),
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
		width: 16,
		height: 16,
		borderRadius: 8,
		backgroundColor: theme.colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	verifiedText: {
		fontSize: 10,
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
		gap: theme.gap(1.5),
	},
	statItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(0.5),
	},
	ratingText: {
		fontSize: 12,
		color: theme.colors.foreground,
		fontWeight: "500",
	},
	distanceText: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	priceText: {
		fontSize: 12,
		color: theme.colors.primary,
		fontWeight: "600",
	},
}));
