import { Calendar, X } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

interface AppointmentPreviewProps {
	onClear: () => void;
}

export function AppointmentPreview({ onClear }: AppointmentPreviewProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();

	return (
		<View style={styles.selectedAppointmentPreview}>
			<Calendar size={16} color={theme.colors.primary} strokeWidth={2} />
			<Text style={styles.selectedAppointmentText}>{t("common.linkingToAppointment")}</Text>
			<Pressable onPress={onClear}>
				<X size={16} color={theme.colors.foreground} strokeWidth={2} />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	selectedAppointmentPreview: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#f5f5f5",
		borderTopWidth: 1,
		borderTopColor: "rgba(0, 0, 0, 0.1)",
	},
	selectedAppointmentText: {
		flex: 1,
		fontSize: 14,
		color: "#000",
	},
});
