import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import type { HealthInsurancePlan } from "@/types/health-insurance-plan";

type HealthInsurancePlanPickerProps<T extends FieldValues> = {
	control: Control<T>;
	name: FieldPath<T>;
	label: string;
	plans: HealthInsurancePlan[];
};

export function HealthInsurancePlanPicker<T extends FieldValues>({
	control,
	name,
	label,
	plans,
}: HealthInsurancePlanPickerProps<T>) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field: { value, onChange }, fieldState }) => {
				const selectedIds = Array.isArray(value) ? (value as string[]) : [];

				return (
					<FieldGroup label={label}>
						<View style={styles.list}>
							{plans.map((plan) => {
								const checked = selectedIds.includes(plan.id);

								return (
									<View key={plan.id} style={styles.option}>
										<Checkbox
											checked={checked}
											onCheckedChange={(nextChecked) => {
												onChange(
													nextChecked
														? [...selectedIds, plan.id]
														: selectedIds.filter((id) => id !== plan.id),
												);
											}}
										/>
										<Text style={styles.optionLabel}>{plan.name}</Text>
									</View>
								);
							})}
						</View>
						{fieldState.error?.message ? (
							<Text style={styles.errorText}>{fieldState.error.message}</Text>
						) : null}
					</FieldGroup>
				);
			}}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	list: {
		gap: theme.gap(1.5),
	},
	option: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
	},
	optionLabel: {
		flex: 1,
		fontSize: 14,
		color: theme.colors.foreground,
	},
	errorText: {
		fontSize: 12,
		color: theme.colors.destructive,
	},
}));
