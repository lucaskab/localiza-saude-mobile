import { StyleSheet } from "react-native-unistyles";

const lightTheme = {
	colors: {
		// Base colors
		background: "#f8fafb",
		foreground: "#1a2b3c",

		// Surface colors
		surfacePrimary: "#ffffff",
		surfaceSecondary: "#e8f4f5",
		surfaceMuted: "#f0f4f5",
		surfaceAccent: "#ffeee8",
		surfaceInput: "#f5f8f9",

		// Teal colors
		teal600: "#3b9a9d",
		teal50: "#e8f4f5",

		// Coral/Peach colors
		coral500: "#d5795b",
		peach50: "#ffeee8",

		// Gray colors
		gray900: "#1a2b3c",
		gray500: "#6b7c8c",
		gray300: "#cbced4",
		gray50: "#f0f4f5",

		// Red colors
		red600: "#d4183d",

		// Amber colors
		amber: "#f59e0b",

		// White
		white: "#ffffff",

		// Semantic colors
		primary: "#3b9a9d",
		primaryForeground: "#ffffff",
		secondary: "#e8f4f5",
		secondaryForeground: "#3b9a9d",
		muted: "#f0f4f5",
		mutedForeground: "#6b7c8c",
		accent: "#ffeee8",
		accentForeground: "#d5795b",
		destructive: "#d4183d",
		destructiveForeground: "#ffffff",

		// Border and effects
		border: "rgba(59, 154, 157, 0.15)",
		borderSubtle: "rgba(59, 154, 157, 0.15)",
		input: "transparent",
		ring: "#3b9a9d",

		// Chart colors
		chart1: "#3b9a9d",
		chart2: "#6eb5b7",
		chart3: "#d5795b",
		chart4: "#ffa07a",
		chart5: "#98d8c8",
	},
	radius: {
		sm: 8,
		md: 10,
		lg: 12,
		xl: 16,
		full: 9999,
	},
	gap: (v: number) => v * 8,
};

const darkTheme = {
	colors: {
		// Base colors
		background: "#252525",
		foreground: "#fcfcfc",

		// Surface colors
		surfacePrimary: "#252525",
		surfaceSecondary: "#444444",
		surfaceMuted: "#444444",
		surfaceAccent: "#444444",
		surfaceInput: "#444444",

		// Teal colors (adjusted for dark mode)
		teal600: "#fcfcfc",
		teal50: "#444444",

		// Coral/Peach colors
		coral500: "#d5795b",
		peach50: "#444444",

		// Gray colors
		gray900: "#fcfcfc",
		gray500: "#b5b5b5",
		gray300: "#707070",
		gray50: "#444444",

		// Red colors
		red600: "#8c2d19",

		// Amber colors
		amber: "#fbbf24",

		// White (inverted in dark mode)
		white: "#343434",

		// Semantic colors
		primary: "#fcfcfc",
		primaryForeground: "#343434",
		secondary: "#444444",
		secondaryForeground: "#fcfcfc",
		muted: "#444444",
		mutedForeground: "#b5b5b5",
		accent: "#444444",
		accentForeground: "#fcfcfc",
		destructive: "#8c2d19",
		destructiveForeground: "#d87766",

		// Border and effects
		border: "#444444",
		borderSubtle: "#444444",
		input: "#444444",
		ring: "#707070",

		// Chart colors
		chart1: "#5865f2",
		chart2: "#57f287",
		chart3: "#fee75c",
		chart4: "#eb459e",
		chart5: "#ed4245",
	},
	radius: {
		sm: 8,
		md: 10,
		lg: 12,
		xl: 16,
		full: 9999,
	},
	gap: (v: number) => v * 8,
};

const appThemes = {
	light: lightTheme,
	dark: darkTheme,
};

const breakpoints = {
	xs: 0,
	sm: 300,
	md: 500,
	lg: 800,
	xl: 1200,
};

type AppBreakpoints = typeof breakpoints;
type AppThemes = typeof appThemes;

declare module "react-native-unistyles" {
	export interface UnistylesThemes extends AppThemes {}
	export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
	settings: {
		initialTheme: "light",
	},
	breakpoints,
	themes: appThemes,
});
