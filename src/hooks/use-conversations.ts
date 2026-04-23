import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/services/api";
import type {
	Conversation,
	DeleteMessageResponse,
	GetConversationMessagesResponse,
	GetConversationsResponse,
	GetOrCreateConversationData,
	GetOrCreateConversationResponse,
	Message,
	MessageStatus,
	SendFileMessageData,
	SendFileMessageResponse,
	SendTextMessageData,
	SendTextMessageResponse,
} from "@/types/conversation";

// Get all conversations with pagination
interface GetConversationsParams {
	limit?: number;
	offset?: number;
}

export const getConversations = async ({
	limit = 20,
	offset = 0,
}: GetConversationsParams = {}): Promise<GetConversationsResponse> => {
	const { data } = await api.get<GetConversationsResponse>(
		`/conversations?limit=${limit}&offset=${offset}`,
	);
	return data;
};

export const useConversations = (limit: number = 20) => {
	return useInfiniteQuery({
		queryKey: ["conversations", limit],
		queryFn: ({ pageParam = 0 }) =>
			getConversations({ limit, offset: pageParam }),
		getNextPageParam: (lastPage, allPages) => {
			const totalLoaded = allPages.reduce(
				(acc, page) => acc + page.conversations.length,
				0,
			);
			if (totalLoaded < lastPage.total) {
				return totalLoaded;
			}
			return undefined;
		},
		initialPageParam: 0,
	});
};

// Get conversation messages with pagination
interface GetConversationMessagesParams {
	conversationId: string;
	limit?: number;
	offset?: number;
	relatedAppointmentId?: string;
}

export const getConversationMessages = async ({
	conversationId,
	limit = 50,
	offset = 0,
	relatedAppointmentId,
}: GetConversationMessagesParams): Promise<GetConversationMessagesResponse> => {
	const params = new URLSearchParams();
	params.append("limit", limit.toString());
	params.append("offset", offset.toString());
	if (relatedAppointmentId) {
		params.append("relatedAppointmentId", relatedAppointmentId);
	}

	const { data } = await api.get<GetConversationMessagesResponse>(
		`/conversations/${conversationId}/messages?${params.toString()}`,
	);
	return data;
};

export const useConversationMessages = (
	conversationId: string,
	relatedAppointmentId?: string,
	enabled: boolean = true,
) => {
	return useInfiniteQuery({
		queryKey: ["messages", conversationId, relatedAppointmentId],
		queryFn: ({ pageParam = 0 }) =>
			getConversationMessages({
				conversationId,
				offset: pageParam,
				limit: 50,
				relatedAppointmentId,
			}),
		getNextPageParam: (lastPage, allPages) => {
			const totalLoaded = allPages.reduce(
				(acc, page) => acc + page.messages.length,
				0,
			);
			if (totalLoaded < lastPage.total) {
				return totalLoaded;
			}
			return undefined;
		},
		initialPageParam: 0,
		enabled: enabled && !!conversationId,
		// Messages should be in reverse order (newest first in API, but we want oldest first in chat)
		select: (data) => ({
			...data,
			pages: data.pages.map((page) => ({
				...page,
				messages: [...page.messages].reverse(),
			})),
		}),
	});
};

// Send text message
export const sendTextMessage = async (
	data: SendTextMessageData,
): Promise<SendTextMessageResponse> => {
	const { data: response } = await api.post<SendTextMessageResponse>(
		"/conversations/messages/text",
		data,
	);
	return response;
};

interface UseSendTextMessageOptions {
	currentUserId?: string;
	currentUserName?: string;
	currentUserImage?: string | null;
	isCustomer?: boolean;
}

interface MessagesQueryData {
	pages: Array<{
		messages: Message[];
		conversation: Conversation;
		total: number;
		limit: number;
		offset: number;
	}>;
	pageParams: number[];
}

interface OptimisticContext {
	previousMessages: MessagesQueryData | undefined;
	tempId: string;
}

