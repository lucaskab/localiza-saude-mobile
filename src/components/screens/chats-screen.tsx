import { LegendList } from "@legendapp/list";
import { useRouter } from "expo-router";
import { MessageCircle, Plus, Search } from "lucide-react-native";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	RefreshControl,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import { useConversations } from "@/hooks/use-conversations";
import type { Conversation } from "@/types/conversation";

export default function ChatsScreen() {
	const router = useRouter();
	const { theme } = useUnistyles();
	const { user, isCustomer } = useAuth();
	const [searchQuery, setSearchQuery] = useState("");

	const {
		data,
		isLoading,
		error,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isRefetching,
	} = useConversations(20);

	const conversations = data?.pages.flatMap((page) => page.conversations) || [];

	// Filter conversations based on search
	const filteredConversations = conversations.filter((conversation) => {
		if (!searchQuery.trim()) return true;

		const otherParticipant = isCustomer
			? conversation.healthcareProvider.user
			: conversation.customer.user;

		return otherParticipant.name
			.toLowerCase()
			.includes(searchQuery.toLowerCase());
	});

	const formatMessagePreview = (conversation: Conversation) => {
		if (!conversation.lastMessage) return "No messages yet";

		if (conversation.lastMessage.messageType === "FILE") {
			return `📎 ${conversation.lastMessage.fileName || "File"}`;
		}

		return conversation.lastMessage.content || "";
	};

	const formatTimestamp = (timestamp: string | null) => {
		if (!timestamp) return "";

		const date = new Date(timestamp);
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInMinutes = Math.floor(diffInMs / 60000);
		const diffInHours = Math.floor(diffInMs / 3600000);
		const diffInDays = Math.floor(diffInMs / 86400000);

		if (diffInMinutes < 1) return "Just now";
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
		if (diffInHours < 24) return `${diffInHours}h ago`;
		if (diffInDays === 1) return "Yesterday";
		if (diffInDays < 7) return `${diffInDays}d ago`;

		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});
	};

	const handleLoadMore = () => {
		if (hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	};

	const renderConversation = ({ item }: { item: Conversation }) => {
		const otherParticipant = isCustomer
			? item.healthcareProvider.user
			: item.customer.user;

		return (
			<Pressable
				style={({ pressed }) => [
					styles.conversationCard,
					pressed && styles.conversationCardPressed,
				]}
				onPress={() => router.push(`/chat/${item.id}`)}
			>
				{otherParticipant.image ? (
					<Image
						source={{ uri: otherParticipant.image }}
						style={styles.avatar}
					/>
				) : (
					<View style={styles.avatarPlaceholder}>
						<Text style={styles.avatarText}>
							{otherParticipant.name.charAt(0).toUpperCase()}
						</Text>
					</View>
				)}

				<View style={styles.conversationContent}>
					<View style={styles.conversationHeader}>
						<Text style={styles.participantName} numberOfLines={1}>
							{otherParticipant.name}
						</Text>
						<Text style={styles.timestamp}>
							{formatTimestamp(item.lastMessageAt)}
						</Text>
					</View>

					<Text style={styles.messagePreview} numberOfLines={2}>
						{formatMessagePreview(item)}
					</Text>
				</View>
			</Pressable>
		);
	};

	const renderFooter = () => {
		if (!isFetchingNextPage) return null;

		return (
			<View style={styles.footerLoader}>
				<ActivityIndicator size="small" color={theme.colors.primary} />
			</View>
		);
	};

	const renderEmpty = () => {
		if (isLoading) return null;

		return (
			<View style={styles.emptyContainer}>
				<MessageCircle
					size={64}
					color={theme.colors.mutedForeground}
					strokeWidth={1.5}
				/>
				<Text style={styles.emptyTitle}>No Conversations</Text>
				<Text style={styles.emptyText}>
					{searchQuery
						? "No conversations match your search"
						: "Start a conversation with a healthcare provider"}
				</Text>
			</View>
		);
	};

	if (!isCustomer && user?.role !== "HEALTHCARE_PROVIDER") {
		return (
			<SafeAreaView edges={["top"]} style={styles.container}>
				<View style={styles.errorContainer}>
					<MessageCircle
						size={64}
						color={theme.colors.mutedForeground}
						strokeWidth={1.5}
					/>
					<Text style={styles.errorTitle}>Chats Unavailable</Text>
					<Text style={styles.errorText}>
						Chats are only available for customers and healthcare providers
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Chats</Text>

				{/* Search */}
				<Input
					leftIcon={Search}
					placeholder="Search conversations..."
					value={searchQuery}
					onChangeText={setSearchQuery}
				/>
			</View>

			{/* Conversations List */}
			{isLoading && !isRefetching ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={styles.loadingText}>Loading conversations...</Text>
				</View>
			) : error ? (
				<View style={styles.errorContainer}>
					<MessageCircle
						size={64}
						color={theme.colors.destructive}
						strokeWidth={1.5}
					/>
					<Text style={styles.errorTitle}>Failed to load conversations</Text>
					<Text style={styles.errorText}>
						Please try again or pull to refresh
					</Text>
				</View>
			) : (
				<LegendList
					data={filteredConversations}
					renderItem={renderConversation}
					keyExtractor={(item: Conversation) => item.id}
					estimatedItemSize={80}
					onEndReached={handleLoadMore}
					onEndReachedThreshold={0.5}
					ListFooterComponent={renderFooter}
					ListEmptyComponent={renderEmpty}
					refreshControl={
						<RefreshControl
							refreshing={isRefetching}
							onRefresh={refetch}
							tintColor={theme.colors.primary}
							colors={[theme.colors.primary]}
						/>
					}
					contentContainerStyle={
						filteredConversations.length === 0
							? styles.emptyListContent
							: styles.listContent
					}
				/>
			)}

			{/* Floating Action Button - Create New Chat */}
			<Pressable
				style={styles.fab}
				onPress={() => {
					Alert.alert(
						"Start Conversation",
						isCustomer
							? "Search for a healthcare provider to start a conversation"
							: "Search for a customer to start a conversation",
						[
							{
								text: "Cancel",
								style: "cancel",
							},
							{
								text: "Go to Search",
								onPress: () =>
									router.push(
										isCustomer
											? "/(bottom-tabs)/search"
											: "/(provider-tabs)/dashboard",
									),
							},
						],
					);
				}}
			>
				<Plus
					size={24}
					color={theme.colors.primaryForeground}
					strokeWidth={2}
				/>
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flex: 1,
		backgroundColor: theme.colors.background,
	},
	header: {
		paddingHorizontal: theme.gap(3),
		paddingTop: theme.gap(2),
		paddingBottom: theme.gap(2),
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
		backgroundColor: theme.colors.surfacePrimary,
		gap: theme.gap(2),
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		gap: theme.gap(2),
	},
	loadingText: {
		fontSize: 16,
		color: theme.colors.mutedForeground,
	},
	errorContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: theme.gap(4),
		gap: theme.gap(2),
	},
	errorTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	errorText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
	listContent: {
		paddingHorizontal: theme.gap(3),
		paddingTop: theme.gap(2),
		paddingBottom: theme.gap(2),
	},
	emptyListContent: {
		flexGrow: 1,
	},
	conversationCard: {
		flexDirection: "row",
		padding: theme.gap(2),
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		marginBottom: theme.gap(2),
		borderWidth: 1,
		borderColor: theme.colors.border,
		gap: theme.gap(2),
	},
	conversationCardPressed: {
		opacity: 0.7,
		backgroundColor: theme.colors.surfaceSecondary,
	},
	avatar: {
		width: 56,
		height: 56,
		borderRadius: 28,
	},
	avatarPlaceholder: {
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: theme.colors.primary,
		justifyContent: "center",
		alignItems: "center",
	},
	avatarText: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.primaryForeground,
	},
	conversationContent: {
		flex: 1,
		justifyContent: "center",
		gap: theme.gap(1),
	},
	conversationHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		gap: theme.gap(2),
	},
	participantName: {
		flex: 1,
		fontSize: 16,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	timestamp: {
		fontSize: 12,
		color: theme.colors.mutedForeground,
	},
	messagePreview: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		lineHeight: 20,
	},
	footerLoader: {
		paddingVertical: theme.gap(3),
		alignItems: "center",
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: theme.gap(4),
		gap: theme.gap(2),
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: "600",
		color: theme.colors.foreground,
		marginTop: theme.gap(2),
	},
	emptyText: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		textAlign: "center",
	},
	fab: {
		position: "absolute",
		bottom: theme.gap(3),
		right: theme.gap(3),
		width: 56,
		height: 56,
		borderRadius: 28,
		backgroundColor: theme.colors.primary,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 4,
		elevation: 8,
	},
}));
