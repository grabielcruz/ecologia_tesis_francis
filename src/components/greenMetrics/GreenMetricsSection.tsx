import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppModal } from "../AppModal";
import {
  GreenMetricFormInput,
  GreenMetricRecord,
} from "../../features/greenMetrics/types";

interface GreenMetricsSectionProps {
  records: GreenMetricRecord[];
  latestRecord: GreenMetricRecord | null;
  formInput: GreenMetricFormInput;
  isSubmitting: boolean;
  isLoading: boolean;
  userRole?: string;
  onSetFormValue: (
    field: keyof GreenMetricFormInput,
    value: number | string,
  ) => void;
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

type MetricKey = MetricDefinition["key"];

const metricDefinitions: MetricDefinition[] = [
  {
    key: "metric1GreenAreaRatio",
    title: "M1. Proporción de área verde",
    formula: "Área verde / Área total del campus",
    unit: "%",
  },
  {
    key: "metric2GreenAreaPerCapita",
    title: "M2. Área verde por persona",
    formula: "Área verde / Población del campus",
    unit: "m2/persona",
  },
  {
    key: "metric3DenseVegetationRatio",
    title: "M3. Cobertura de bosque o vegetación densa",
    formula: "Área de bosque denso / Área total del campus",
    unit: "%",
  },
  {
    key: "metric4RainwaterAbsorptionRatio",
    title: "M4. Área para absorción de lluvia",
    formula: "Área de absorción / Área total del campus",
    unit: "%",
  },
  {
    key: "metric5SustainabilityBudgetShare",
    title: "M5. Presupuesto de sostenibilidad",
    formula: "Presupuesto sostenibilidad / (Sostenibilidad + conservación)",
    unit: "%",
  },
  {
    key: "metric6ConservationOperationShare",
    title: "M6. Operación y mantenimiento ambiental",
    formula: "Presupuesto conservación / (Sostenibilidad + conservación)",
    unit: "%",
  },
];

const formatNumber = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);

