import { Building2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	Text,
	View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type ClinicPayload,
	useClinicEmployees,
	useCreateClinic,
	useMyClinics,
	useRemoveClinicEmployee,
	useUpdateClinic,
	useUpsertClinicEmployee,
} from "@/hooks/use-clinics";
import type { Clinic, ClinicEmployeeRole } from "@/types/user";

const clinicTypes: Array<{ value: Clinic["type"]; label: string }> = [
	{ value: "MEDICAL", label: "Médica" },
	{ value: "HEALTH", label: "Saúde" },
	{ value: "DENTAL", label: "Odonto" },
	{ value: "EYE", label: "Oftalmo" },
	{ value: "BEAUTY", label: "Estética" },
	{ value: "FREE", label: "Livre" },
];

function getRoleLabel(role: ClinicEmployeeRole) {
	if (role === "OWNER") return "Responsável";
	if (role === "PROVIDER") return "Profissional";
	return "Staff";
}

function getInitials(name: string) {
	const parts = name.split(" ").filter(Boolean);
	return (
		parts
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join("") || "LS"
	);
}

function getInitialForm(clinic?: Clinic): ClinicPayload {
	return {
		name: clinic?.name || "",
		phone: clinic?.phone || "",
		email: clinic?.email || "",
		type: clinic?.type || "HEALTH",
		description: clinic?.description || "",
		address: clinic?.address || "",
	};
}

