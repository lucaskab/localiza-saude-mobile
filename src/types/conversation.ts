export type MessageSenderType = "CUSTOMER" | "HEALTHCARE_PROVIDER";
export type MessageType = "TEXT" | "FILE";
export type MessageStatus = "pending" | "sent" | "error";

export interface User {
	id: string;
	name: string;
	firstName: string | null;
	lastName: string | null;
	image: string | null;
}

export interface Customer {
	id: string;
	user: User;
}

export interface HealthcareProvider {
	id: string;
	user: User;
}

export interface RelatedAppointment {
	id: string;
	scheduledAt: string;
	status: string;
}

export interface Message {
	id: string;
	conversationId: string;
	senderId: string;
	senderType: MessageSenderType;
	messageType: MessageType;
	content: string | null;
	fileUrl: string | null;
	fileName: string | null;
	fileSize: number | null;
	fileMimeType: string | null;
	relatedAppointmentId: string | null;
	createdAt: string;
	updatedAt: string;
	sender: User;
	relatedAppointment: RelatedAppointment | null;
	// Optimistic UI fields
	status?: MessageStatus;
	isOptimistic?: boolean;
	tempId?: string;
}

export interface LastMessage {
	id: string;
	messageType: MessageType;
	content: string | null;
	fileUrl: string | null;
	fileName: string | null;
	createdAt: string;
}

export interface Conversation {
	id: string;
	customerId: string;
	healthcareProviderId: string;
	lastMessageAt: string | null;
	createdAt: string;
	updatedAt: string;
	customer: Customer;
	healthcareProvider: HealthcareProvider;
	lastMessage: LastMessage | null;
}

// API Response types
export interface GetConversationsResponse {
	conversations: Conversation[];
	total: number;
	limit: number;
	offset: number;
}

export interface GetConversationMessagesResponse {
	messages: Message[];
	conversation: Conversation;
	total: number;
	limit: number;
	offset: number;
}

export interface SendTextMessageData {
	conversationId?: string;
	recipientId: string;
	content: string;
	relatedAppointmentId?: string;
}

export interface SendTextMessageResponse {
	message: Message;
	conversation: Conversation;
}

export interface SendFileMessageData {
	conversationId?: string;
	recipientId: string;
	file: {
		uri: string;
		name: string;
		type: string;
	};
	relatedAppointmentId?: string;
}

export interface SendFileMessageResponse {
	message: Message;
	conversation: Conversation;
}

export interface GetOrCreateConversationData {
	participantId: string;
}

export interface GetOrCreateConversationResponse {
	conversation: Conversation;
}

export interface DeleteMessageResponse {
	message: string;
}
