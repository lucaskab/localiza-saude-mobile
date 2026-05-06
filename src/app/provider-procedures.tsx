import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { useProceduresByProvider } from "@/hooks/use-procedures";
import { useRouter } from "expo-router";
import {
	AlertCircle,
	Briefcase,
	Clock,
	DollarSign,
	Edit2,
	Plus,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ScreenHeader } from "@/components/screen-header";

export default function ProviderProcedures() {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { healthcareProvider } = useAuth();
  const providerId = healthcareProvider?.id || "";

  const {
    data: proceduresData,
    isLoading,
    error,
    refetch,
  } = useProceduresByProvider({
    healthcareProviderId: providerId,
    enabled: !!providerId,
  });

  const procedures = proceduresData?.procedures || [];

  const openAddProcedureSheet = () => {
    router.push("/provider-procedure-create" as never);
  };

  const openEditProcedureSheet = (procedureId: string) => {
    router.push({
      pathname: "/provider-procedure-create",
      params: { procedureId },
    } as never);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.container}
      testID="provider-procedures-screen"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title={t("common.procedures")}
          subtitle={t("common.manageProceduresDescription")}
          icon={Briefcase}
          backButtonTestID="provider-procedures-back-button"
          style={styles.screenHeader}
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              {t("common.loadingProcedures")}
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <AlertCircle
              size={48}
              color={theme.colors.destructive}
              strokeWidth={2}
            />
            <Text style={styles.errorText}>
              {t("common.failedToLoadProfile")}
            </Text>
            <Button onPress={() => refetch()} size="sm">
              {t("common.retry")}
            </Button>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("common.procedures")}</Text>
              <Button
                variant="outline"
                size="sm"
                onPress={openAddProcedureSheet}
              >
                <View style={styles.buttonContent}>
                  <Plus
                    size={16}
                    color={theme.colors.foreground}
                    strokeWidth={2}
                  />
                </View>
              </Button>
            </View>

            {procedures.length === 0 ? (
              <View style={styles.emptyState}>
                <Briefcase
                  size={48}
                  color={theme.colors.mutedForeground}
                  strokeWidth={1.5}
                />
                <Text style={styles.emptyText}>
                  {t("common.noProceduresYet")}
                </Text>
                <Text style={styles.emptySubtext}>
                  {t(
                    "common.addProceduresToLetPatientsKnowWhatServicesYouOffer",
                  )}
                </Text>
              </View>
            ) : (
              <View style={styles.proceduresList}>
                {procedures.map((procedure) => {
                  return (
                    <View key={procedure.id} style={styles.procedureCard}>
                      <View style={styles.procedureHeader}>
                        <Text style={styles.procedureName}>
                          {procedure.name}
                        </Text>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={t("common.editProcedure")}
                          onPress={() => openEditProcedureSheet(procedure.id)}
                          style={styles.editButton}
                        >
                          <Edit2
                            size={18}
                            color={theme.colors.primary}
                            strokeWidth={2}
                          />
                        </Pressable>
                      </View>

                      {procedure.description ? (
                        <Text style={styles.procedureDescription}>
                          {procedure.description}
                        </Text>
                      ) : null}

                      <View style={styles.procedureMetadata}>
                        <View style={styles.metadataItem}>
                          <Clock
                            size={14}
                            color={theme.colors.mutedForeground}
                            strokeWidth={2}
                          />
                          <Text style={styles.metadataText}>
                            {procedure.durationInMinutes} min
                          </Text>
                        </View>
                        <View style={styles.metadataItem}>
                          <DollarSign
                            size={14}
                            color={theme.colors.mutedForeground}
                            strokeWidth={2}
                          />
                          <Text style={styles.metadataText}>
                            R$ {(procedure.priceInCents / 100).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.gap(3),
    paddingTop: theme.gap(3),
    paddingBottom: theme.gap(20),
  },
  screenHeader: {
    marginBottom: theme.gap(3),
  },
  loadingContainer: {
    paddingVertical: theme.gap(8),
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: theme.gap(2),
    fontSize: 16,
    color: theme.colors.mutedForeground,
  },
  errorContainer: {
    paddingVertical: theme.gap(8),
    alignItems: "center",
    justifyContent: "center",
    gap: theme.gap(2),
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.destructive,
    textAlign: "center",
  },
  section: {
    marginBottom: theme.gap(4),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.gap(3),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.gap(8),
    gap: theme.gap(2),
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    textAlign: "center",
    maxWidth: 280,
  },
  proceduresList: {
    gap: theme.gap(2),
  },
  procedureCard: {
    backgroundColor: theme.colors.surfacePrimary,
    borderRadius: theme.radius.lg,
    padding: theme.gap(3),
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  procedureHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.gap(1),
  },
  procedureName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.foreground,
    flex: 1,
  },
  editButton: {
    padding: theme.gap(1),
  },
  procedureDescription: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    marginBottom: theme.gap(2),
    lineHeight: 20,
  },
  procedureMetadata: {
    flexDirection: "row",
    gap: theme.gap(3),
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  metadataText: {
    fontSize: 13,
    color: theme.colors.mutedForeground,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1.5),
  },
}));
