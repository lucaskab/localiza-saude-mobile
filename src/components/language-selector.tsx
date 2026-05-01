import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
	type SupportedLanguage,
	supportedLanguages,
	supportedLanguagesWithNames,
} from "@/i18n";

export function LanguageSelector() {
	const { theme } = useUnistyles();
	const { i18n, t } = useTranslation();
	const activeLanguage = supportedLanguages.includes(
		i18n.language as SupportedLanguage,
	)
		? (i18n.language as SupportedLanguage)
		: "pt-BR";

	const handleChangeLanguage = (language: SupportedLanguage) => {
		i18n.changeLanguage(language);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>{t("common.language")}</Text>
			<View style={styles.options}>
				{supportedLanguagesWithNames.map(({ code, name }) => {
					const language = code;
					const isSelected = activeLanguage === language;

					return (
						<Pressable
							key={language}
							onPress={() => handleChangeLanguage(language)}
							style={[
								styles.option,
								isSelected && styles.optionSelected,
							]}
						>
							<Text
								style={[
									styles.optionText,
									isSelected && styles.optionTextSelected,
								]}
							>
								{name}
							</Text>
							{isSelected ? (
								<Check
									size={16}
									color={theme.colors.primaryForeground}
									strokeWidth={2.4}
								/>
							) : null}
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		gap: theme.gap(1.5),
	},
	title: {
		fontSize: 14,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	options: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	option: {
		flex: 1,
		minHeight: 40,
		borderRadius: theme.radius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: theme.gap(1),
		paddingHorizontal: theme.gap(1),
	},
	optionSelected: {
		borderColor: theme.colors.primary,
		backgroundColor: theme.colors.primary,
	},
	optionText: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	optionTextSelected: {
		color: theme.colors.primaryForeground,
	},
}));
