import { UsersRound } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ScreenHeader } from "@/components/screen-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import {
	useClinicEmployees,
	useMyClinics,
	useRemoveClinicEmployee,
	useUpsertClinicEmployee,
} from "@/hooks/use-clinics";
import type { ClinicEmployeeRole } from "@/types/user";

function getRoleLabel(role: ClinicEmployeeRole) {
	if (role === "OWNER") return "Responsável";
	if (role === "PROVIDER") return "Profissional";
	return "Staff";
}

export default function StaffScreen() {
	const { signOut } = useAuth();
	const { data: clinics = [], isLoading: isLoadingClinics } = useMyClinics();
	const [email, setEmail] = useState("");
	const [role, setRole] =
		useState<Exclude<ClinicEmployeeRole, "OWNER">>("STAFF");
	const clinic = clinics[0];
	const { data: employees = [], isLoading: isLoadingEmployees } = useClinicEmployees(
		clinic?.id,
	);
	const upsertEmployee = useUpsertClinicEmployee();
	const removeEmployee = useRemoveClinicEmployee();
	const providers = employees.filter(
		(employee) => employee.active && employee.role === "PROVIDER",
	);
	const staffEmployees = employees.filter(
		(employee) => employee.active && employee.role !== "PROVIDER",
	);

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

	return (
		<ScrollView
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<ScreenHeader
				title="Operação da clínica"
				subtitle="Acesse a equipe vinculada e os profissionais que você pode auxiliar."
				icon={UsersRound}
			/>

			{isLoadingClinics ? (
				<View style={styles.loadingCard}>
					<ActivityIndicator />
					<Text style={styles.muted}>Carregando clínicas...</Text>
				</View>
			) : null}

			{!isLoadingClinics && !clinic ? (
				<View style={styles.card}>
					<Text style={styles.title}>Nenhuma clínica vinculada</Text>
					<Text style={styles.muted}>
						Peça para um responsável adicionar sua conta à equipe da clínica.
					</Text>
				</View>
			) : null}

			{clinic ? (
				<>
					<View style={styles.card}>
						<Text style={styles.eyebrow}>Clínica</Text>
						<Text style={styles.title}>{clinic.name}</Text>
						<Text style={styles.muted}>
							{clinic.address || "Endereço não informado"}
						</Text>
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Adicionar à equipe</Text>
						<Text style={styles.muted}>
							Use o e-mail da conta já cadastrada para vincular staff ou
							profissional à clínica.
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
										{employee.user.name
											.split(" ")
											.filter(Boolean)
											.slice(0, 2)
											.map((part) => part[0]?.toUpperCase())
											.join("") || "LS"}
									</Text>
								</View>
								<View style={styles.employeeInfo}>
									<Text style={styles.employeeName}>{employee.user.name}</Text>
									<Text style={styles.muted}>{employee.user.email}</Text>
								</View>
							</View>
						))}
						{!isLoadingEmployees && providers.length === 0 ? (
							<Text style={styles.muted}>Nenhum profissional vinculado ainda.</Text>
						) : null}
					</View>

					<View style={styles.card}>
						<Text style={styles.sectionTitle}>Equipe</Text>
						{staffEmployees.map((employee) => (
							<View key={employee.id} style={styles.staffRow}>
								<View>
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
												removeEmployee.mutate({
													clinicId: clinic.id,
													userId: employee.userId,
												})
											}
										>
											Remover
										</Button>
									) : null}
								</View>
							</View>
						))}
					</View>
				</>
			) : null}

			<Button variant="outline" onPress={signOut}>
				Sair
			</Button>
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
		gap: theme.gap(1),
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
	eyebrow: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		color: theme.colors.primary,
	},
	title: {
		fontSize: 20,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
		marginBottom: theme.gap(0.5),
	},
	muted: {
		fontSize: 14,
		color: theme.colors.mutedForeground,
		lineHeight: 20,
	},
	employeeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1.5),
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
	roleButtons: {
		flexDirection: "row",
		gap: theme.gap(1),
	},
	roleButton: {
		flex: 1,
	},
	employeeActions: {
		alignItems: "flex-end",
		gap: theme.gap(1),
	},
}));
