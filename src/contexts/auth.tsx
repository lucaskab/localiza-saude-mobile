import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { getCustomerByUserId } from "@/hooks/use-customer";
import { getHealthcareProviderByUserId } from "@/hooks/use-healthcare-providers";
import { api } from "@/services/api";
import { authClient } from "@/services/auth/better-auth";
import type { Customer } from "@/types/customer";
import type { HealthcareProvider } from "@/types/healthcare-provider";

WebBrowser.maybeCompleteAuthSession();

interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	role?: "HEALTHCARE_PROVIDER" | "CUSTOMER";
}

interface AuthState {
	sessionToken: string;
	user: User;
	customer: Customer | null;
	healthcareProvider: HealthcareProvider | null;
}

interface AuthContextData {
	signInWithGoogle: () => Promise<void>;
	signOut: () => void;
	user: User | null;
	customer: Customer | null;
	healthcareProvider: HealthcareProvider | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isCustomer: boolean;
	isHealthcareProvider: boolean;
}

interface AuthProviderProps {
	children: ReactNode;
}

const AuthContext = createContext({} as AuthContextData);

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [authState, setAuthState] = useState<AuthState | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const isAuthenticated = !!authState?.sessionToken && !!authState?.user;
	const isCustomer = authState?.user?.role === "CUSTOMER";
	const isHealthcareProvider = authState?.user?.role === "HEALTHCARE_PROVIDER";

	/**
	 * Fetches customer data for users with CUSTOMER role
	 */
	const fetchCustomerData = useCallback(
		async (userId: string): Promise<Customer | null> => {
			try {
				const response = await getCustomerByUserId(userId);
				return response.customer;
			} catch (error) {
				console.error("Failed to fetch customer data:", error);
				return null;
			}
		},
		[],
	);

	/**
	 * Fetches healthcare provider data for users with HEALTHCARE_PROVIDER role
	 */
	const fetchHealthcareProviderData = useCallback(
		async (userId: string): Promise<HealthcareProvider | null> => {
			try {
				const response = await getHealthcareProviderByUserId(userId);
				return response.healthcareProvider;
			} catch (error) {
				console.error("Failed to fetch healthcare provider data:", error);
				return null;
			}
		},
		[],
	);

	// Initialize auth state from Better Auth session on mount
	useEffect(() => {
		const initializeAuth = async () => {
			try {
				const session = await authClient.getSession();

				if (session.data?.session.token && session.data?.user) {
					const user = session.data.user as User;

					// Set token in memory for API requests
					api.setAuthToken(session.data.session.token);

					// Fetch customer data if user is a customer
					let customer: Customer | null = null;
					if (user.role === "CUSTOMER") {
						customer = await fetchCustomerData(user.id);
					}

					// Fetch healthcare provider data if user is a provider
					let healthcareProvider: HealthcareProvider | null = null;
					if (user.role === "HEALTHCARE_PROVIDER") {
						healthcareProvider = await fetchHealthcareProviderData(user.id);
					}

					setAuthState({
						sessionToken: session.data.session.token,
						user,
						customer,
						healthcareProvider,
					});
				} else {
					setAuthState(null);
				}
			} catch (error) {
				console.error("Failed to initialize auth:", error);
				setAuthState(null);
			} finally {
				setIsLoading(false);
			}
		};

		initializeAuth();
	}, [fetchCustomerData, fetchHealthcareProviderData]);

	const signOut = useCallback(async () => {
		try {
			// Sign out from Better Auth (clears SecureStore automatically)
			await authClient.signOut();
		} catch (error) {
			console.error("Sign out error:", error);
		}

		// Clear local state
		setAuthState(null);

		// Clear token from memory
		api.setAuthToken(null);

		// Navigate to login
		router.replace("/login");
	}, []);

	// Register token refresh interceptor
	useEffect(() => {
		const unsubscribe = api.registerInterceptTokenManager(signOut);
		return () => {
			unsubscribe();
		};
	}, [signOut]);

	const signInWithGoogle = useCallback(async () => {
		try {
			console.log("🔐 Starting Google sign-in...");
			console.log("📱 Base URL:", process.env.EXPO_PUBLIC_BASE_URL);
			console.log("🔗 Scheme:", process.env.EXPO_PUBLIC_SCHEME);
			setIsLoading(true);

			// Initiate Google OAuth with Better Auth
			console.log("🚀 Initiating OAuth flow...");
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "localizasaude://(bottom-tabs)/home",
			});
			console.log("✅ OAuth flow completed");

			// Get the session after OAuth completes
			const session = await authClient.getSession();

			if (session.data?.session.token && session.data?.user) {
				const user = session.data.user as User;

				// Set token in memory for API requests
				api.setAuthToken(session.data.session.token);

				// Fetch customer data if user is a customer
				let customer: Customer | null = null;
				if (user.role === "CUSTOMER") {
					customer = await fetchCustomerData(user.id);
				}

				// Fetch healthcare provider data if user is a provider
				let healthcareProvider: HealthcareProvider | null = null;
				if (user.role === "HEALTHCARE_PROVIDER") {
					healthcareProvider = await fetchHealthcareProviderData(user.id);
				}

				setAuthState({
					sessionToken: session.data.session.token,
					user,
					customer,
					healthcareProvider,
				});

				// Redirect based on user role
				if (user.role === "HEALTHCARE_PROVIDER") {
					router.replace("/(provider-tabs)/dashboard");
				} else if (user.role === "CUSTOMER") {
					router.replace("/(bottom-tabs)/home");
				} else {
					// Fallback to customer home if role is not set
					router.replace("/(bottom-tabs)/home");
				}
			} else {
				throw new Error("Failed to get session after sign-in");
			}
		} catch (error) {
			console.error("Sign in error:", error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	}, [fetchCustomerData, fetchHealthcareProviderData]);

	const value = useMemo(
		() => ({
			signInWithGoogle,
			signOut,
			isAuthenticated,
			user: authState?.user || null,
			customer: authState?.customer || null,
			healthcareProvider: authState?.healthcareProvider || null,
			isLoading,
			isCustomer,
			isHealthcareProvider,
		}),
		[
			isAuthenticated,
			authState?.user,
			authState?.customer,
			authState?.healthcareProvider,
			isLoading,
			isCustomer,
			isHealthcareProvider,
			signInWithGoogle,
			signOut,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextData {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
