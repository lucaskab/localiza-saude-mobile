import { Redirect } from "expo-router";
import ProviderTabs from "@/components/provider-tabs";
import { useAuth } from "@/contexts/auth";

export default function TabLayout() {
	const { isLoading, needsOnboarding } = useAuth();

	if (!isLoading && needsOnboarding) {
		return <Redirect href={"/onboarding" as never} />;
	}

	return <ProviderTabs />;
}
