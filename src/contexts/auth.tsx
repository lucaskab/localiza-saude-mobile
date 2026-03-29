import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { api } from "@/services/api";
import { authClient } from "@/services/auth/better-auth";

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
}

interface AuthContextData {
	signInWithGoogle: () => Promise<void>;
	signOut: () => void;
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

interface AuthProviderProps {
	children: ReactNode;
}

const AuthContext = createContext({} as AuthContextData);

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [authState, setAuthState] = useState<AuthState | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const isAuthenticated = !!authState?.sessionToken && !!authState?.user;

	// Initialize auth state from Better Auth session on mount
	useEffect(() => {
		const initializeAuth = async () => {
			try {
				const session = await authClient.getSession();

				if (session.data?.session.token && session.data?.user) {
					setAuthState({
						sessionToken: session.data.session.token,
						user: session.data.user as User,
					});
				} else {
					setAuthState(null);
				}
			} catch (error) {
				setAuthState(null);
			} finally {
				setIsLoading(false);
			}
		};

		initializeAuth();
	}, []);

	const signOut = async () => {
		try {
			// Sign out from Better Auth (clears SecureStore automatically)
			await authClient.signOut();
		} catch (error) {
			// Silently handle error
		}

		// Clear local state
		setAuthState(null);

		// Navigate to login
		router.replace("/login");
	};

	// Register token refresh interceptor
	useEffect(() => {
		const unsubscribe = api.registerInterceptTokenManager(signOut);
		return () => {
			unsubscribe();
		};
	}, [signOut]);

	const signInWithGoogle = async () => {
		try {
			setIsLoading(true);

			// Initiate Google OAuth with Better Auth
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/(bottom-tabs)/home",
			});

			// Get the session after OAuth completes
			const session = await authClient.getSession();

			if (session.data?.session.token && session.data?.user) {
				// Update local state (Better Auth handles storage automatically)
				setAuthState({
					sessionToken: session.data.session.token,
					user: session.data.user as User,
				});

				// Navigate to home
				router.replace("/(bottom-tabs)/home");
			} else {
				throw new Error("Failed to get session after sign-in");
			}
		} catch (error) {
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const value = useMemo(
		() => ({
			signInWithGoogle,
			signOut,
			isAuthenticated,
			user: authState?.user || null,
			isLoading,
		}),
		[isAuthenticated, authState?.user, isLoading, signInWithGoogle, signOut],
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
