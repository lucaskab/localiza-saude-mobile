import { ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type StepIndicatorProps = {
	currentStep: number;
	steps: string[];
};

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.list}
		>
			{steps.map((step, index) => (
				<View
					key={step}
					style={[
						styles.item,
						index === currentStep && styles.itemActive,
						index < currentStep && styles.itemCompleted,
					]}
				>
					<Text
						style={[
							styles.meta,
							index === currentStep && styles.textActive,
						]}
					>
						{index + 1}
					</Text>
					<Text
						style={[
							styles.text,
							index === currentStep && styles.textActive,
						]}
					>
						{step}
					</Text>
				</View>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create((theme) => ({
	list: {
		gap: theme.gap(1),
		paddingBottom: theme.gap(2),
	},
	item: {
		minWidth: 132,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.secondary,
		paddingHorizontal: theme.gap(1.5),
		paddingVertical: theme.gap(1),
	},
	itemActive: {
		borderColor: theme.colors.primary,
		backgroundColor: `${theme.colors.primary}14`,
	},
	itemCompleted: {
		borderColor: `${theme.colors.primary}66`,
	},
	meta: {
		fontSize: 11,
		fontWeight: "700",
		color: theme.colors.mutedForeground,
	},
	text: {
		marginTop: theme.gap(0.25),
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.secondaryForeground,
	},
	textActive: {
		color: theme.colors.primary,
	},
}));
