import { QueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "./api";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			// Retry failed requests (except 4xx errors)
			retry: (failureCount, error) => {
				// Don't retry on 4xx errors (client errors)
				if (error && typeof error === "object" && "status" in error) {
					const status = (error as { status?: number }).status;
					if (status && status >= 400 && status < 500) {
						return false;
					}
				}
				// Retry up to 3 times for other errors
				return failureCount < 3;
			},
			// How long until data is considered stale (5 minutes)
			staleTime: 1000 * 60 * 5,
			// How long to keep unused data in cache (10 minutes)
			gcTime: 1000 * 60 * 10,
			// Refetch on window focus in development, but not in production
			refetchOnWindowFocus: __DEV__,
			// Refetch on reconnect
			refetchOnReconnect: true,
			// Refetch on mount if data is stale
			refetchOnMount: true,
		},
		mutations: {
			// Retry mutations once on failure
			retry: 1,
			// Log errors from mutations
			onError: (error) => {
				const message = getErrorMessage(error);
				console.error("Mutation error:", message);
			},
		},
	},
});
