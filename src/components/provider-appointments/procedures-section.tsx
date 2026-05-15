import { ShieldPlus } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Procedure } from "@/types/user";

type ProceduresSectionProps = {
	procedures: Procedure[];
	selectedProcedureIds: string[];
	onToggleProcedure: (procedureId: string) => void;
};

export function ProceduresSection({
	procedures,
	selectedProcedureIds,
	onToggleProcedure,
}: ProceduresSectionProps) {
	const { theme } = useUnistyles();
	const { t } = useTranslation();

	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<ShieldPlus
					size={20}
					color={theme.colors.primary}
					strokeWidth={2}
				/>
				<Text style={styles.sectionTitle}>{t("common.procedures")}</Text>
			</View>
			<View style={styles.procedureGrid}>
				{procedures.map((procedure) => {
					const selected = selectedProcedureIds.includes(procedure.id);

					return (
						<Pressable
							key={procedure.id}
							style={[
								styles.procedureOption,
								selected && styles.procedureOptionActive,
							]}
							onPress={() => onToggleProcedure(procedure.id)}
						>
							<Text
								style={[
									styles.procedureName,
									selected && styles.procedureNameActive,
								]}
							>
								{procedure.name}
							</Text>
							<Text
								style={[
									styles.procedureMeta,
									selected && styles.procedureMetaActive,
								]}
							>
								{procedure.durationInMinutes} min • $
								{(procedure.priceInCents / 100).toFixed(2)}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	section: {
		backgroundColor: theme.colors.surfacePrimary,
		borderRadius: theme.radius.xl,
		borderWidth: 1,
		borderColor: theme.colors.border,
		padding: theme.gap(3),
		gap: theme.gap(2),
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	procedureGrid: {
		gap: theme.gap(1),
	},
	procedureOption: {
		borderWidth: 1,
		borderColor: theme.colors.border,
		backgroundColor: theme.colors.background,
		borderRadius: theme.radius.lg,
		padding: theme.gap(2),
	},
	procedureOptionActive: {
		backgroundColor: theme.colors.primary,
		borderColor: theme.colors.primary,
	},
	procedureName: {
		fontSize: 15,
		fontWeight: "700",
		color: theme.colors.foreground,
	},
	procedureNameActive: {
		color: theme.colors.primaryForeground,
	},
	procedureMeta: {
		marginTop: theme.gap(0.5),
		fontSize: 13,
		color: theme.colors.mutedForeground,
	},
	procedureMetaActive: {
		color: theme.colors.primaryForeground,
	},
}));
