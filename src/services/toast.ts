import i18n, { type TranslationKey } from "@/i18n";
import Toast from "react-native-toast-message";

type ToastParams = Record<string, string | number>;

const translateToastText = (
	messageKey: TranslationKey,
	params?: ToastParams,
) => {
	const translate = i18n.t as (key: string, params?: ToastParams) => string;
	return translate(messageKey, params);
};

export const showSuccessToast = (
	messageKey: TranslationKey,
	params?: ToastParams,
) => {
	Toast.show({
		type: "success",
		text1: i18n.t("common.success"),
		text2: translateToastText(messageKey, params),
		position: "top",
	});
};

export const showErrorToast = (
	messageKey: TranslationKey,
	params?: ToastParams,
) => {
	Toast.show({
		type: "error",
		text1: i18n.t("common.error"),
		text2: translateToastText(messageKey, params),
		position: "top",
	});
};

export const showErrorMessageToast = (message: string) => {
	Toast.show({
		type: "error",
		text1: i18n.t("common.error"),
		text2: message,
		position: "top",
	});
};
