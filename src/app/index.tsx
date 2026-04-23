import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/auth";

export default function Index() {
	const { user, isLoading, isCustomer, isHealthcareProvider } = useAuth();

	// Wait for auth to initialize before redirecting
	if (isLoading) {
		return null; // or return a loading screen
	}

	if (!user) {
		return <Redirect href="/login" />;
	}

	// Redirect based on user role
	if (isHealthcareProvider) {
		return <Redirect href="/(provider-tabs)/dashboard" />;
	}

	if (isCustomer) {
		return <Redirect href="/(bottom-tabs)/home" />;
	}

	// Fallback to login if role is not set
	return <Redirect href="/login" />;
}