export const useSendTextMessage = (options?: UseSendTextMessageOptions) => {
	const queryClient = useQueryClient();

	return useMutation<
		SendTextMessageResponse,
		Error,
		SendTextMessageData,
		OptimisticContext | undefined
	>({
		mutationFn: sendTextMessage,

		// Step 1: Before mutation runs
		onMutate: async (variables): Promise<OptimisticContext | undefined> => {
			const { conversationId, content, relatedAppointmentId } = variables;

			if (!conversationId) {
				return undefined;
			}

			// Cancel any outgoing refetches
			await queryClient.cancelQueries({
				queryKey: ["messages", conversationId],
			});

			// Snapshot the previous value
			const previousMessages = queryClient.getQueryData<MessagesQueryData>([
				"messages",
				conversationId,
			]);

			if (!previousMessages) {
				return undefined;
			}

			// Create optimistic message
			const tempId = `temp-${Date.now()}`;
			const optimisticMessage: Message = {
				id: tempId,
				conversationId,
				senderId: options?.currentUserId || "temp-sender",
				senderType: options?.isCustomer ? "CUSTOMER" : "HEALTHCARE_PROVIDER",
				messageType: "TEXT",
				content,
				fileUrl: null,
				fileName: null,
				fileSize: null,
				fileMimeType: null,
				relatedAppointmentId: relatedAppointmentId || null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				sender: {
					id: options?.currentUserId || "temp-sender",
					name: options?.currentUserName || "You",
					firstName: null,
					lastName: null,
					image: options?.currentUserImage || null,
				},
				relatedAppointment: null,
				status: "pending",
				isOptimistic: true,
				tempId,
			};

			// Optimistically update the cache
			queryClient.setQueryData<MessagesQueryData>(
				["messages", conversationId],
				(old) => {
					if (!old) return old;

					return {
						...old,
						pages: old.pages.map((page, index) => {
							// Add to the first page (reversed, so prepend)
							if (index === 0) {
								return {
									...page,
									messages: [optimisticMessage, ...page.messages],
								};
							}
							return page;
						}),
					};
				},
			);

			// Return context with snapshot
			return { previousMessages, tempId };
		},

		// Step 2: If mutation fails
		onError: (error, variables, context) => {
			// Rollback to the snapshot
			if (context?.previousMessages && variables.conversationId) {
				queryClient.setQueryData(
					["messages", variables.conversationId],
					context.previousMessages,
				);
			}
		},

		// Step 3: Always refetch after error or success
		onSettled: (data, error, variables) => {
			if (variables.conversationId) {
				queryClient.invalidateQueries({
					queryKey: ["messages", variables.conversationId],
				});
			}
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
		},
	});
};

// Send file message
export const sendFileMessage = async (
	data: SendFileMessageData,
): Promise<SendFileMessageResponse> => {
	const formData = new FormData();

	if (data.conversationId) {
		formData.append("conversationId", data.conversationId);
	}
	formData.append("recipientId", data.recipientId);

	if (data.relatedAppointmentId) {
		formData.append("relatedAppointmentId", data.relatedAppointmentId);
	}

	// Append file
	// @ts-expect-error - React Native FormData accepts file objects with uri, name, and type
	formData.append("file", {
		uri: data.file.uri,
		name: data.file.name,
		type: data.file.type,
	});

	const { data: response } = await api.post<SendFileMessageResponse>(
		"/conversations/messages/file",
		formData,
		{
			headers: {
				"Content-Type": "multipart/form-data",
			},
		},
	);
	return response;
};

export const useSendFileMessage = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: sendFileMessage,
		onSuccess: (data) => {
			// Invalidate conversations list to update last message
			queryClient.invalidateQueries({ queryKey: ["conversations"] });

			// Invalidate messages for this conversation
			queryClient.invalidateQueries({
				queryKey: ["messages", data.conversation.id],
			});
		},
	});
};

// Get or create conversation
export const getOrCreateConversation = async (
	data: GetOrCreateConversationData,
): Promise<GetOrCreateConversationResponse> => {
	const { data: response } = await api.post<GetOrCreateConversationResponse>(
		"/conversations",
		data,
	);
	return response;
};

export const useGetOrCreateConversation = () => {
	return useMutation({
		mutationFn: getOrCreateConversation,
	});
};

// Delete message
export const deleteMessage = async (
	messageId: string,
): Promise<DeleteMessageResponse> => {
	const { data } = await api.delete<DeleteMessageResponse>(
		`/conversations/messages/${messageId}`,
	);
	return data;
};

export const useDeleteMessage = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: deleteMessage,
		onSuccess: () => {
			// Invalidate conversations and messages
			queryClient.invalidateQueries({ queryKey: ["conversations"] });
			queryClient.invalidateQueries({ queryKey: ["messages"] });
		},
	});
};
