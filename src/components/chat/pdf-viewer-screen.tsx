import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ExternalLink } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import Pdf from "react-native-pdf";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";

export function PdfViewerScreen() {
	const { uri, name } = useLocalSearchParams<{
		uri?: string;
		name?: string;
	}>();
	const router = useRouter();
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	const handleOpenExternally = async () => {
		if (!uri) {
			Alert.alert(t("common.error"), t("common.pDFURLNotAvailable"));
			return;
		}

		try {
			await WebBrowser.openBrowserAsync(uri);
		} catch {
			Alert.alert(t("common.error"), t("common.couldNotOpenPDFPreview"));
		}
	};

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.container}>
			<View style={styles.header}>
				<Pressable onPress={() => router.back()} style={styles.headerButton}>
					<ArrowLeft
						size={20}
						color={theme.colors.foreground}
						strokeWidth={2}
					/>
				</Pressable>

				<View style={styles.headerTitle}>
					<Text style={styles.title} numberOfLines={1}>
						{name || t("common.pDFDocument")}
					</Text>
				</View>

				<Pressable
					onPress={handleOpenExternally}
					style={styles.headerButton}
					disabled={!uri}
				>
					<ExternalLink
						size={18}
						color={theme.colors.foreground}
						strokeWidth={2}
					/>
				</Pressable>
			</View>

			<View style={styles.viewerWrap}>
				{uri ? (
					<>
						<Pdf
							source={{ uri, cache: true }}
							style={styles.pdf}
							enableDoubleTapZoom
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
								<ActivityIndicator size="large" color={theme.colors.primary} />
								<Text style={styles.overlayText}>{t("common.loadingPDF")}</Text>
							</View>
						) : null}
						{hasError ? (
							<View style={styles.overlay}>
								<Text style={styles.errorText}>{t("common.unableToRenderThisPDF")}</Text>
							</View>
						) : null}
					</>
				) : (
					<View style={styles.overlay}>
						<Text style={styles.errorText}>{t("common.pDFURLNotAvailable2")}</Text>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "rgba(15, 23, 42, 0.08)",
	},
	headerButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		flex: 1,
		paddingHorizontal: 12,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		color: "#111827",
	},
	viewerWrap: {
		flex: 1,
		backgroundColor: "#e5e7eb",
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
		gap: 12,
		backgroundColor: "rgba(255, 255, 255, 0.9)",
		paddingHorizontal: 24,
	},
	overlayText: {
		fontSize: 14,
		color: "#374151",
	},
	errorText: {
		fontSize: 15,
		color: "#4b5563",
		textAlign: "center",
	},
});
