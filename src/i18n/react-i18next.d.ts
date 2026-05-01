import "i18next";
import type { Translation } from ".";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "translation";
		resources: {
			translation: Translation;
		};
	}
}
