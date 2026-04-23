import {
	Calendar,
	CheckCheck,
	Clock,
	File as FileIcon,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import type { Message } from "@/types/conversation";
import { formatTimestamp, isImage, isPdf } from "./chat-utils";
import { MessageImage } from "./message-image";
import { MessagePdf } from "./message-pdf";

interface ChatMessageProps {
	message: Message;
	currentUserId?: string;
	onFilePress: (
		fileUrl: string | null,
		fileName: string | null,
		mimeType: string | null,
	) => void;
}

export function ChatMessage({
	message,
	currentUserId,
	onFilePress,
}: ChatMessageProps) {
	const { theme } = useUnistyles();
	const isMine = !!(message.senderId === currentUserId || message.isOptimistic);

	return (
		<View
			style={[
				styles.messageWrapper,
				isMine ? styles.messageWrapperMine : styles.messageWrapperOther,
			]}
		>
			<View
				style={[
					styles.messageBubble,
					isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
					message.status === "error" && styles.messageBubbleError,
				]}
			>
				{/* Sender name for received messages */}
				{!isMine && (
					<Text style={styles.senderName}>{message.sender.name}</Text>
				)}

				{/* Text content */}
				{message.messageType === "TEXT" && message.content && (
					<Text
						style={[styles.messageContent, isMine && styles.messageContentMine]}
					>
						{message.content}
					</Text>
				)}

				{/* File attachment */}
				{message.messageType === "FILE" && (
					<Pressable
						onPress={() =>
							onFilePress(
								message.fileUrl,
								message.fileName,
								message.fileMimeType,
							)
						}
					>
						{message.fileMimeType && isImage(message.fileMimeType) ? (
							<MessageImage
								uri={message.fileUrl || ""}
								fileName={message.fileName}
								isMine={isMine}
							/>
						) : message.fileMimeType && isPdf(message.fileMimeType) ? (
							<MessagePdf
								uri={message.fileUrl || ""}
								fileName={message.fileName}
								isMine={isMine}
							/>
						) : (
							<View
								style={[
									styles.fileAttachment,
									isMine && styles.fileAttachmentMine,
								]}
							>
								<FileIcon
									size={16}
									color={
										isMine
											? theme.colors.primaryForeground
											: theme.colors.foreground
									}
									strokeWidth={2}
								/>
								<Text
									style={[styles.fileName, isMine && styles.fileNameMine]}
									numberOfLines={1}
								>
									{message.fileName || "File"}
								</Text>
							</View>
						)}
					</Pressable>
				)}

				{/* Related appointment */}
				{message.relatedAppointment && (
					<View
						style={[
							styles.relatedAppointment,
							isMine && styles.relatedAppointmentMine,
						]}
					>
						<Calendar
							size={14}
							color={
								isMine ? theme.colors.primaryForeground : theme.colors.primary
							}
							strokeWidth={2}
						/>
						<Text
							style={[
								styles.relatedAppointmentText,
								isMine && styles.relatedAppointmentTextMine,
							]}
						>
							{new Date(
								message.relatedAppointment.scheduledAt,
							).toLocaleDateString("en-US", {
								month: "short",
								day: "numeric",
								hour: "numeric",
								minute: "2-digit",
							})}
						</Text>
					</View>
				)}
			</View>

			{/* Timestamp and status */}
			<View style={styles.timestampRow}>
				<Text style={styles.timestamp}>
					{formatTimestamp(message.createdAt)}
				</Text>

				{/* Status indicator for sent messages */}
				{isMine && (
					<View style={styles.statusIndicator}>
						{message.status === "pending" ? (
							<Clock
								size={12}
								color={theme.colors.mutedForeground}
								strokeWidth={2}
							/>
						) : message.status === "error" ? (
							<Text style={styles.errorText}>!</Text>
						) : (
							<CheckCheck
								size={12}
								color={theme.colors.mutedForeground}
								strokeWidth={2}
							/>
						)}
					</View>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	messageWrapper: {
		marginBottom: 12,
		maxWidth: "80%",
	},
	messageWrapperMine: {
		alignSelf: "flex-end",
		alignItems: "flex-end",
	},
	messageWrapperOther: {
		alignSelf: "flex-start",
		alignItems: "flex-start",
	},
	messageBubble: {
		borderRadius: 16,
		paddingHorizontal: 16,
		paddingVertical: 10,
		gap: 4,
	},
	messageBubbleMine: {
		backgroundColor: "#007AFF",
	},
	messageBubbleOther: {
		backgroundColor: "#E8E8E8",
	},
	senderName: {
		fontSize: 12,
		fontWeight: "600",
		color: "#666",
		marginBottom: 2,
	},
	messageContent: {
		fontSize: 16,
		color: "#000",
		lineHeight: 20,
	},
	messageContentMine: {
		color: "#fff",
	},
	fileAttachment: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		padding: 8,
		borderRadius: 8,
		backgroundColor: "rgba(0, 0, 0, 0.05)",
	},
	fileAttachmentMine: {
		backgroundColor: "rgba(255, 255, 255, 0.2)",
	},
	fileName: {
		flex: 1,
		fontSize: 14,
		color: "#000",
	},
	fileNameMine: {
		color: "#fff",
	},
	relatedAppointment: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginTop: 4,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: "rgba(0, 0, 0, 0.1)",
	},
	relatedAppointmentMine: {
		borderTopColor: "rgba(255, 255, 255, 0.3)",
	},
	relatedAppointmentText: {
		fontSize: 12,
		color: "#007AFF",
		fontWeight: "500",
	},
	relatedAppointmentTextMine: {
		color: "#fff",
	},
	timestampRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		marginTop: 4,
		paddingHorizontal: 4,
	},
	timestamp: {
		fontSize: 11,
		color: "#999",
	},
	statusIndicator: {
		marginLeft: 4,
	},
	errorText: {
		fontSize: 12,
		fontWeight: "bold",
		color: "#ff3b30",
	},
	messageBubbleError: {
		borderWidth: 1,
		borderColor: "#ff3b30",
		opacity: 0.7,
	},
});
