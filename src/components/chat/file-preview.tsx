import { Image } from "expo-image";
import { File as FileIcon, Send, X } from "lucide-react-native";
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useUnistyles } from "react-native-unistyles";
import type { FileUploadResult } from "@/hooks/use-file-upload";
import { formatFileSize, isImage, isPdf } from "./chat-utils";
import { MessagePdf } from "./message-pdf";

interface FilePreviewProps {
	file: FileUploadResult;
	onClearFile: () => void;
	onSendFile: () => void;
	isSending: boolean;
}

export function FilePreview({
	file,
	onClearFile,
	onSendFile,
	isSending,
}: FilePreviewProps) {
	const { theme } = useUnistyles();

	return (
		<View style={styles.filePreviewContainer}>
			<View style={styles.filePreview}>
				{isImage(file.type) ? (
					<View style={styles.filePreviewImageContainer}>
						<Image
							source={{ uri: file.uri }}
							style={styles.filePreviewImage}
							contentFit="cover"
						/>
						<Pressable
							onPress={onClearFile}
							style={styles.filePreviewCloseButton}
						>
							<X
								size={16}
								color={theme.colors.primaryForeground}
								strokeWidth={2}
							/>
						</Pressable>
					</View>
				) : isPdf(file.type) ? (
					<View style={styles.filePreviewPdfContainer}>
						<MessagePdf
							uri={file.uri}
							fileName={file.name}
							isMine={false}
						/>
						<Pressable
							onPress={onClearFile}
							style={styles.filePreviewCloseButton}
						>
							<X
								size={16}
								color={theme.colors.primaryForeground}
								strokeWidth={2}
							/>
						</Pressable>
					</View>
				) : (
					<View style={styles.filePreviewDocument}>
						<FileIcon size={32} color={theme.colors.primary} strokeWidth={2} />
						<View style={styles.filePreviewInfo}>
							<Text style={styles.filePreviewName} numberOfLines={1}>
								{file.name}
							</Text>
							{file.size && (
								<Text style={styles.filePreviewSize}>
									{formatFileSize(file.size)}
								</Text>
							)}
						</View>
						<Pressable onPress={onClearFile}>
							<X
								size={20}
								color={theme.colors.mutedForeground}
								strokeWidth={2}
							/>
						</Pressable>
					</View>
				)}
			</View>

			<Pressable
				onPress={onSendFile}
				disabled={isSending}
				style={[
					styles.sendFileButton,
					isSending && styles.sendFileButtonDisabled,
				]}
			>
				{isSending ? (
					<ActivityIndicator
						size="small"
						color={theme.colors.primaryForeground}
					/>
				) : (
					<Send
						size={20}
						color={theme.colors.primaryForeground}
						strokeWidth={2}
					/>
				)}
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	filePreviewContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: "rgba(0, 0, 0, 0.1)",
		backgroundColor: "#fff",
	},
	filePreview: {
		flex: 1,
	},
	filePreviewImageContainer: {
		position: "relative",
		width: "100%",
		height: 120,
		borderRadius: 12,
		overflow: "hidden",
		backgroundColor: "#f0f0f0",
	},
	filePreviewImage: {
		width: "100%",
		height: "100%",
	},
	filePreviewPdfContainer: {
		position: "relative",
		width: "100%",
	},
	filePreviewCloseButton: {
		position: "absolute",
		top: 8,
		right: 8,
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: "rgba(0, 0, 0, 0.6)",
		justifyContent: "center",
		alignItems: "center",
	},
	filePreviewDocument: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		padding: 12,
		borderRadius: 12,
		backgroundColor: "#f5f5f5",
	},
	filePreviewInfo: {
		flex: 1,
		gap: 4,
	},
	filePreviewName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#000",
	},
	filePreviewSize: {
		fontSize: 12,
		color: "#999",
	},
	sendFileButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: "#007AFF",
		justifyContent: "center",
		alignItems: "center",
	},
	sendFileButtonDisabled: {
		opacity: 0.5,
	},
});
