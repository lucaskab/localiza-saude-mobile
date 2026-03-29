import axios, { type AxiosError, type AxiosInstance } from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { LOCAL_STORAGE_KEY_PREFIX } from "@/constants/storage";

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
};

interface FailedRequestQueueProps {
	onSuccess: (token: string) => void;
	onFailure: (error: AxiosError) => void;
}

const api = axios.create({
	baseURL:
		Platform.OS === "android"
			? process.env.EXPO_PUBLIC_ANDROID_API_URL
			: process.env.EXPO_PUBLIC_API_URL,
}) as APIInstanceProps;

let isRefreshing = false;
let failedRequestQueue: FailedRequestQueueProps[] = [];

interface Error {
	message: string;
}

// Request interceptor to add token from SecureStore
api.interceptors.request.use(
	async (config) => {
		try {
			// Get session token from Better Auth's SecureStore
			const sessionToken = await SecureStore.getItemAsync(
				`${LOCAL_STORAGE_KEY_PREFIX}session.token`,
			);

			if (sessionToken) {
				config.headers.Authorization = `Bearer ${sessionToken}`;
			}
		} catch (error) {
			// Silently handle error
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
		async (error: AxiosError<Error>) => {
			// Create a more informative error object with backend details
			if (error.response?.data) {
				// Enhance the error with backend response data
				const enhancedError = Object.assign(
					new Error(
						error.response.data?.message ||
							`Request failed with status ${error.response.status}: ${error.response.statusText}`,
					),
					{
						response: error.response,
						status: error.response.status,
						data: error.response.data,
						originalError: error,
					},
				);

				// For non-auth errors, reject with enhanced error
				if (error.response?.status !== 401) {
					return Promise.reject(enhancedError);
				}
			}

			// Handle 401 Unauthorized errors
			if (error.response?.status === 401) {
				// Better Auth handles token refresh automatically
				// If we get a 401, the session is invalid, so sign out
				signOut();
				return Promise.reject(error);
			}

			return Promise.reject(error);
		},
	);

	return () => {
		api.interceptors.response.eject(interceptTokenManager);
	};
};

export { api };
