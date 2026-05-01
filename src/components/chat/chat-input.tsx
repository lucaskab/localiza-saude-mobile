import { Paperclip, Send } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { useUnistyles } from "react-native-unistyles";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
	messageText: string;
	onMessageTextChange: (text: string) => void;
	onSendMessage: () => void;
	onAttachPress: () => void;
	disabled?: boolean;
}

export function ChatInput({
	messageText,
	onMessageTextChange,
	onSendMessage,
	onAttachPress,
	disabled = false,
}: ChatInputProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();

	return (
		<View style={styles.inputContainer}>
			<Pressable onPress={onAttachPress} style={styles.attachButton}>
				<Paperclip size={20} color={theme.colors.foreground} strokeWidth={2} />
			</Pressable>

			<Input
				value={messageText}
				onChangeText={onMessageTextChange}
				placeholder={t("common.typeAMessage")}
				containerStyle={styles.messageInput}
				multiline
				onSubmitEditing={onSendMessage}
				returnKeyType="send"
				editable={!disabled}
			/>

			<Pressable
				onPress={onSendMessage}
				disabled={!messageText.trim() || disabled}
				style={[
					styles.sendButton,
					(!messageText.trim() || disabled) && styles.sendButtonDisabled,
				]}
			>
				<Send
					size={20}
					color={theme.colors.primaryForeground}
					strokeWidth={2}
				/>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: "rgba(0, 0, 0, 0.1)",
		backgroundColor: "#fff",
	},
	attachButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "rgba(0, 0, 0, 0.1)",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	messageInput: {
		flex: 1,
		maxHeight: 100,
	},
	sendButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#007AFF",
		justifyContent: "center",
		alignItems: "center",
	},
	sendButtonDisabled: {
		opacity: 0.5,
	},
});
