import type { ExpoConfig } from "@expo/config-types";

const IS_DEV = process.env.APP_VARIANT === "development";

const getUniqueIdentifier = () => {
	if (IS_DEV) {
		return "com.llf.localizasaude.dev";
	}

	return "com.llf.localizasaude";
};

const getAppName = () => {
	if (IS_DEV) {
		return "Localiza Saúde (Dev)";
	}

	return "Localiza Saúde";
};

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
	...config,
	name: getAppName(),
	slug: "localiza-saude",
	version: "1.0.0",
	orientation: "portrait",
	icon: "./assets/images/icon.png",
	scheme: "localizasaude",
	userInterfaceStyle: "automatic",
	owner: "lucasfurini",
	ios: {
		icon: "./assets/expo.icon",
		bundleIdentifier: getUniqueIdentifier(),
		infoPlist: {
			ITSAppUsesNonExemptEncryption: false,
			NSBonjourServices: ["_expo._tcp"],
			NSLocalNetworkUsageDescription:
				"This app uses the local network to connect to the Expo development server.",
		},
	},
	android: {
		adaptiveIcon: {
			backgroundColor: "#E6F4FE",
			foregroundImage: "./assets/images/android-icon-foreground.png",
			backgroundImage: "./assets/images/android-icon-background.png",
			monochromeImage: "./assets/images/android-icon-monochrome.png",
		},
		predictiveBackGestureEnabled: false,
		package: getUniqueIdentifier(),
	},
	web: {
		bundler: "metro",
		output: "static",
		favicon: "./assets/images/favicon.png",
	},
	plugins: [
		"expo-router",
		"expo-secure-store",
		"expo-font",
		"expo-web-browser",
		"@config-plugins/react-native-blob-util",
		"@config-plugins/react-native-pdf",
		[
			"expo-image-picker",
			{
				photosPermission:
					"The app accesses your photos to let you share them with your friends.",
				colors: {
					cropToolbarColor: "#000000",
				},
				dark: {
					colors: {
						cropToolbarColor: "#000000",
					},
				},
			},
		],
		[
			"expo-document-picker",
			{
				iCloudContainerEnvironment: "Production",
			},
		],
		[
			"expo-dev-client",
			{
				launchMode: "most-recent",
			},
		],
		[
			"expo-image",
			{
				disableLibdav1d: true,
			},
		],
		[
			"expo-splash-screen",
			{
				backgroundColor: "#208AEF",
				android: {
					image: "./assets/images/splash-icon.png",
					imageWidth: 76,
				},
			},
		],
	],
	experiments: {
		typedRoutes: true,
		reactCompiler: true,
	},
	extra: {
		eas: {
			projectId: "820bab7e-337b-4ff7-b95a-795e8d8bb474",
		},
	},
});
