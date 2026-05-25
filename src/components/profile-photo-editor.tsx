import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useUploadProfilePhoto } from "@/hooks/use-profile-photo";
import { showErrorMessageToast, showSuccessToast } from "@/services/toast";
import { Camera } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type ProfilePhotoEditorProps = {
	userId?: string;
	image?: string | null;
	fallbackName: string;
	size?: "sm" | "md" | "lg" | number;
	variant?: "default" | "onPrimary";
	showActions?: boolean;
};

export function ProfilePhotoEditor({
	userId,
	image,
	fallbackName,
	size = "md",
	variant = "default",
	showActions = true,
}: ProfilePhotoEditorProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();
	const { updateUserImage } = useAuth();
	const uploadProfilePhotoMutation = useUploadProfilePhoto();
	const { showImagePickerOptions } = useFileUpload({
		maxSizeInMB: 4,
		allowedTypes: ["image/png", "image/jpeg", "image/webp"],
	});

	const isPending = uploadProfilePhotoMutation.isPending;

	const handlePickPhoto = async () => {
		if (!userId) {
			return;
		}

		const file = await showImagePickerOptions();

		if (!file) {
			return;
		}

		try {
			const response = await uploadProfilePhotoMutation.mutateAsync({
				userId,
				file,
			});
			updateUserImage(response.user.image);
			showSuccessToast("common.profilePhotoUpdated");
		} catch (error) {
			showErrorMessageToast(
				error instanceof Error ? error.message : t("common.failedToUpdateProfilePhoto"),
			);
		}
	};

	const avatar = (
		<Pressable
			onPress={showActions ? undefined : handlePickPhoto}
			disabled={isPending || !userId}
			style={({ pressed }) => [pressed && styles.avatarPressed]}
		>
			<Avatar
				source={image}
				fallback={fallbackName}
				size={size}
				backgroundColor={
					variant === "onPrimary"
						? "rgba(255, 255, 255, 0.15)"
						: `${theme.colors.secondary}`
				}
				textColor={
					variant === "onPrimary"
						? theme.colors.primaryForeground
						: theme.colors.primary
				}
			/>
		</Pressable>
	);

	if (!showActions) {
		return avatar;
	}

	return (
		<View style={styles.container}>
			{avatar}
			<View style={styles.actions}>
				<Button
					variant="secondary"
					size="sm"
					onPress={handlePickPhoto}
					disabled={isPending || !userId}
					loading={uploadProfilePhotoMutation.isPending}
				>
					<View style={styles.buttonContent}>
						<Camera size={16} color={theme.colors.foreground} />
						<Text style={styles.buttonText}>{t("common.changePhoto")}</Text>
					</View>
				</Button>
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
	},
	actions: {
		flex: 1,
		gap: theme.gap(1),
	},
	buttonContent: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	buttonText: {
		fontSize: 14,
		fontWeight: "500",
		color: theme.colors.foreground,
	},
	avatarPressed: {
		opacity: 0.85,
	},
}));
