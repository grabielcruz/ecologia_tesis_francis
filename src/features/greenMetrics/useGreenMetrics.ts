import { FormEvent, useEffect, useMemo, useState } from "react";
import { GreenMetricFormInput, GreenMetricRecord } from "./types";

interface UseGreenMetricsParams {
  token: string | null;
  route: string;
  userRole?: string;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

const toDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getInitialForm = (): GreenMetricFormInput => ({
  calculationDate: toDateInputValue(),
  totalCampusAreaM2: 0,
  greenAreaM2: 0,
  campusPopulation: 0,
  denseVegetationAreaM2: 0,
  rainwaterAbsorptionAreaM2: 0,
  sustainabilityBudget: 0,
  conservationOperationBudget: 0,
});

export function useGreenMetrics({
  token,
  route,
  userRole,
  setError,
  setSuccessMessage,
}: UseGreenMetricsParams) {
  const [records, setRecords] = useState<GreenMetricRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formInput, setFormInput] =
    useState<GreenMetricFormInput>(getInitialForm());

  const getAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : undefined;

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/green-metrics", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        setRecords([]);
        setError("No se pudieron cargar las métricas");
        return;
      }

      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
      setError("No se pudieron cargar las métricas");
    } finally {
      setIsLoading(false);
    }
  };

  const setFormValue = (
    field: keyof GreenMetricFormInput,
    value: number | string,
  ) => {
    setFormInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormInput(getInitialForm());
  };

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Debes iniciar sesión para registrar métricas");
      return;
    }

    if (userRole !== "admin") {
      setError("Solo los administradores pueden registrar métricas");
      return;
    }

    if (!formInput.calculationDate) {
      setError("Selecciona una fecha de cálculo válida");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/green-metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formInput),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "No se pudieron guardar las métricas");
        return;
      }

      const saved = (await response.json()) as GreenMetricRecord;

      setRecords((prev) => {
        const withoutSameDate = prev.filter(
          (item) => item.calculationDate !== saved.calculationDate,
        );

        return [saved, ...withoutSameDate].sort(
          (left, right) =>
            new Date(right.calculationDate).getTime() -
            new Date(left.calculationDate).getTime(),
        );
      });

      setSuccessMessage(
        `Métricas guardadas para ${new Date(saved.calculationDate).toLocaleDateString("es-AR")}.`,
      );
      setError(null);
      resetForm();
    } catch {
      setError("No se pudieron guardar las métricas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const latestRecord = useMemo(() => {
    if (!records.length) return null;
    return records[0];
  }, [records]);

  useEffect(() => {
    if (route !== "/green-metrics") return;
    fetchRecords();
  }, [route, token]);

  return {
    records,
    latestRecord,
    isSubmitting,
    isLoading,
    formInput,
    setFormValue,
    saveRecord,
  };
}
