import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function AppTabs() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="home">
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={require("@/assets/images/tabIcons/home.png")}
					renderingMode="template"
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="search">
				<NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={require("@/assets/images/tabIcons/home.png")}
					renderingMode="template"
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="appointments">
				<NativeTabs.Trigger.Label>Appointments</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={require("@/assets/images/tabIcons/home.png")}
					renderingMode="template"
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="profile">
				<NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon
					src={require("@/assets/images/tabIcons/explore.png")}
					renderingMode="template"
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
