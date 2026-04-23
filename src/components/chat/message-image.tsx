import { Image } from "expo-image";
import { Image as ImageIcon } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";

interface MessageImageProps {
	uri: string;
	fileName: string | null;
	isMine: boolean;
}

export function MessageImage({ uri, fileName, isMine }: MessageImageProps) {
	const { theme } = useUnistyles();
	const [imageLoading, setImageLoading] = useState(true);
	const [imageError, setImageError] = useState(false);

	return (
		<View style={styles.messageImageContainer}>
			{!imageError ? (
				<>
					<Image
						source={{ uri }}
						style={styles.messageImage}
						onLoadStart={() => {
							setImageLoading(true);
							setImageError(false);
						}}
						onLoad={() => setImageLoading(false)}
						onError={() => {
							setImageLoading(false);
							setImageError(true);
						}}
					/>
					{imageLoading && (
						<View style={styles.imageLoadingOverlay}>
							<ActivityIndicator size="large" color={theme.colors.primary} />
						</View>
					)}
				</>
			) : (
				<View style={styles.imageErrorContainer}>
					<ImageIcon
						size={48}
						color={theme.colors.mutedForeground}
						strokeWidth={1.5}
					/>
					<Text style={styles.imageErrorText}>Failed to load image</Text>
				</View>
			)}
			{fileName && (
				<View style={styles.imageCaption}>
					<Text
						style={[
							styles.imageCaptionText,
							isMine && styles.imageCaptionTextMine,
						]}
						numberOfLines={1}
					>
						{fileName}
					</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	messageImageContainer: {
		width: "100%",
		maxHeight: 300,
		borderRadius: 12,
		overflow: "hidden",
		backgroundColor: "#f0f0f0",
	},
	messageImage: {
		width: "100%",
		minHeight: 150,
		maxHeight: 300,
	},
	imageCaption: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	imageCaptionText: {
		fontSize: 12,
		color: "#fff",
	},
	imageCaptionTextMine: {
		color: "#fff",
	},
	imageLoadingOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.1)",
		justifyContent: "center",
		alignItems: "center",
	},
	imageErrorContainer: {
		width: "100%",
		height: 200,
		justifyContent: "center",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#f5f5f5",
	},
	imageErrorText: {
		fontSize: 14,
		color: "#999",
		textAlign: "center",
	},
});
