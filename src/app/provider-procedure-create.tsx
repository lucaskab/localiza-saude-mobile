import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth";
import {
  useCreateProcedure,
  useDeleteProcedure,
  useProcedure,
  useUpdateProcedure,
} from "@/hooks/use-procedures";
import { getErrorMessage } from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Briefcase, Clock, DollarSign } from "lucide-react-native";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { z } from "zod";

type CreateProcedureFormData = {
  name: string;
  description: string;
  durationInMinutes: string;
  price: string;
};

const createProcedureDefaultValues: CreateProcedureFormData = {
  name: "",
  description: "",
  durationInMinutes: "30",
  price: "",
};

const createProcedureSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  durationInMinutes: z.number().int().min(1),
  priceInCents: z.number().int().min(0),
});

export default function ProviderProcedureCreate() {
  const { theme } = useUnistyles();
  const { t } = useTranslation();
  const router = useRouter();
  const { procedureId } = useLocalSearchParams<{ procedureId?: string }>();
  const { healthcareProvider } = useAuth();
  const isEditing = !!procedureId;
  const createProcedureMutation = useCreateProcedure();
  const updateProcedureMutation = useUpdateProcedure();
  const deleteProcedureMutation = useDeleteProcedure();
  const {
    data: procedureData,
    isLoading,
    error,
    refetch,
  } = useProcedure(procedureId || "", isEditing);
  const isPending =
    createProcedureMutation.isPending ||
    updateProcedureMutation.isPending ||
    deleteProcedureMutation.isPending;

  const { control, handleSubmit, reset } = useForm<CreateProcedureFormData>({
    defaultValues: createProcedureDefaultValues,
  });

  useEffect(() => {
    if (!isEditing) {
      reset(createProcedureDefaultValues);
      return;
    }

    if (!procedureData?.procedure) {
      return;
    }

    reset({
      name: procedureData.procedure.name,
      description: procedureData.procedure.description || "",
      durationInMinutes: procedureData.procedure.durationInMinutes.toString(),
      price: (procedureData.procedure.priceInCents / 100).toFixed(2),
    });
  }, [isEditing, procedureData, reset]);

  const onSubmit = async (values: CreateProcedureFormData) => {
    const providerId = healthcareProvider?.id;

    if (!providerId) {
      Alert.alert(t("common.error"), t("common.providerProfileRequired"));
      return;
    }

    const durationInMinutes = Number.parseInt(
      values.durationInMinutes.replace(/[^0-9]/g, ""),
      10,
    );
    const priceInCents = Math.round((parseFloat(values.price) || 0) * 100);
    const parsed = createProcedureSchema.safeParse({
      name: values.name,
      description: values.description,
      durationInMinutes: Number.isFinite(durationInMinutes)
        ? durationInMinutes
        : 0,
      priceInCents,
    });

    if (!parsed.success) {
      Alert.alert(
        t("common.validationError"),
        t("common.pleaseReviewTheAppointment"),
      );
      return;
    }

    try {
      const data = {
        name: parsed.data.name,
        description: parsed.data.description || null,
        priceInCents: parsed.data.priceInCents,
        durationInMinutes: parsed.data.durationInMinutes,
      };

      if (isEditing && procedureId) {
        await updateProcedureMutation.mutateAsync({
          procedureId,
          data,
        });
      } else {
        await createProcedureMutation.mutateAsync({
          ...data,
          healthcareProviderId: providerId,
        });
      }

      router.back();
    } catch (error) {
      Alert.alert(t("common.error"), getErrorMessage(error));
    }
  };

  const deleteProcedure = () => {
    if (!procedureId) {
      return;
    }

    Alert.alert(
      t("common.deleteProcedure"),
      t("common.areYouSureYouWantToDeleteThisProcedure"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProcedureMutation.mutateAsync(procedureId);
              router.back();
            } catch (error) {
              Alert.alert(t("common.error"), getErrorMessage(error));
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>
                {isEditing
                  ? t("common.editProcedure")
                  : t("common.addProcedure")}
              </Text>
              <Text style={styles.subtitle}>
                {t("common.manageProceduresDescription")}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Briefcase
                size={20}
                color={theme.colors.primary}
                strokeWidth={2}
              />
            </View>
          </View>

          {isEditing && isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>
                {t("common.loadingProcedures")}
              </Text>
            </View>
          ) : isEditing && error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {t("common.failedToLoadProfile")}
              </Text>
              <Button onPress={() => refetch()} size="sm">
                {t("common.retry")}
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  {t("common.name")} <Text style={styles.required}>*</Text>
                </Text>
                <Controller
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t("common.eGConsultation")}
                    />
                  )}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t("common.description")}</Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t("common.describeTheProcedure")}
                      multiline
                    />
                  )}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={styles.fieldGroupHalf}>
                  <Text style={styles.fieldLabel}>
                    {t("common.durationMinutes")}{" "}
                    <Text style={styles.required}>*</Text>
                  </Text>
                  <Controller
                    control={control}
                    name="durationInMinutes"
                    render={({ field }) => (
                      <Input
                        leftIcon={Clock}
                        value={field.value}
                        onChangeText={(text) =>
                          field.onChange(text.replace(/[^0-9]/g, ""))
                        }
                        placeholder="30"
                        keyboardType="number-pad"
                      />
                    )}
                  />
                </View>

                <View style={styles.fieldGroupHalf}>
                  <Text style={styles.fieldLabel}>
                    {t("common.priceBRL")}{" "}
                    <Text style={styles.required}>*</Text>
                  </Text>
                  <Controller
                    control={control}
                    name="price"
                    render={({ field }) => (
                      <Input
                        leftIcon={DollarSign}
                        value={field.value}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9.]/g, "");
                          const parts = cleaned.split(".");
                          field.onChange(
                            parts.length > 2
                              ? `${parts[0]}.${parts.slice(1).join("")}`
                              : cleaned,
                          );
                        }}
                        onBlur={() => {
                          const parsedValue = parseFloat(field.value) || 0;
                          field.onChange(parsedValue.toFixed(2));
                        }}
                        placeholder="0.00"
                        keyboardType="decimal-pad"
                      />
                    )}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {isEditing ? (
            <Button
              variant="destructive"
              disabled={isPending || isLoading || !!error}
              onPress={deleteProcedure}
              style={styles.footerIconButton}
            >
              {t("common.delete")}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            disabled={isPending}
            onPress={() => router.back()}
            style={styles.footerButton}
          >
            {t("common.cancel")}
          </Button>
          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isPending}
            disabled={isPending || (isEditing && (isLoading || !!error))}
            style={styles.footerButton}
          >
            <View style={styles.buttonContent}>
              {isPending ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primaryForeground}
                />
              ) : (
                <Text style={styles.submitText}>{t("common.save")}</Text>
              )}
            </View>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: theme.gap(3),
    gap: theme.gap(3),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.mutedForeground,
    marginTop: theme.gap(0.5),
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: theme.gap(3),
  },
  fieldGroup: {
    gap: theme.gap(1.5),
  },
  fieldRow: {
    flexDirection: "row",
    gap: theme.gap(2),
  },
  fieldGroupHalf: {
    flex: 1,
    gap: theme.gap(1.5),
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.foreground,
  },
  required: {
    color: theme.colors.destructive,
  },
  footer: {
    flexDirection: "row",
    gap: theme.gap(1.5),
    padding: theme.gap(2),
    paddingBottom: theme.gap(5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surfacePrimary,
  },
  footerButton: {
    flex: 1,
  },
  footerIconButton: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: theme.gap(6),
    alignItems: "center",
    justifyContent: "center",
    gap: theme.gap(2),
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
  },
  errorContainer: {
    paddingVertical: theme.gap(6),
    alignItems: "center",
    justifyContent: "center",
    gap: theme.gap(2),
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.destructive,
    textAlign: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(1),
  },
  submitText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primaryForeground,
  },
}));
