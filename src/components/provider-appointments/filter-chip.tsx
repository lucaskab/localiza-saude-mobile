import { Pressable, Text } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type FilterChipProps = {
	label: string;
	selected: boolean;
	onPress: () => void;
};

export function FilterChip({ label, selected, onPress }: FilterChipProps) {
	return (
		<Pressable
			onPress={onPress}
			style={[styles.filterChip, selected && styles.filterChipActive]}
		>
			<Text
				style={[
					styles.filterChipText,
					selected && styles.filterChipTextActive,
				]}
				numberOfLines={1}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create((theme) => ({
	filterChip: {
		height: 36,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: theme.gap(1.75),
		borderRadius: theme.radius.full,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
	},
	filterChipActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	filterChipText: {
		fontSize: 12,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	filterChipTextActive: {
		color: theme.colors.primaryForeground,
	},
}));
