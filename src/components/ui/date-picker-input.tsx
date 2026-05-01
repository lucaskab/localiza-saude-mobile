import { CalendarDays, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import type { ViewStyle } from "react-native";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Button } from "@/components/ui/button";
import type { TranslationKey } from "@/i18n";

type CalendarMarkedDate = {
	selected?: boolean;
	selectedColor?: string;
	selectedTextColor?: string;
	disabled?: boolean;
	disableTouchEvent?: boolean;
	marked?: boolean;
	dotColor?: string;
};

type DatePickerInputProps = {
	value?: string | null;
	onChange: (date: string) => void;
	placeholder?: TranslationKey;
	title?: TranslationKey;
	minDate?: string;
	maxDate?: string;
	markedDates?: Record<string, CalendarMarkedDate>;
	disabled?: boolean;
	allowClear?: boolean;
	containerStyle?: ViewStyle;
};

const parseDateStringAsUtc = (dateString: string) => {
	const [year, month, day] = dateString.split("-").map(Number);
	return new Date(Date.UTC(year || 0, (month || 1) - 1, day || 1));
};

const formatDateForDisplay = (dateString: string, locale: string) => {
	const date = parseDateStringAsUtc(dateString);

	if (Number.isNaN(date.getTime())) {
		return dateString;
	}

	return date.toLocaleDateString(locale, {
		month: "short",
		day: "numeric",
		year: "numeric",
		timeZone: "UTC",
	});
};

export function DatePickerInput({
	value,
	onChange,
	placeholder = "common.selectDate2",
	title = "common.selectDate2",
	minDate,
	maxDate,
	markedDates,
	disabled = false,
	allowClear = false,
	containerStyle,
}: DatePickerInputProps) {
	const { theme } = useUnistyles();
	const { i18n, t } = useTranslation();
	const [isOpen, setIsOpen] = useState(false);

	const selectedDate = value || undefined;
	const displayValue = selectedDate
		? formatDateForDisplay(selectedDate, i18n.language)
		: t(placeholder);

	const calendarMarkedDates = useMemo(() => {
		const nextMarkedDates = { ...(markedDates || {}) };

		if (selectedDate) {
			nextMarkedDates[selectedDate] = {
				...nextMarkedDates[selectedDate],
				selected: true,
				selectedColor: theme.colors.primary,
				selectedTextColor: theme.colors.primaryForeground,
			};
		}

		return nextMarkedDates;
	}, [
		markedDates,
		selectedDate,
		theme.colors.primary,
		theme.colors.primaryForeground,
	]);

	const handleSelectDate = (dateString: string) => {
		onChange(dateString);
		setIsOpen(false);
	};

	return (
		<>
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={t(title)}
				disabled={disabled}
				onPress={() => setIsOpen(true)}
				style={[
					styles.inputContainer,
					disabled && styles.inputContainerDisabled,
					containerStyle,
				]}
			>
				<View style={styles.inputIcon}>
					<CalendarDays
						size={16}
						color={theme.colors.mutedForeground}
						strokeWidth={2}
					/>
				</View>
				<TextInput
					editable={false}
					pointerEvents="none"
					value={selectedDate ? displayValue : ""}
					placeholder={t(placeholder)}
					placeholderTextColor={theme.colors.mutedForeground}
					style={styles.inputText}
				/>
			</Pressable>

			<Modal
				animationType="fade"
				transparent
				visible={isOpen}
				onRequestClose={() => setIsOpen(false)}
			>
				<View style={styles.modalOverlay}>
					<Pressable
						style={styles.modalBackdrop}
						onPress={() => setIsOpen(false)}
					/>
					<View style={styles.modalCard}>
						<View style={styles.modalHeader}>
							<View>
								<Text style={styles.modalTitle}>{t(title)}</Text>
								<Text style={styles.modalSubtitle}>
									{selectedDate
										? formatDateForDisplay(selectedDate, i18n.language)
										: t("common.chooseADateFromTheCalendar")}
								</Text>
							</View>
							<Pressable
								style={styles.closeButton}
								onPress={() => setIsOpen(false)}
							>
								<X
									size={20}
									color={theme.colors.mutedForeground}
									strokeWidth={2}
								/>
							</Pressable>
						</View>

						<Calendar
							current={selectedDate}
							minDate={minDate}
							maxDate={maxDate}
							markedDates={calendarMarkedDates}
							onDayPress={(day) => handleSelectDate(day.dateString)}
							theme={{
								backgroundColor: theme.colors.background,
								calendarBackground: theme.colors.surfacePrimary,
								textSectionTitleColor: theme.colors.mutedForeground,
								selectedDayBackgroundColor: theme.colors.primary,
								selectedDayTextColor: theme.colors.primaryForeground,
								todayTextColor: theme.colors.primary,
								dayTextColor: theme.colors.foreground,
								textDisabledColor: theme.colors.mutedForeground,
								dotColor: theme.colors.primary,
								selectedDotColor: theme.colors.primaryForeground,
								arrowColor: theme.colors.primary,
								monthTextColor: theme.colors.foreground,
								indicatorColor: theme.colors.primary,
								textDayFontWeight: "400",
								textMonthFontWeight: "700",
								textDayHeaderFontWeight: "700",
								textDayFontSize: 14,
								textMonthFontSize: 16,
								textDayHeaderFontSize: 12,
							}}
							style={styles.calendar}
						/>

						<View style={styles.modalActions}>
							{allowClear ? (
								<Button
									variant="outline"
									size="sm"
									style={styles.modalActionButton}
									onPress={() => {
										onChange("");
										setIsOpen(false);
									}}
								>
									{t("common.clear")}
								</Button>
							) : null}
							<Button
								variant="secondary"
								size="sm"
								style={styles.modalActionButton}
								onPress={() => setIsOpen(false)}
							>
								{t("common.cancel")}
							</Button>
						</View>
					</View>
				</View>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create((theme) => ({
	inputContainer: {
		minHeight: 48,
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(2.5),
		borderRadius: theme.radius.md,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
	},
	inputContainerDisabled: {
		opacity: 0.5,
		backgroundColor: theme.colors.muted,
	},
	inputIcon: {
		alignItems: "center",
		justifyContent: "center",
	},
	inputText: {
		flex: 1,
		fontSize: 15,
		color: theme.colors.foreground,
	},
	modalOverlay: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: theme.gap(3),
	},
	modalBackdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(15, 23, 42, 0.48)",
	},
	modalCard: {
		width: "100%",
		maxWidth: 420,
		borderRadius: 24,
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.surfacePrimary,
		padding: theme.gap(2),
		gap: theme.gap(2),
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(1),
		paddingTop: theme.gap(1),
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	modalSubtitle: {
		marginTop: theme.gap(0.5),
		fontSize: 13,
		color: theme.colors.mutedForeground,
	},
	closeButton: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.surfaceSecondary,
	},
	calendar: {
		borderRadius: 16,
		overflow: "hidden",
	},
	modalActions: {
		flexDirection: "row",
		justifyContent: "flex-end",
		gap: theme.gap(1),
	},
	modalActionButton: {
		borderRadius: theme.radius.full,
	},
}));
