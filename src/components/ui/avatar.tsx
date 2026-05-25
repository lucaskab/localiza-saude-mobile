import { Image, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useState } from "react";

type AvatarSize = "sm" | "md" | "lg" | number;

interface AvatarProps {
	source?: ImageSourcePropType | string | null;
	fallback?: string;
	size?: AvatarSize;
	backgroundColor?: string;
	textColor?: string;
}

function getInitials(value: string) {
	const words = value
		.trim()
		.split(/\s+/)
		.filter(Boolean);

	if (words.length === 0) {
		return "LS";
	}

	if (words.length === 1) {
		return words[0].slice(0, 2).toUpperCase();
	}

	return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function Avatar({
	source,
	fallback = "LS",
	size = "md",
	backgroundColor,
	textColor,
}: AvatarProps) {
	const { theme } = useUnistyles();
	const [imageFailed, setImageFailed] = useState(false);

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

	const fontSize = Math.max(Math.floor(dimensions * 0.32), 12);
	const imageSource =
		typeof source === "string" && source.trim().length > 0 && !imageFailed
			? { uri: source }
			: typeof source === "object" && source && !imageFailed
				? source
				: null;

	const styles = StyleSheet.create({
		container: {
			width: dimensions,
			height: dimensions,
			borderRadius: dimensions / 2,
			backgroundColor: backgroundColor || `${theme.colors.white}33`,
			alignItems: "center",
			justifyContent: "center",
			overflow: "hidden",
		},
		image: {
			width: "100%",
			height: "100%",
		},
		fallbackText: {
			fontSize,
			fontWeight: "700",
			color: textColor || theme.colors.primaryForeground,
		},
	});

	return (
		<View style={styles.container}>
			{imageSource ? (
				<Image
					source={imageSource}
					style={styles.image}
					resizeMode="cover"
					onError={() => setImageFailed(true)}
				/>
			) : (
				<Text style={styles.fallbackText}>{getInitials(fallback)}</Text>
			)}
		</View>
	);
}
