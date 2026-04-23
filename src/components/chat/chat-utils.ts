/**
 * Chat utility functions
 */

/**
 * Check if a MIME type represents an image
 */
export const isImage = (mimeType: string): boolean => {
	return mimeType.startsWith("image/");
};

/**
 * Check if a MIME type represents a PDF document
 */
export const isPdf = (mimeType: string): boolean => {
	return mimeType === "application/pdf";
};

/**
 * Format file size in bytes to human-readable format
 */
export const formatFileSize = (bytes?: number): string => {
	if (!bytes) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Format timestamp to relative time (e.g., "5m ago", "2h ago")
 */
export const formatTimestamp = (timestamp: string): string => {
	const date = new Date(timestamp);
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInMinutes = Math.floor(diffInMs / 60000);
	const diffInHours = Math.floor(diffInMs / 3600000);

	if (diffInMinutes < 1) return "Just now";
	if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
	if (diffInHours < 24) return `${diffInHours}h ago`;

	return date.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
	});
};
