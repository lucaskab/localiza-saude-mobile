import { Image } from "expo-image";
import { ArrowLeft } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";

interface ChatHeaderProps {
	participantName: string | null;
	participantImage: string | null;
	onBackPress: () => void;
}

export function ChatHeader({
	participantName,
	participantImage,
	onBackPress,
}: ChatHeaderProps) {
	const { theme } = useUnistyles();

	return (
		<View style={styles.header}>
			<Pressable onPress={onBackPress} style={styles.backButton}>
				<ArrowLeft size={24} color={theme.colors.foreground} strokeWidth={2} />
			</Pressable>

			{participantName && (
				<View style={styles.headerContent}>
					{participantImage ? (
						<Image
							source={{ uri: participantImage }}
							style={styles.headerAvatar}
						/>
					) : (
						<View style={styles.headerAvatarPlaceholder}>
							<Text style={styles.headerAvatarText}>
								{participantName.charAt(0).toUpperCase()}
							</Text>
						</View>
					)}
					<Text style={styles.headerTitle} numberOfLines={1}>
						{participantName}
					</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(0, 0, 0, 0.1)",
		backgroundColor: "#fff",
		gap: 12,
	},
	backButton: {
		padding: 8,
	},
	headerContent: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	headerAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
	},
	headerAvatarPlaceholder: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#e0e0e0",
		justifyContent: "center",
		alignItems: "center",
	},
	headerAvatarText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#666",
	},
	headerTitle: {
		flex: 1,
		fontSize: 18,
		fontWeight: "600",
		color: "#000",
	},
});
