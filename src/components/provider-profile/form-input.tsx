import type { LucideIcon } from "lucide-react-native";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import {
	type ProfileFormData,
	type ProfileTextField,
} from "@/components/provider-profile/profile-form";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type FormInputProps = {
	control: Control<ProfileFormData>;
	icon?: LucideIcon;
	label: string;
	name: ProfileTextField;
	placeholder?: string;
	multiline?: boolean;
	keyboardType?: "default" | "numeric";
	required?: boolean;
};

export function FormInput({
	control,
	icon,
	label,
	name,
	placeholder,
	multiline,
	keyboardType,
	required = false,
}: FormInputProps) {
	return (
		<Controller
			control={control}
			name={name}
			render={({ field, fieldState }) => (
				<FieldGroup label={label} required={required}>
					<Input
						leftIcon={icon}
						value={field.value || ""}
						onChangeText={field.onChange}
						placeholder={placeholder}
						multiline={multiline}
						keyboardType={keyboardType}
						errorMessage={fieldState.error?.message}
					/>
				</FieldGroup>
			)}
		/>
	);
}
