import { Redirect } from "expo-router";
import AppTabs from "@/components/app-tabs";
import { useAuth } from "@/contexts/auth";

export default function TabLayout() {
  const { isLoading, needsOnboarding } = useAuth();

  if (!isLoading && needsOnboarding) {
    return <Redirect href={"/onboarding" as never} />;
  }

  return <AppTabs />;
}
