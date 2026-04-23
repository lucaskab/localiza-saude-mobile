import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export interface FileUploadResult {
	uri: string;
	name: string;
	type: string;
	size?: number;
}

export interface UseFileUploadOptions {
	maxSizeInMB?: number;
	allowedTypes?: string[];
	onError?: (error: string) => void;
}

export const useFileUpload = (options?: UseFileUploadOptions) => {
	const { maxSizeInMB = 10, allowedTypes, onError } = options || {};

	const validateFileSize = (size?: number): boolean => {
		if (!size) return true;
		const sizeInMB = size / (1024 * 1024);
		if (sizeInMB > maxSizeInMB) {
			const errorMsg = `File size exceeds ${maxSizeInMB}MB limit`;
			onError?.(errorMsg);
			Alert.alert("File Too Large", errorMsg);
			return false;
		}
		return true;
	};

	const validateFileType = (type: string): boolean => {
		if (!allowedTypes || allowedTypes.length === 0) return true;

		const isAllowed = allowedTypes.some((allowedType) => {
			if (allowedType.endsWith("/*")) {
				const category = allowedType.split("/")[0];
				return type.startsWith(category);
			}
			return type === allowedType;
		});

		if (!isAllowed) {
			const errorMsg = "File type not supported";
			onError?.(errorMsg);
			Alert.alert("Invalid File Type", errorMsg);
			return false;
		}
		return true;
	};

	const pickImageFromLibrary = async (): Promise<FileUploadResult | null> => {
		try {
			const permissionResult =
				await ImagePicker.requestMediaLibraryPermissionsAsync();

			if (!permissionResult.granted) {
				Alert.alert(
					"Permission Required",
					"Please allow access to your photo library",
				);
				return null;
			}

			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ImagePicker.MediaTypeOptions.Images,
				allowsEditing: true,
				quality: 0.8,
			});

			if (result.canceled || !result.assets?.[0]) {
				return null;
			}

			const asset = result.assets[0];
			const fileName = asset.uri.split("/").pop() || `image_${Date.now()}.jpg`;
			const fileType =
				asset.type === "image" ? "image/jpeg" : asset.mimeType || "image/jpeg";

			if (!validateFileType(fileType)) {
				return null;
			}

			if (!validateFileSize(asset.fileSize)) {
				return null;
			}

			return {
				uri: asset.uri,
				name: fileName,
				type: fileType,
				size: asset.fileSize,
			};
		} catch (error) {
			const errorMsg = "Failed to pick image";
			onError?.(errorMsg);
			Alert.alert("Error", errorMsg);
			console.error("Error picking image:", error);
			return null;
		}
	};

	const pickImageFromCamera = async (): Promise<FileUploadResult | null> => {
		try {
			const permissionResult =
				await ImagePicker.requestCameraPermissionsAsync();

			if (!permissionResult.granted) {
				Alert.alert(
					"Permission Required",
					"Please allow access to your camera",
				);
				return null;
			}

			const result = await ImagePicker.launchCameraAsync({
				allowsEditing: true,
				quality: 0.8,
			});

			if (result.canceled || !result.assets?.[0]) {
				return null;
			}

			const asset = result.assets[0];
			const fileName = `photo_${Date.now()}.jpg`;
			const fileType = "image/jpeg";

			if (!validateFileSize(asset.fileSize)) {
				return null;
			}

			return {
				uri: asset.uri,
				name: fileName,
				type: fileType,
				size: asset.fileSize,
			};
		} catch (error) {
			const errorMsg = "Failed to take photo";
			onError?.(errorMsg);
			Alert.alert("Error", errorMsg);
			console.error("Error taking photo:", error);
			return null;
		}
	};

	const pickDocument = async (): Promise<FileUploadResult | null> => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: allowedTypes || "*/*",
				copyToCacheDirectory: true,
			});

			if (result.canceled || !result.assets?.[0]) {
				return null;
			}

			const asset = result.assets[0];

			if (!validateFileType(asset.mimeType || "application/octet-stream")) {
				return null;
			}

			if (!validateFileSize(asset.size)) {
				return null;
			}

			return {
				uri: asset.uri,
				name: asset.name,
				type: asset.mimeType || "application/octet-stream",
				size: asset.size,
			};
		} catch (error) {
			const errorMsg = "Failed to pick document";
			onError?.(errorMsg);
			Alert.alert("Error", errorMsg);
			console.error("Error picking document:", error);
			return null;
		}
	};

	const showImagePickerOptions = (): Promise<FileUploadResult | null> => {
		return new Promise((resolve) => {
			Alert.alert(
				"Select Image",
				"Choose an option",
				[
					{
						text: "Take Photo",
						onPress: async () => {
							const result = await pickImageFromCamera();
							resolve(result);
						},
					},
					{
						text: "Choose from Library",
						onPress: async () => {
							const result = await pickImageFromLibrary();
							resolve(result);
						},
					},
					{
						text: "Cancel",
						style: "cancel",
						onPress: () => resolve(null),
					},
				],
				{ cancelable: true, onDismiss: () => resolve(null) },
			);
		});
	};

	const showFilePickerOptions = (): Promise<FileUploadResult | null> => {
		return new Promise((resolve) => {
			Alert.alert(
				"Select File",
				"Choose an option",
				[
					{
						text: "Image",
						onPress: async () => {
							const result = await showImagePickerOptions();
							resolve(result);
						},
					},
					{
						text: "Document",
						onPress: async () => {
							const result = await pickDocument();
							resolve(result);
						},
					},
					{
						text: "Cancel",
						style: "cancel",
						onPress: () => resolve(null),
					},
				],
				{ cancelable: true, onDismiss: () => resolve(null) },
			);
		});
	};

	return {
		pickImageFromLibrary,
		pickImageFromCamera,
		pickDocument,
		showImagePickerOptions,
		showFilePickerOptions,
	};
};