const formatPeriod = (record: GreenMetricRecord) =>
  new Date(record.calculationDate).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export function GreenMetricsSection({
  records,
  formInput,
  isSubmitting,
  isLoading,
  userRole,
  onSetFormValue,
  onSave,
}: GreenMetricsSectionProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [selectedMetricKey, setSelectedMetricKey] = useState<MetricKey>(
    "metric1GreenAreaRatio",
  );
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    if (!records.length) {
      setSelectedRecordId(null);
      return;
    }

    setSelectedRecordId((prev) => {
      if (prev && records.some((record) => record.id === prev)) {
        return prev;
      }
      return records[0].id;
    });
  }, [records]);

  const selectedRecord = useMemo(() => {
    if (!selectedRecordId) return null;
    return records.find((record) => record.id === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  const selectedMetric =
    metricDefinitions.find((metric) => metric.key === selectedMetricKey) ||
    metricDefinitions[0];

  const metricRows = useMemo(() => {
    const startTimestamp = filterStartDate
      ? new Date(`${filterStartDate}T00:00:00`).getTime()
      : null;
    const endTimestamp = filterEndDate
      ? new Date(`${filterEndDate}T23:59:59`).getTime()
      : null;

    return [...records]
      .filter((record) => {
        const ts = new Date(record.calculationDate).getTime();
        if (Number.isNaN(ts)) return false;
        if (startTimestamp !== null && ts < startTimestamp) return false;
        if (endTimestamp !== null && ts > endTimestamp) return false;
        return true;
      })
      .sort(
        (left, right) =>
          new Date(left.calculationDate).getTime() -
          new Date(right.calculationDate).getTime(),
      );
  }, [records, filterStartDate, filterEndDate]);

  const chartData = metricRows.map((record) => ({
    id: record.id,
    dateLabel: formatPeriod(record),
    value: record.metrics[selectedMetric.key],
  }));

  const chartWidth = 760;
  const chartHeight = 280;
  const padding = 36;
  const valueMin = chartData.length
    ? Math.min(...chartData.map((entry) => entry.value))
    : 0;
  const valueMax = chartData.length
    ? Math.max(...chartData.map((entry) => entry.value))
    : 0;
  const valueRange = valueMax - valueMin || 1;
  const xSpan = Math.max(1, chartData.length - 1);

  const points = chartData
    .map((entry, index) => {
      const x = padding + (index * (chartWidth - padding * 2)) / xSpan;
      const y =
        chartHeight -
        padding -
        ((entry.value - valueMin) / valueRange) * (chartHeight - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <section className="box green-metrics-box">
      <article className="principal-panel green-metrics-header">
        <div>
          <h3>Cálculos GreenMetric</h3>
          <p>
            Consulta por registro o por indicador, y compara tendencias por
            fecha.
          </p>
        </div>
        {userRole === "admin" ? (
          <button type="button" onClick={() => setShowCreateModal(true)}>
            Nuevo cálculo
          </button>
        ) : null}
      </article>

      <article className="principal-panel">
        <h3>1) Consulta por registro</h3>
        {records.length === 0 ? (
          <p>
            {isLoading
              ? "Cargando métricas..."
              : "Aún no hay registros cargados."}
          </p>
        ) : (
          <div className="green-metric-record-view">
            <label>
              Selecciona un registro
              <select
                value={selectedRecordId ?? ""}
                onChange={(event) =>
                  setSelectedRecordId(Number(event.target.value) || null)
                }
              >
                {records.map((record) => (
                  <option key={record.id} value={record.id}>
                    {formatPeriod(record)} - Registro #{record.id}
                  </option>
                ))}
              </select>
            </label>

            {selectedRecord ? (
              <div className="green-metric-record-details">
                <div className="green-metric-base-grid">
                  <article className="summary-item">
                    <span>Fecha de cálculo</span>
                    <strong>{formatPeriod(selectedRecord)}</strong>
                  </article>
                  <article className="summary-item">
                    <span>Área total campus</span>
                    <strong>
                      {formatNumber(selectedRecord.totalCampusAreaM2)} m2
                    </strong>
                  </article>
                  <article className="summary-item">
                    <span>Área verde</span>
                    <strong>
                      {formatNumber(selectedRecord.greenAreaM2)} m2
                    </strong>
                  </article>
                  <article className="summary-item">
                    <span>Población campus</span>
                    <strong>
                      {formatNumber(selectedRecord.campusPopulation, 0)}
                    </strong>
                  </article>
                  <article className="summary-item">
                    <span>Área bosque denso</span>
                    <strong>
                      {formatNumber(selectedRecord.denseVegetationAreaM2)} m2
                    </strong>
                  </article>
                  <article className="summary-item">
                    <span>Área absorción lluvia</span>
                    <strong>
                      {formatNumber(selectedRecord.rainwaterAbsorptionAreaM2)}{" "}
                      m2
                    </strong>
                  </article>
                </div>

                <div className="green-metrics-cards">
                  {metricDefinitions.map((metric) => {
                    const value = selectedRecord.metrics[metric.key];
                    return (
                      <article key={metric.key} className="summary-item">
                        <span>{metric.title}</span>
                        <strong>
                          {formatNumber(
                            value,
                            metric.unit === "m2/persona" ? 3 : 2,
                          )}{" "}
                          {metric.unit}
                        </strong>
                        <small className="muted">{metric.formula}</small>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </article>

      <article className="principal-panel">
        <h3>2) Consulta por indicador</h3>
        <div className="green-metric-filters">
          <label>
            Indicador
            <select
              value={selectedMetricKey}
              onChange={(event) =>
                setSelectedMetricKey(event.target.value as MetricKey)
              }
            >
              {metricDefinitions.map((metric) => (
                <option key={metric.key} value={metric.key}>
                  {metric.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fecha desde
            <input
              type="date"
              value={filterStartDate}
              onChange={(event) => setFilterStartDate(event.target.value)}
            />
          </label>
          <label>
            Fecha hasta
            <input
              type="date"
              value={filterEndDate}
              onChange={(event) => setFilterEndDate(event.target.value)}
            />
          </label>
        </div>

        {metricRows.length === 0 ? (
          <p>
            {isLoading
              ? "Cargando histórico..."
              : "No hay datos para el filtro seleccionado."}
          </p>
        ) : (
          <>
            <div className="green-metric-table-wrap">
              <table className="default-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Registro</th>
                    <th>{selectedMetric.title}</th>
                    <th>Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {metricRows.map((record) => (
                    <tr key={`metric-row-${record.id}`}>
                      <td>{formatPeriod(record)}</td>
                      <td>#{record.id}</td>
                      <td>
                        {formatNumber(
                          record.metrics[selectedMetric.key],
                          selectedMetric.unit === "m2/persona" ? 3 : 2,
                        )}
                      </td>
                      <td>{selectedMetric.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="green-metric-chart-card">
              <h4>Tendencia: {selectedMetric.title}</h4>
              <p className="muted">{selectedMetric.formula}</p>
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="green-metric-chart"
              >
                <line
                  x1={padding}
                  y1={chartHeight - padding}
                  x2={chartWidth - padding}
                  y2={chartHeight - padding}
                  stroke="#c5d8d6"
                  strokeWidth="1"
                />
                <line
                  x1={padding}
                  y1={padding}
                  x2={padding}
                  y2={chartHeight - padding}
                  stroke="#c5d8d6"
                  strokeWidth="1"
                />
                {chartData.length > 1 ? (
                  <polyline
                    fill="none"
                    stroke="#1e7770"
                    strokeWidth="3"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={points}
                  />
                ) : null}
                {chartData.map((entry, index) => {
                  const x =
                    padding + (index * (chartWidth - padding * 2)) / xSpan;
                  const y =
                    chartHeight -
                    padding -
                    ((entry.value - valueMin) / valueRange) *
                      (chartHeight - padding * 2);
                  return (
                    <g key={`metric-point-${entry.id}`}>
                      <circle cx={x} cy={y} r="4" fill="#134f4a" />
                      <text
                        x={x}
                        y={chartHeight - 12}
                        textAnchor="middle"
                        className="chart-axis-label"
                      >
                        {entry.dateLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </>
        )}
      </article>

      <AppModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nuevo cálculo GreenMetric"
        description="Carga una fecha y los datos base para calcular los 6 indicadores."
      >
        <form className="admin-form" onSubmit={onSave}>
          <label>
            Fecha de cálculo
            <input
              type="date"
              value={formInput.calculationDate}
              onChange={(event) =>
                onSetFormValue("calculationDate", event.target.value)
              }
              required
            />
          </label>

          <div className="field-row">
            <label>
              Área total del campus (m2)
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
              Área verde (m2)
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
              Población total del campus
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
              Área de bosque o vegetación densa (m2)
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
              Área de absorción de agua de lluvia (m2)
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
            Presupuesto de operación y mantenimiento ambiental
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
              {isSubmitting ? "Guardando..." : "Guardar cálculo"}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cerrar
            </button>
          </div>
        </form>
      </AppModal>
    </section>
  );
}
