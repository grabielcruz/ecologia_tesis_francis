import { FormEvent } from "react";
import {
  QuarterlyGreenMetricFormInput,
  QuarterlyGreenMetricRecord,
} from "../../features/greenMetrics/types";

interface GreenMetricsSectionProps {
  records: QuarterlyGreenMetricRecord[];
  latestRecord: QuarterlyGreenMetricRecord | null;
  formInput: QuarterlyGreenMetricFormInput;
  isSubmitting: boolean;
  isLoading: boolean;
  userRole?: string;
  onSetFormValue: (field: keyof QuarterlyGreenMetricFormInput, value: number) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
}

interface MetricDefinition {
  key:
    | "metric1GreenAreaRatio"
    | "metric2GreenAreaPerCapita"
    | "metric3DenseVegetationRatio"
    | "metric4RainwaterAbsorptionRatio"
    | "metric5SustainabilityBudgetShare"
    | "metric6ConservationOperationShare";
  title: string;
  formula: string;
  unit: string;
}

const metricDefinitions: MetricDefinition[] = [
  {
    key: "metric1GreenAreaRatio",
    title: "M1. Proporcion de area verde",
    formula: "Area verde / Area total del campus",
    unit: "%",
  },
  {
    key: "metric2GreenAreaPerCapita",
    title: "M2. Area verde por persona",
    formula: "Area verde / Poblacion del campus",
    unit: "m2/persona",
  },
  {
    key: "metric3DenseVegetationRatio",
    title: "M3. Cobertura de bosque o vegetacion densa",
    formula: "Area de bosque denso / Area total del campus",
    unit: "%",
  },
  {
    key: "metric4RainwaterAbsorptionRatio",
    title: "M4. Area para absorcion de lluvia",
    formula: "Area de absorcion / Area total del campus",
    unit: "%",
  },
  {
    key: "metric5SustainabilityBudgetShare",
    title: "M5. Presupuesto de sostenibilidad",
    formula: "Presupuesto sostenibilidad / (Sostenibilidad + conservacion)",
    unit: "%",
  },
  {
    key: "metric6ConservationOperationShare",
    title: "M6. Operacion y mantenimiento ambiental",
    formula: "Presupuesto conservacion / (Sostenibilidad + conservacion)",
    unit: "%",
  },
];

const formatNumber = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);

const formatPeriod = (record: QuarterlyGreenMetricRecord) =>
  `T${record.quarter} ${record.year}`;

export function GreenMetricsSection({
  records,
  latestRecord,
  formInput,
  isSubmitting,
  isLoading,
  userRole,
  onSetFormValue,
  onSave,
}: GreenMetricsSectionProps) {
  return (
    <section className="box green-metrics-box">
      <article className="principal-panel">
        <h3>Reporte trimestral GreenMetric</h3>
        <p>
          Registra los datos institucionales cada 3 meses y el sistema calcula
          automaticamente los indicadores clave de sostenibilidad.
        </p>
      </article>

      <article className="principal-panel">
        <h3>Cargar datos de un trimestre</h3>
        {userRole === "admin" ? (
          <form className="admin-form" onSubmit={onSave}>
            <div className="field-row">
              <label>
                Ano
                <input
                  type="number"
                  min={2000}
                  max={2200}
                  value={formInput.year}
                  onChange={(event) =>
                    onSetFormValue("year", Number(event.target.value) || 0)
                  }
                  required
                />
              </label>
              <label>
                Trimestre
                <select
                  value={formInput.quarter}
                  onChange={(event) =>
                    onSetFormValue("quarter", Number(event.target.value) || 1)
                  }
                >
                  <option value={1}>T1 (Ene - Mar)</option>
                  <option value={2}>T2 (Abr - Jun)</option>
                  <option value={3}>T3 (Jul - Sep)</option>
                  <option value={4}>T4 (Oct - Dic)</option>
                </select>
              </label>
            </div>

            <div className="field-row">
              <label>
                Area total del campus (m2)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formInput.totalCampusAreaM2}
                  onChange={(event) =>
                    onSetFormValue(
                      "totalCampusAreaM2",
                      Number(event.target.value) || 0,
                    )
                  }
                  required
                />
              </label>
              <label>
                Area verde (m2)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formInput.greenAreaM2}
                  onChange={(event) =>
                    onSetFormValue("greenAreaM2", Number(event.target.value) || 0)
                  }
                  required
                />
              </label>
            </div>

            <div className="field-row">
              <label>
                Poblacion total del campus
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={formInput.campusPopulation}
                  onChange={(event) =>
                    onSetFormValue(
                      "campusPopulation",
                      Number(event.target.value) || 0,
                    )
                  }
                  required
                />
              </label>
              <label>
                Area de bosque o vegetacion densa (m2)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formInput.denseVegetationAreaM2}
                  onChange={(event) =>
                    onSetFormValue(
                      "denseVegetationAreaM2",
                      Number(event.target.value) || 0,
                    )
                  }
                  required
                />
              </label>
            </div>

            <div className="field-row">
              <label>
                Area de absorcion de agua de lluvia (m2)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formInput.rainwaterAbsorptionAreaM2}
                  onChange={(event) =>
                    onSetFormValue(
                      "rainwaterAbsorptionAreaM2",
                      Number(event.target.value) || 0,
                    )
                  }
                  required
                />
              </label>
              <label>
                Presupuesto de sostenibilidad
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={formInput.sustainabilityBudget}
                  onChange={(event) =>
                    onSetFormValue(
                      "sustainabilityBudget",
                      Number(event.target.value) || 0,
                    )
                  }
                  required
                />
              </label>
            </div>

            <label>
              Presupuesto de operacion y mantenimiento ambiental
              <input
                type="number"
                min={0}
                step="0.01"
                value={formInput.conservationOperationBudget}
                onChange={(event) =>
                  onSetFormValue(
                    "conservationOperationBudget",
                    Number(event.target.value) || 0,
                  )
                }
                required
              />
            </label>

            <div className="button-row">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar trimestre"}
              </button>
            </div>
          </form>
        ) : (
          <p>Solo los administradores pueden registrar o actualizar metricas.</p>
        )}
      </article>

      <article className="principal-panel">
        <h3>Ultimo calculo</h3>
        {!latestRecord ? (
          <p>{isLoading ? "Cargando metricas..." : "Aun no hay datos cargados."}</p>
        ) : (
          <div className="green-metrics-cards">
            {metricDefinitions.map((metric) => {
              const value = latestRecord.metrics[metric.key];
              return (
                <article key={metric.key} className="summary-item">
                  <span>{metric.title}</span>
                  <strong>
                    {formatNumber(value, metric.unit === "m2/persona" ? 3 : 2)} {metric.unit}
                  </strong>
                  <small className="muted">{metric.formula}</small>
                </article>
              );
            })}
          </div>
        )}
      </article>

      <article className="principal-panel">
        <h3>Historico por indicador</h3>
        {records.length === 0 ? (
          <p>{isLoading ? "Cargando historico..." : "No hay historial disponible."}</p>
        ) : (
          <div className="green-metric-history-grid">
            {metricDefinitions.map((metric) => (
              <section key={`history-${metric.key}`} className="metric-history-card">
                <h4>{metric.title}</h4>
                <p className="muted">{metric.formula}</p>
                <ul>
                  {records.map((record) => {
                    const value = record.metrics[metric.key];
                    return (
                      <li key={`${metric.key}-${record.id}`}>
                        <span>{formatPeriod(record)}</span>
                        <strong>
                          {formatNumber(
                            value,
                            metric.unit === "m2/persona" ? 3 : 2,
                          )} {metric.unit}
                        </strong>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
