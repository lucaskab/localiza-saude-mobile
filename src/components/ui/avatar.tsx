import { Image, View } from "react-native";
import { User } from "lucide-react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { ImageSourcePropType } from "react-native";
import type { LucideIcon } from "lucide-react-native";

type AvatarSize = "sm" | "md" | "lg" | number;

interface AvatarProps {
	source?: ImageSourcePropType | string | null;
	size?: AvatarSize;
	fallbackIcon?: LucideIcon;
	backgroundColor?: string;
	iconColor?: string;
}

export function Avatar({
	source,
	size = "md",
	fallbackIcon: FallbackIcon = User,
	backgroundColor,
	iconColor,
}: AvatarProps) {
	const { theme } = useUnistyles();

	// Determine dimensions based on size
	const dimensions = (() => {
		if (typeof size === "number") {
			return size;
		}
		switch (size) {
			case "sm":
				return 40;
			case "lg":
				return 100;
			case "md":
			default:
				return 80;
		}
	})();

	// Icon size is half of container size
	const iconSize = Math.floor(dimensions / 2);

	const styles = StyleSheet.create({
		container: {
			width: dimensions,
			height: dimensions,
			borderRadius: dimensions / 2,
			backgroundColor:
				backgroundColor || `${theme.colors.white}33`,
			alignItems: "center",
			justifyContent: "center",
			overflow: "hidden",
		},
		image: {
			width: "100%",
			height: "100%",
		},
	});

	// Convert string URI to ImageSource if needed
	const imageSource =
		typeof source === "string" ? { uri: source } : source;

	return (
		<View style={styles.container}>
			{imageSource ? (
				<Image source={imageSource} style={styles.image} resizeMode="cover" />
			) : (
				<FallbackIcon
					size={iconSize}
					color={iconColor || theme.colors.primaryForeground}
					strokeWidth={2}
				/>
			)}
		</View>
	);
}
