import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "@/i18n/locales/en";
import { es } from "@/i18n/locales/es";
import { ptBR } from "@/i18n/locales/pt-BR";

export const supportedLanguages = ["pt-BR", "en", "es"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const deviceLanguage = getLocales()[0]?.languageCode;

export const getDeviceLocale = (): SupportedLanguage => {
	if (
		deviceLanguage &&
		supportedLanguages.includes(deviceLanguage as SupportedLanguage)
	) {
		return deviceLanguage as SupportedLanguage;
	}

	return "pt-BR";
};

i18n.use(initReactI18next).init({
	resources: {
		"pt-BR": { translation: ptBR },
		en: { translation: en },
		es: { translation: es },
	},
	lng: getDeviceLocale(),
	fallbackLng: "pt-BR",
	compatibilityJSON: "v4",
	interpolation: {
		escapeValue: false,
	},
	returnEmptyString: false,
});

export default i18n;
export type Translation = typeof ptBR;
export type TranslationKey = {
	[Namespace in keyof Translation & string]: `${Namespace}.${
		keyof Translation[Namespace] & string
	}`;
}[keyof Translation & string];

export const supportedLanguagesWithNames = [
	{ code: "pt-BR" as const, name: "Português" },
	{ code: "en" as const, name: "English" },
	{ code: "es" as const, name: "Español" },
] as const;
