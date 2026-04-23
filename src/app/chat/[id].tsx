import { LegendList, type LegendListRef } from "@legendapp/list";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Linking,
	Platform,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
	AppointmentPreview,
	ChatHeader,
	ChatInput,
	ChatMessage,
	EmptyState,
	FilePreview,
	isImage,
	isPdf,
} from "@/components/chat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import {
	useConversationMessages,
	useSendFileMessage,
	useSendTextMessage,
} from "@/hooks/use-conversations";
import { type FileUploadResult, useFileUpload } from "@/hooks/use-file-upload";
import type { Message } from "@/types/conversation";

export default function ChatScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { theme } = useUnistyles();
	const { user, isCustomer } = useAuth();
	const flashListRef = useRef<LegendListRef>(null);

	const [messageText, setMessageText] = useState("");
	const [selectedAppointmentId, setSelectedAppointmentId] = useState<
		string | null
	>(null);
	const [selectedFile, setSelectedFile] = useState<FileUploadResult | null>(
		null,
	);
	const hasScrolledToBottom = useRef(false);
	const previousConversationId = useRef<string | null>(null);

	const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useConversationMessages(id || "", undefined, !!id);

	const sendTextMutation = useSendTextMessage({
		currentUserId: user?.id,
		currentUserName: user?.name,
		currentUserImage: user?.image,
		isCustomer: isCustomer,
	});

	const sendFileMutation = useSendFileMessage();

	const { showFilePickerOptions } = useFileUpload({
		maxSizeInMB: 10,
		allowedTypes: [
			"image/*",
			"application/pdf",
			"application/msword",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		],
	});

	const messages = data?.pages.flatMap((page) => page.messages) || [];

	// Get conversation from API response (returned with messages)
	const conversation = data?.pages[0]?.conversation;

	// Scroll to bottom on initial load
	useEffect(() => {
		if (previousConversationId.current !== id) {
			hasScrolledToBottom.current = false;
			previousConversationId.current = id;
		}

		if (messages.length > 0 && !isLoading && !hasScrolledToBottom.current) {
			setTimeout(() => {
				flashListRef.current?.scrollToEnd?.({ animated: false });
				hasScrolledToBottom.current = true;
			}, 150);
		}
	}, [id, messages.length, isLoading]);

	// Determine recipientId from conversation data
	const recipientId = conversation
		? isCustomer
			? conversation.healthcareProviderId
			: conversation.customerId
		: undefined;

	// Get otherParticipant info from conversation
	const otherParticipant = conversation
		? isCustomer
			? conversation.healthcareProvider.user
			: conversation.customer.user
		: null;

	const otherParticipantName = otherParticipant?.name || null;
	const otherParticipantImage = otherParticipant?.image || null;

	const handleSendMessage = async () => {
		if (!messageText.trim() || !id) {
			Alert.alert("Error", "Please enter a message");
			return;
		}

		if (!recipientId) {
			Alert.alert(
				"Error",
				"Recipient not found. Please try reloading this chat.",
			);
			console.error("❌ recipientId not found!");
			return;
		}

		try {
			await sendTextMutation.mutateAsync({
				conversationId: id,
				recipientId: recipientId,
				content: messageText.trim(),
				relatedAppointmentId: selectedAppointmentId || undefined,
			});

			// Clear input only after successful send
			setMessageText("");
			setSelectedAppointmentId(null);

			// Scroll to bottom after sending
			setTimeout(() => {
				flashListRef.current?.scrollToEnd?.({ animated: true });
			}, 100);
		} catch (error) {
			console.error("Failed to send message:", error);
			Alert.alert("Error", "Failed to send message. Please try again.");
		}
	};

	const handleFileSelect = async () => {
		const file = await showFilePickerOptions();
		if (file) {
			setSelectedFile(file);
		}
	};

	const handleSendFile = async () => {
		if (!selectedFile || !id) {
			Alert.alert("Error", "Please select a file");
			return;
		}

		if (!recipientId) {
			Alert.alert(
				"Error",
				"Recipient not found. Please try reloading this chat.",
			);
			return;
		}

		try {
			await sendFileMutation.mutateAsync({
				conversationId: id,
				recipientId: recipientId,
				file: selectedFile,
				relatedAppointmentId: selectedAppointmentId || undefined,
			});

			// Clear selected file and appointment after successful send
			setSelectedFile(null);
			setSelectedAppointmentId(null);

			// Scroll to bottom after sending
			setTimeout(() => {
				flashListRef.current?.scrollToEnd?.({ animated: true });
			}, 100);
		} catch (error) {
			console.error("Failed to send file:", error);
			Alert.alert("Error", "Failed to send file. Please try again.");
		}
	};

	const handleClearFile = () => {
		setSelectedFile(null);
	};

	const handleFilePress = async (
		fileUrl: string | null,
		_fileName: string | null,
		mimeType: string | null,
	) => {
		if (!fileUrl) {
			Alert.alert("Error", "File URL not available");
			return;
		}

		try {
			if (mimeType && isImage(mimeType)) {
				await WebBrowser.openBrowserAsync(fileUrl);
			} else if (mimeType && isPdf(mimeType)) {
				const pdfName = encodeURIComponent(_fileName || "PDF document");
				const pdfUrl = encodeURIComponent(fileUrl);
				router.push(`/pdf-viewer?uri=${pdfUrl}&name=${pdfName}` as never);
			} else {
				const supported = await Linking.canOpenURL(fileUrl);
				if (supported) {
					await Linking.openURL(fileUrl);
				} else {
					await WebBrowser.openBrowserAsync(fileUrl);
				}
			}
		} catch (error) {
			console.error("Error opening file:", error);
			Alert.alert(
				"Error",
				"Could not open file. Try downloading it from your browser.",
			);
		}
	};

	const handleLoadMore = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	const renderMessage = ({ item }: { item: Message }) => {
		return (
			<ChatMessage
				message={item}
				currentUserId={user?.id}
				onFilePress={handleFilePress}
			/>
		);
	};

	const renderHeader = () => {
		if (!isFetchingNextPage) return null;

		return (
			<View style={styles.headerLoader}>
				<ActivityIndicator size="small" color={theme.colors.primary} />
			</View>
		);
	};

	const renderEmpty = () => {
		if (isLoading) return null;
		return <EmptyState />;
	};

	if (isLoading) {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.loadingText}>Loading conversation...</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!id) {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.errorContainer}>
					<Text style={styles.errorTitle}>Conversation not found</Text>
					<Button onPress={() => router.back()}>Back to Chats</Button>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.container}>
			<KeyboardAvoidingView
				style={styles.keyboardView}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
			>
				{/* Header */}
				<ChatHeader
					participantName={otherParticipantName}
					participantImage={otherParticipantImage}
					onBackPress={() => router.back()}
				/>

				{/* Messages List */}
				<LegendList
					ref={flashListRef}
					data={messages}
					renderItem={renderMessage}
					keyExtractor={(item: Message) => item.id}
					estimatedItemSize={100}
					onEndReached={handleLoadMore}
					onEndReachedThreshold={0.5}
					ListHeaderComponent={renderHeader}
					ListEmptyComponent={renderEmpty}
					contentContainerStyle={styles.messagesList}
				/>

				{/* File Preview */}
				{selectedFile && (
					<FilePreview
						file={selectedFile}
						onClearFile={handleClearFile}
						onSendFile={handleSendFile}
						isSending={sendFileMutation.isPending}
					/>
				)}

				{/* Selected Appointment Preview */}
				{selectedAppointmentId && !selectedFile && (
					<AppointmentPreview onClear={() => setSelectedAppointmentId(null)} />
				)}

				{/* Input Area */}
				{!selectedFile && (
					<ChatInput
						messageText={messageText}
						onMessageTextChange={setMessageText}
						onSendMessage={handleSendMessage}
						onAttachPress={handleFileSelect}
						disabled={sendTextMutation.isPending}
					/>
				)}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
	},
	keyboardView: {
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: 12,
	},
	loadingText: {
		fontSize: 16,
		color: "#666",
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		gap: 16,
	},
	errorTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#666",
	},
	messagesList: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	headerLoader: {
		paddingVertical: 12,
		alignItems: "center",
	},
});
