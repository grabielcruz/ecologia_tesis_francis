import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  QuarterlyGreenMetricFormInput,
  QuarterlyGreenMetricRecord,
} from "./types";

interface UseGreenMetricsParams {
  token: string | null;
  route: string;
  userRole?: string;
  setError: (message: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
}

const getInitialForm = (): QuarterlyGreenMetricFormInput => ({
  year: new Date().getFullYear(),
  quarter: 1,
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
  const [records, setRecords] = useState<QuarterlyGreenMetricRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formInput, setFormInput] = useState<QuarterlyGreenMetricFormInput>(
    getInitialForm(),
  );

  const getAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : undefined;

  const fetchQuarterlyRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/green-metrics", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        setRecords([]);
        setError("No se pudieron cargar las metricas trimestrales");
        return;
      }

      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch {
      setRecords([]);
      setError("No se pudieron cargar las metricas trimestrales");
    } finally {
      setIsLoading(false);
    }
  };

  const setFormValue = (
    field: keyof QuarterlyGreenMetricFormInput,
    value: number,
  ) => {
    setFormInput((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormInput(getInitialForm());
  };

  const saveQuarterlyRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Debes iniciar sesion para registrar metricas");
      return;
    }

    if (userRole !== "admin") {
      setError("Solo los administradores pueden registrar metricas");
      return;
    }

    if (![1, 2, 3, 4].includes(formInput.quarter)) {
      setError("Selecciona un trimestre valido");
      return;
    }

    if (formInput.year < 2000 || formInput.year > 2200) {
      setError("Ingresa un ano valido");
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
        setError(data.error || "No se pudieron guardar las metricas");
        return;
      }

      const saved = (await response.json()) as QuarterlyGreenMetricRecord;

      setRecords((prev) => {
        const withoutSamePeriod = prev.filter(
          (item) => !(item.year === saved.year && item.quarter === saved.quarter),
        );

        return [saved, ...withoutSamePeriod].sort((left, right) => {
          if (left.year !== right.year) {
            return right.year - left.year;
          }
          return right.quarter - left.quarter;
        });
      });

      setSuccessMessage(
        `Metricas guardadas para T${saved.quarter} ${saved.year}.`,
      );
      setError(null);
      resetForm();
    } catch {
      setError("No se pudieron guardar las metricas");
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
    fetchQuarterlyRecords();
  }, [route, token]);

  return {
    records,
    latestRecord,
    isSubmitting,
    isLoading,
    formInput,
    setFormValue,
    saveQuarterlyRecord,
  };
}
