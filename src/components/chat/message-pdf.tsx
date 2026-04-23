import { FileText } from "lucide-react-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useUnistyles } from "react-native-unistyles";
import Pdf from "react-native-pdf";

interface MessagePdfProps {
	uri: string;
	fileName: string | null;
	isMine: boolean;
	onPress?: () => void;
}

export function MessagePdf({
	uri,
	fileName,
	isMine,
	onPress,
}: MessagePdfProps) {
	const { theme } = useUnistyles();
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			style={styles.container}
			accessibilityRole={onPress ? "button" : undefined}
		>
			<View style={styles.previewFrame}>
				{!hasError ? (
					<>
						<Pdf
							source={{ uri, cache: true }}
							style={styles.pdf}
							enableDoubleTapZoom={false}
							trustAllCerts={false}
							onLoadComplete={() => {
								setIsLoading(false);
								setHasError(false);
							}}
							onError={() => {
								setIsLoading(false);
								setHasError(true);
							}}
						/>
						{isLoading ? (
							<View style={styles.overlay}>
								<ActivityIndicator size="small" color={theme.colors.primary} />
								<Text style={styles.overlayText}>Loading PDF...</Text>
							</View>
						) : null}
					</>
				) : (
					<View style={styles.errorState}>
						<FileText
							size={28}
							color={theme.colors.mutedForeground}
							strokeWidth={1.75}
						/>
						<Text style={styles.errorText}>PDF preview unavailable</Text>
					</View>
				)}
			</View>

			<View style={[styles.caption, isMine && styles.captionMine]}>
				<FileText size={14} color="#fff" strokeWidth={2} />
				<Text style={styles.captionText} numberOfLines={1}>
					{fileName || "PDF document"}
				</Text>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		borderRadius: 12,
		overflow: "hidden",
		backgroundColor: "#f3f4f6",
	},
	previewFrame: {
		height: 220,
		backgroundColor: "#f3f4f6",
	},
	pdf: {
		flex: 1,
		width: "100%",
		height: "100%",
		backgroundColor: "#fff",
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		backgroundColor: "rgba(255, 255, 255, 0.88)",
	},
	overlayText: {
		fontSize: 12,
		color: "#4b5563",
	},
	errorState: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingHorizontal: 16,
	},
	errorText: {
		fontSize: 13,
		color: "#6b7280",
	},
	caption: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		backgroundColor: "rgba(17, 24, 39, 0.72)",
	},
	captionMine: {
		backgroundColor: "rgba(255, 255, 255, 0.22)",
	},
	captionText: {
		flex: 1,
		fontSize: 12,
		color: "#fff",
	},
});
