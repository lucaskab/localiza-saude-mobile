import { StyleSheet, Text, View } from "react-native";

export function EmptyState() {
	return (
		<View style={styles.emptyContainer}>
			<Text style={styles.emptyText}>No messages yet</Text>
			<Text style={styles.emptySubtext}>Start the conversation!</Text>
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