export default function ProviderClinicScreen() {
	const { data: clinics = [], isLoading: isLoadingClinics } = useMyClinics();
	const clinic = clinics[0];
	const { data: employees = [], isLoading: isLoadingEmployees } =
		useClinicEmployees(clinic?.id);
	const createClinic = useCreateClinic();
	const updateClinic = useUpdateClinic();
	const upsertEmployee = useUpsertClinicEmployee();
	const removeEmployee = useRemoveClinicEmployee();

	const [form, setForm] = useState<ClinicPayload>(getInitialForm());
	const [email, setEmail] = useState("");
	const [role, setRole] =
		useState<Exclude<ClinicEmployeeRole, "OWNER">>("STAFF");

	useEffect(() => {
		setForm(getInitialForm(clinic));
	}, [clinic?.id]);

	const providers = employees.filter(
		(employee) => employee.active && employee.role === "PROVIDER",
	);
	const staffEmployees = employees.filter(
		(employee) => employee.active && employee.role !== "PROVIDER",
	);
	const canSave = form.name.trim() && form.phone.trim() && form.email.trim();
	const isSaving = createClinic.isPending || updateClinic.isPending;

	const updateField = <Field extends keyof ClinicPayload>(
		field: Field,
		value: ClinicPayload[Field],
	) => {
		setForm((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSaveClinic = () => {
		if (!canSave) return;

		const payload: ClinicPayload = {
			name: form.name.trim(),
			phone: form.phone.trim(),
			email: form.email.trim(),
			type: form.type,
			description: form.description?.trim() || null,
			address: form.address?.trim() || null,
		};

		if (clinic?.id) {
			updateClinic.mutate({ clinicId: clinic.id, payload });
			return;
		}

		createClinic.mutate(payload);
	};

	const handleAddEmployee = () => {
		if (!clinic?.id || !email.trim()) return;

		upsertEmployee.mutate(
			{
				clinicId: clinic.id,
				role,
				userEmail: email.trim(),
			},
			{
				onSuccess: () => {
					setEmail("");
					setRole("STAFF");
				},
			},
		);
	};

	const confirmRemoveEmployee = (userId: string, userName: string) => {
		if (!clinic?.id) return;

		Alert.alert(
			"Remover da clínica",
			`Deseja remover ${userName} da equipe?`,
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Remover",
					style: "destructive",
					onPress: () =>
						removeEmployee.mutate({
							clinicId: clinic.id,
							userId,
						}),
				},
			],
		);
	};

	return (
		<ScrollView
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<ScreenHeader
				title="Clínica"
				subtitle="Cadastre a clínica e vincule profissionais ou staff à operação."
				icon={Building2}
			/>

			{isLoadingClinics ? (
				<View style={styles.loadingCard}>
					<ActivityIndicator />
					<Text style={styles.muted}>Carregando clínica...</Text>
				</View>
			) : null}

			<View style={styles.card}>
				<Text style={styles.sectionTitle}>Dados da clínica</Text>
				<Text style={styles.muted}>
					O endereço será geocodificado no backend para habilitar busca por
					localização real.
				</Text>

				<View style={styles.field}>
					<Text style={styles.label}>Nome</Text>
					<Input
						value={form.name}
						placeholder="Localiza Saúde Centro"
						onChangeText={(value) => updateField("name", value)}
					/>
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Tipo</Text>
					<View style={styles.typeGrid}>
						{clinicTypes.map((clinicType) => (
							<Button
								key={clinicType.value}
								variant={form.type === clinicType.value ? "default" : "outline"}
								size="sm"
								style={styles.typeButton}
								onPress={() => updateField("type", clinicType.value)}
							>
								{clinicType.label}
							</Button>
						))}
					</View>
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Telefone</Text>
					<Input
						value={form.phone}
						placeholder="(11) 99999-9999"
						keyboardType="phone-pad"
						onChangeText={(value) => updateField("phone", value)}
					/>
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Email</Text>
					<Input
						value={form.email}
						placeholder="contato@clinica.com"
						autoCapitalize="none"
						keyboardType="email-address"
						onChangeText={(value) => updateField("email", value)}
					/>
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Endereço</Text>
					<Input
						value={form.address || ""}
						placeholder="Rua, número, bairro, cidade - UF"
						onChangeText={(value) => updateField("address", value)}
					/>
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Descrição</Text>
					<Input
						value={form.description || ""}
						placeholder="Resumo da estrutura e especialidades da clínica"
						multiline
						onChangeText={(value) => updateField("description", value)}
					/>
				</View>

				<Button
					loading={isSaving}
					disabled={!canSave}
					onPress={handleSaveClinic}
				>
					{clinic ? "Salvar clínica" : "Criar clínica"}
				</Button>
			</View>

			{clinic ? (
				<>
					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Adicionar à equipe</Text>
						<Text style={styles.muted}>
							Vincule uma conta existente por email. Staff pode operar a
							clínica; profissional aparece como parte do time assistencial.
						</Text>
						<Input
							value={email}
							placeholder="email@clinica.com"
							autoCapitalize="none"
							keyboardType="email-address"
							onChangeText={setEmail}
						/>
						<View style={styles.roleButtons}>
							<Button
								variant={role === "STAFF" ? "default" : "outline"}
								size="sm"
								style={styles.roleButton}
								onPress={() => setRole("STAFF")}
							>
								Staff
							</Button>
							<Button
								variant={role === "PROVIDER" ? "default" : "outline"}
								size="sm"
								style={styles.roleButton}
								onPress={() => setRole("PROVIDER")}
							>
								Profissional
							</Button>
						</View>
						<Button
							loading={upsertEmployee.isPending}
							disabled={!email.trim()}
							onPress={handleAddEmployee}
						>
							Adicionar
						</Button>
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Profissionais</Text>
						{isLoadingEmployees ? (
							<Text style={styles.muted}>Carregando profissionais...</Text>
						) : null}
						{providers.map((employee) => (
							<View key={employee.id} style={styles.employeeRow}>
								<View style={styles.avatar}>
									<Text style={styles.avatarText}>
										{getInitials(employee.user.name)}
									</Text>
								</View>
								<View style={styles.employeeInfo}>
									<Text style={styles.employeeName}>{employee.user.name}</Text>
									<Text style={styles.muted}>{employee.user.email}</Text>
								</View>
								<Button
									variant="destructive"
									size="sm"
									loading={removeEmployee.isPending}
									onPress={() =>
										confirmRemoveEmployee(employee.userId, employee.user.name)
									}
								>
									Remover
								</Button>
							</View>
						))}
						{!isLoadingEmployees && providers.length === 0 ? (
							<Text style={styles.muted}>Nenhum profissional vinculado ainda.</Text>
						) : null}
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Staff e responsáveis</Text>
						{staffEmployees.map((employee) => (
							<View key={employee.id} style={styles.staffRow}>
								<View style={styles.employeeInfo}>
									<Text style={styles.employeeName}>{employee.user.name}</Text>
									<Text style={styles.muted}>{employee.user.email}</Text>
								</View>
								<View style={styles.employeeActions}>
									<Text style={styles.badge}>{getRoleLabel(employee.role)}</Text>
									{employee.role !== "OWNER" ? (
										<Button
											variant="destructive"
											size="sm"
											loading={removeEmployee.isPending}
											onPress={() =>
												confirmRemoveEmployee(
													employee.userId,
													employee.user.name,
												)
											}
										>
											Remover
										</Button>
									) : null}
								</View>
							</View>
						))}
						{!isLoadingEmployees && staffEmployees.length === 0 ? (
							<Text style={styles.muted}>Nenhum staff vinculado ainda.</Text>
						) : null}
					</View>
				</>
			) : null}
		</ScrollView>
	);
}

const styles = StyleSheet.create((theme) => ({
	content: {
		flexGrow: 1,
		padding: theme.gap(2),
		gap: theme.gap(2),
		backgroundColor: theme.colors.background,
	},
	card: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		gap: theme.gap(1.5),
	},
	loadingCard: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.lg,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(2),
		alignItems: "center",
		gap: theme.gap(1),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	muted: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		lineHeight: 20,
	},
	field: {
		gap: theme.gap(0.75),
	},
	label: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	typeGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: theme.gap(1),
	},
	typeButton: {
		minWidth: 96,
	},
	roleButtons: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	roleButton: {
		flex: 1,
	},
	employeeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		paddingVertical: theme.gap(1),
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	staffRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: theme.gap(1),
		paddingVertical: theme.gap(1),
		borderBottomWidth: 1,
		borderBottomColor: theme.colors.border,
	},
	avatar: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: theme.colors.secondary,
	},
	avatarText: {
		fontSize: 13,
		fontWeight: "700",
		color: theme.colors.primary,
	},
	employeeInfo: {
		flex: 1,
	},
	employeeName: {
		fontSize: 15,
		fontWeight: "600",
		color: theme.colors.foreground,
	},
	badge: {
		overflow: "hidden",
		borderRadius: theme.radius.sm,
		backgroundColor: theme.colors.secondary,
		paddingHorizontal: theme.gap(1),
		paddingVertical: theme.gap(0.5),
		fontSize: 12,
		fontWeight: "700",
		color: theme.colors.primary,
	},
	employeeActions: {
		alignItems: "flex-end",
		gap: theme.gap(1),
	},
}));
