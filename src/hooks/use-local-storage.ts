import { createMMKV } from "react-native-mmkv";
import { LOCAL_STORAGE_KEY_PREFIX } from "@/constants/storage";

export const storage = createMMKV();

export const useLocalStorage = () => {
	const setItem = (key: string, value: string) => {
		storage.set(LOCAL_STORAGE_KEY_PREFIX + key, value);
	};

	const getItem = (key: string) => {
		return storage.getString(LOCAL_STORAGE_KEY_PREFIX + key) || "";
	};

	const removeItem = (key: string) => {
		storage.remove(LOCAL_STORAGE_KEY_PREFIX + key);
	};

	return {
		setItem,
		getItem,
		removeItem,
	};
};
