import type { LucideIcon } from "lucide-react-native";
import { Check, ChevronDown, X } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export type SelectInputOption = {
	value: string;
	label: string;
	description?: string;
	disabled?: boolean;
};

type SelectInputProps = {
	value?: string | null;
	onChange: (value: string) => void;
	options: SelectInputOption[];
	placeholder: string;
	leftIcon?: LucideIcon;
	title?: string;
};

export function SelectInput({
	value,
	onChange,
	options,
	placeholder,
	leftIcon: LeftIcon,
	title,
}: SelectInputProps) {
	const { theme } = useUnistyles();
	const selectedOption = options.find((option) => option.value === value);
	const [open, setOpen] = useState(false);

	const styles = StyleSheet.create({
		trigger: {
			minHeight: 44,
			flexDirection: "row",
			alignItems: "center",
			gap: theme.gap(2),
			paddingHorizontal: theme.gap(2.5),
			borderRadius: theme.radius.md,
			borderWidth: 1,
			borderColor: theme.colors.border,
			backgroundColor: theme.colors.background,
		},
		triggerText: {
			flex: 1,
			fontSize: 15,
			color: selectedOption
				? theme.colors.foreground
				: theme.colors.mutedForeground,
		},
		backdrop: {
			flex: 1,
			justifyContent: "flex-end",
			backgroundColor: "rgba(15, 23, 42, 0.36)",
		},
		sheet: {
			maxHeight: "70%",
			padding: theme.gap(3),
			borderTopLeftRadius: theme.radius.xl,
			borderTopRightRadius: theme.radius.xl,
			backgroundColor: theme.colors.background,
		},
		sheetHeader: {
			marginBottom: theme.gap(2),
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			gap: theme.gap(2),
		},
		sheetTitle: {
			flex: 1,
			fontSize: 18,
			fontWeight: "700",
			color: theme.colors.foreground,
		},
		closeButton: {
			width: 36,
			height: 36,
			alignItems: "center",
			justifyContent: "center",
			borderRadius: theme.radius.md,
			backgroundColor: theme.colors.muted,
		},
		option: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
			gap: theme.gap(2),
			paddingVertical: theme.gap(2),
			paddingHorizontal: theme.gap(2),
			borderRadius: theme.radius.md,
		},
		optionSelected: {
			backgroundColor: theme.colors.muted,
		},
		optionTextWrapper: {
			flex: 1,
		},
		optionLabel: {
			fontSize: 15,
			fontWeight: "600",
			color: theme.colors.foreground,
		},
		optionDescription: {
			marginTop: 2,
			fontSize: 13,
			color: theme.colors.mutedForeground,
		},
	});

	function selectOption(option: SelectInputOption) {
		if (option.disabled) return;
		onChange(option.value);
		setOpen(false);
	}

	return (
		<>
			<Pressable style={styles.trigger} onPress={() => setOpen(true)}>
				{LeftIcon ? (
					<LeftIcon
						size={16}
						color={theme.colors.mutedForeground}
						strokeWidth={2}
					/>
				) : null}
				<Text style={styles.triggerText} numberOfLines={1}>
					{selectedOption?.label || placeholder}
				</Text>
				<ChevronDown
					size={18}
					color={theme.colors.primary}
					strokeWidth={2}
				/>
			</Pressable>
			<Modal
				transparent
				visible={open}
				animationType="fade"
				onRequestClose={() => setOpen(false)}
			>
				<Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
					<Pressable style={styles.sheet}>
						<View style={styles.sheetHeader}>
							<Text style={styles.sheetTitle}>
								{title || placeholder}
							</Text>
							<Pressable
								style={styles.closeButton}
								onPress={() => setOpen(false)}
							>
								<X size={18} color={theme.colors.foreground} />
							</Pressable>
						</View>
						<ScrollView showsVerticalScrollIndicator={false}>
							{options.map((option) => {
								const selected = option.value === value;

								return (
									<Pressable
										key={option.value}
										disabled={option.disabled}
										style={[
											styles.option,
											selected && styles.optionSelected,
											option.disabled && { opacity: 0.45 },
										]}
										onPress={() => selectOption(option)}
									>
										<View style={styles.optionTextWrapper}>
											<Text style={styles.optionLabel}>
												{option.label}
											</Text>
											{option.description ? (
												<Text style={styles.optionDescription}>
													{option.description}
												</Text>
											) : null}
										</View>
										{selected ? (
											<Check
												size={18}
												color={theme.colors.primary}
												strokeWidth={2.4}
											/>
										) : null}
									</Pressable>
								);
							})}
						</ScrollView>
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}
