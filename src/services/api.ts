import axios, { type AxiosError, type AxiosInstance } from "axios";
import { Platform } from "react-native";

import { authClient } from "@/services/auth/better-auth";

interface ApiError {
	response?: {
		data?:
			| {
					message?: string;
					error?: string;
			  }
			| string;
	};
	message?: string;
}

// Helper function to extract meaningful error messages from API responses
export const getErrorMessage = (error: unknown): string => {
	const err = error as ApiError;
	if (
		err?.response?.data &&
		typeof err.response.data === "object" &&
		err.response.data.message
	) {
		return err.response.data.message;
	}
	if (
		err?.response?.data &&
		typeof err.response.data === "object" &&
		err.response.data.error
	) {
		return err.response.data.error;
	}
	if (err?.response?.data && typeof err.response.data === "string") {
		return err.response.data;
	}
	if (err?.message) {
		return err.message;
	}
	return "An unexpected error occurred";
};

type SignOut = () => void;

type APIInstanceProps = AxiosInstance & {
	registerInterceptTokenManager: (signOut: SignOut) => () => void;
	setAuthToken: (token: string | null) => void;
};

interface FailedRequestQueueProps {
	onSuccess: (token: string) => void;
	onFailure: (error: AxiosError) => void;
}

const api = axios.create({
	baseURL:
		Platform.OS === "android"
			? process.env.EXPO_PUBLIC_ANDROID_API_URL
			: process.env.EXPO_PUBLIC_BASE_URL,
}) as APIInstanceProps;

// Store token in memory to avoid calling getSession on every request
let authToken: string | null = null;
let isRefreshing = false;
let failedRequestQueue: FailedRequestQueueProps[] = [];

interface Error {
	message: string;
}

/**
 * Sets the authentication token in memory
 * This should be called by the AuthContext after login/session initialization
 */
api.setAuthToken = (token: string | null) => {
	authToken = token;

	if (token) {
		api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	} else {
		delete api.defaults.headers.common["Authorization"];
	}
};

// Request interceptor to add token from memory
api.interceptors.request.use(
	async (config) => {
		// Use token from memory instead of calling getSession
		if (authToken) {
			config.headers.Authorization = `Bearer ${authToken}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

api.registerInterceptTokenManager = (signOut) => {
	const interceptTokenManager = api.interceptors.response.use(
		(response) => {
			return response;
		},
		async (requestError: AxiosError<Error>) => {
			// Handle 401 errors (token expired or invalid)
			if (requestError.response?.status === 401) {
				console.log("🔄 Token expired, attempting refresh...");

				// If we're already refreshing, queue this request
				if (isRefreshing) {
					return new Promise((resolve, reject) => {
						failedRequestQueue.push({
							onSuccess: (token: string) => {
								if (requestError.config) {
									requestError.config.headers.Authorization = `Bearer ${token}`;
									resolve(api(requestError.config));
								}
							},
							onFailure: (error: AxiosError) => {
								reject(error);
							},
						});
					});
				}

				isRefreshing = true;

				try {
					// Try to get a fresh session (Better Auth handles refresh internally)
					const session = await authClient.getSession();

					if (session.data?.session?.token) {
						const newToken = session.data.session.token;

						// Update token in memory
						api.setAuthToken(newToken);

						// Process queued requests with new token
						failedRequestQueue.forEach((request) => {
							request.onSuccess(newToken);
						});
						failedRequestQueue = [];

						// Retry original request with new token
						if (requestError.config) {
							requestError.config.headers.Authorization = `Bearer ${newToken}`;
							return api(requestError.config);
						}
					} else {
						// No valid session, sign out
						console.log("❌ No valid session after refresh, signing out");
						signOut();

						failedRequestQueue.forEach((request) => {
							request.onFailure(requestError);
						});
						failedRequestQueue = [];
					}
				} catch (error) {
					console.error("❌ Token refresh failed:", error);

					// Clear failed requests queue
					failedRequestQueue.forEach((request) => {
						request.onFailure(requestError);
					});
					failedRequestQueue = [];

					// Sign out user
					signOut();
				} finally {
					isRefreshing = false;
				}
			}

			// Create a more informative error object with backend details
			if (requestError.response?.data) {
				const enhancedError = Object.assign(
					new Error(
						requestError.response.data?.message ||
							`Request failed with status ${requestError.response.status}: ${requestError.response.statusText}`,
					),
					{
						response: requestError.response,
						status: requestError.response.status,
						data: requestError.response.data,
						originalError: requestError,
					},
				);

				return Promise.reject(enhancedError);
			}

			return Promise.reject(requestError);
		},
	);

	return () => {
		api.interceptors.response.eject(interceptTokenManager);
	};
};

export { api };
