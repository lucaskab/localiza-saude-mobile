import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

export function EmptyState() {
	const { t } = useTranslation();

	return (
		<View style={styles.emptyContainer}>
			<Text style={styles.emptyText}>{t("common.noMessagesYet")}</Text>
			<Text style={styles.emptySubtext}>{t("common.startTheConversation")}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 40,
		gap: 8,
	},
	emptyText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#666",
	},
	emptySubtext: {
		fontSize: 14,
		color: "#999",
	},
});
