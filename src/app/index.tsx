import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/auth";

export default function Index() {
	const { user, isLoading } = useAuth();

	// Wait for auth to initialize before redirecting
	if (isLoading) {
		return null; // or return a loading screen
	}

	if (!user) {
		return <Redirect href="/login" />;
	}

	return <Redirect href="/(bottom-tabs)/home" />;
}
