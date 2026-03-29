import { z } from "zod";

const envSchema = z.object({
	EXPO_PUBLIC_BASE_URL: z.url(),
	EXPO_PUBLIC_SCHEME: z.string(),
});

const safeParse = () => {
	console.log("🔍 Loading environment variables...");
	console.log("📋 Raw env values:", {
		BASE_URL: process.env.EXPO_PUBLIC_BASE_URL,
		SCHEME: process.env.EXPO_PUBLIC_SCHEME,
	});

	const result = envSchema.safeParse(process.env);
	if (!result.success) {
		console.error("❌ Environment validation failed!");
		console.error("Issues:", JSON.stringify(result.error.format(), null, 2));

		throw new Error(
			`Invalid environment variables:\n\n` +
				`Please check your .env file and ensure:\n` +
				`- EXPO_PUBLIC_BASE_URL is set (e.g., http://192.168.1.108:3333)\n` +
				`- EXPO_PUBLIC_SCHEME is set (e.g., localizasaude)\n` +
				`- EXPO_PUBLIC_STORAGE_PREFIX is set (e.g., localizasaude)\n\n` +
				`Error details: ${result.error.message}`,
		);
	}

	console.log("✅ Environment variables loaded successfully");
	return result.data;
};

export const env = safeParse();
