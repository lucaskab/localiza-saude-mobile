import { ArrowLeft, Check, Globe2 } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
	type SupportedLanguage,
	supportedLanguages,
	supportedLanguagesWithNames,
} from "@/i18n";

export default function LanguageSettings() {
	const { theme } = useUnistyles();
	const { i18n, t } = useTranslation();
	const router = useRouter();
	const activeLanguage = supportedLanguages.includes(
		i18n.language as SupportedLanguage,
	)
		? (i18n.language as SupportedLanguage)
		: "pt-BR";

	const handleChangeLanguage = (language: SupportedLanguage) => {
		i18n.changeLanguage(language);
	};

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<Pressable
						accessibilityRole="button"
						accessibilityLabel={t("common.goBack")}
						testID="language-settings-back-button"
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<ArrowLeft
							size={20}
							color={theme.colors.foreground}
							strokeWidth={2}
						/>
					</Pressable>
					<View style={styles.headerIcon}>
						<Globe2
							size={22}
							color={theme.colors.primary}
							strokeWidth={2}
						/>
					</View>
					<View style={styles.headerCopy}>
						<Text style={styles.title}>{t("common.language")}</Text>
						<Text style={styles.subtitle}>
							{t("common.choosePreferredLanguage")}
						</Text>
					</View>
				</View>

				<View style={styles.menuList}>
					{supportedLanguagesWithNames.map(({ code, name }) => {
						const isSelected = activeLanguage === code;

						return (
							<Pressable
								key={code}
								testID={`language-option-${code}`}
								onPress={() => handleChangeLanguage(code)}
								style={({ pressed }) => [
									styles.menuItem,
									isSelected && styles.menuItemSelected,
									pressed && styles.menuItemPressed,
								]}
							>
								<View
									style={[
										styles.menuIconContainer,
										isSelected && styles.menuIconContainerSelected,
									]}
								>
									<Globe2
										size={20}
										color={
											isSelected
												? theme.colors.primaryForeground
												: theme.colors.primary
										}
										strokeWidth={2}
									/>
								</View>
								<View style={styles.menuContent}>
									<Text
										style={[
											styles.menuLabel,
											isSelected && styles.menuLabelSelected,
										]}
									>
										{name}
									</Text>
									<Text
										style={[
											styles.menuDescription,
											isSelected && styles.menuDescriptionSelected,
										]}
									>
										{code}
									</Text>
								</View>
								{isSelected ? (
									<Check
										size={20}
										color={theme.colors.primary}
										strokeWidth={2.4}
									/>
								) : null}
							</Pressable>
						);
					})}
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
	content: {
		padding: theme.gap(3),
		gap: theme.gap(3),
	},
	header: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	backButton: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	headerIcon: {
		width: 44,
		height: 44,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	headerCopy: {
		flex: 1,
	},
	title: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	subtitle: {
		fontSize: 13,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.5),
	},
	menuList: {
		gap: theme.gap(1),
	},
	menuItem: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	menuItemSelected: {
		borderColor: theme.colors.primary,
	},
	menuItemPressed: {
		backgroundColor: theme.colors.secondary,
		opacity: 0.5,
	},
	menuIconContainer: {
		width: 40,
		height: 40,
		borderRadius: theme.radius.md,
		backgroundColor: theme.colors.secondary,
		alignItems: "center",
		justifyContent: "center",
	},
	menuIconContainerSelected: {
		backgroundColor: theme.colors.primary,
	},
	menuContent: {
		flex: 1,
	},
	menuLabel: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	menuLabelSelected: {
		color: theme.colors.primary,
	},
	menuDescription: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
		marginTop: theme.gap(0.25),
	},
	menuDescriptionSelected: {
		color: theme.colors.primary,
	},
}));
