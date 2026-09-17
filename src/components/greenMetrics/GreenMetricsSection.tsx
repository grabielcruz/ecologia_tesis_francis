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

const escapeSvgText = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildMetricChartSvg = (
  metric: MetricDefinition,
  sortedRecords: GreenMetricRecord[],
) => {
  const width = 1400;
  const height = 560;
  const left = 120;
  const right = 72;
  const top = 60;
  const bottom = 110;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;

  const entries = sortedRecords.map((record) => ({
    id: record.id,
    value: record.metrics[metric.key],
    label: formatPeriod(record),
  }));

  const minValue = entries.length
    ? Math.min(...entries.map((entry) => entry.value))
    : 0;
  const maxValue = entries.length
    ? Math.max(...entries.map((entry) => entry.value))
    : 1;
  const range = maxValue - minValue || 1;
  const xSpan = Math.max(1, entries.length - 1);

  const points = entries.map((entry, index) => {
    const x = left + (index * innerWidth) / xSpan;
    const y =
      top + innerHeight - ((entry.value - minValue) / range) * innerHeight;
    return { ...entry, x, y };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const yGrid = ticks
    .map((tick) => {
      const y = top + innerHeight - tick * innerHeight;
      const valueLabel = formatNumber(
        minValue + range * tick,
        metric.unit === "m2/persona" ? 3 : 2,
      );
      return `
        <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="#d6e6e4" stroke-width="1" />
        <text x="${left - 18}" y="${y + 5}" text-anchor="end" font-size="16" fill="#3e5b58">${escapeSvgText(valueLabel)}</text>
      `;
    })
    .join("\n");

  const xLabels = entries
    .map((entry, index) => {
      const showLabel =
        entries.length <= 8 ||
        index === 0 ||
        index === entries.length - 1 ||
        index % Math.ceil(entries.length / 6) === 0;
      if (!showLabel) {
        return "";
      }
      const x = left + (index * innerWidth) / xSpan;
      return `
        <text x="${x}" y="${height - 40}" text-anchor="middle" font-size="15" fill="#3e5b58">${escapeSvgText(entry.label)}</text>
      `;
    })
    .join("\n");

  const pointsMarkup = points
    .map(
      (point) => `
      <circle cx="${point.x}" cy="${point.y}" r="5" fill="#155d56" />
    `,
    )
    .join("\n");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
      ${yGrid}
      <line x1="${left}" y1="${top}" x2="${left}" y2="${top + innerHeight}" stroke="#8eb6b1" stroke-width="2" />
      <line x1="${left}" y1="${top + innerHeight}" x2="${width - right}" y2="${top + innerHeight}" stroke="#8eb6b1" stroke-width="2" />
      ${polyline ? `<polyline fill="none" stroke="#1e7770" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" points="${polyline}" />` : ""}
      ${pointsMarkup}
      ${xLabels}
      <text x="${left}" y="28" font-size="24" font-weight="700" fill="#0f4f49">${escapeSvgText(metric.title)}</text>
      <text x="${left}" y="54" font-size="16" fill="#35514e">${escapeSvgText(metric.formula)} (${escapeSvgText(metric.unit)})</text>
    </svg>
  `;
};

const svgToPngDataUrl = async (svgMarkup: string) => {
  const svgBlob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const createdImage = new Image();
      createdImage.onload = () => resolve(createdImage);
      createdImage.onerror = () =>
        reject(new Error("No se pudo cargar el gráfico SVG"));
      createdImage.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("No se pudo preparar el lienzo para el gráfico");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);

    return canvas.toDataURL("image/png", 1);
  } finally {
    URL.revokeObjectURL(url);
  }
};

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
  const [showReportRangeModal, setShowReportRangeModal] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [selectedMetricKey, setSelectedMetricKey] = useState<MetricKey>(
    "metric1GreenAreaRatio",
  );
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [reportRangeMode, setReportRangeMode] = useState<"all-time" | "custom">(
    "all-time",
  );
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

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

  const onDownloadMetricTablePdf = async () => {
    if (!metricRows.length) {
      return;
    }

    const formatMetricValueWithUnit = (value: number) => {
      const decimals = selectedMetric.unit === "m2/persona" ? 3 : 2;
      return `${formatNumber(value, decimals)} ${selectedMetric.unit}`;
    };

    const rangeLabel =
      metricRows.length > 1
        ? `${formatPeriod(metricRows[0])} a ${formatPeriod(
            metricRows[metricRows.length - 1],
          )}`
        : formatPeriod(metricRows[0]);

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      doc.setFontSize(14);
      doc.text(`GreenMetric - ${selectedMetric.title}`, 40, 38);
      doc.setFontSize(9);
      doc.setTextColor(78, 103, 99);
      doc.text(`Fórmula: ${selectedMetric.formula}`, 40, 52);
      doc.text(`Rango: ${rangeLabel}`, 40, 66);

      const chartSvg = buildMetricChartSvg(selectedMetric, metricRows);
      const chartImage = await svgToPngDataUrl(chartSvg);
      const pageWidth = doc.internal.pageSize.getWidth();
      const chartWidth = pageWidth - 80;
      const chartHeight = (chartWidth * 560) / 1400;

      doc.addImage(chartImage, "PNG", 40, 78, chartWidth, chartHeight);

      autoTable(doc, {
        startY: 78 + chartHeight + 14,
        head: [["Fecha", "Registro", selectedMetric.title]],
        body: metricRows.map((record) => [
          formatPeriod(record),
          `#${record.id}`,
          formatMetricValueWithUnit(record.metrics[selectedMetric.key]),
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 5,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [63, 173, 147],
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [243, 251, 249],
        },
        margin: {
          left: 28,
          right: 28,
        },
      });

      doc.save(`greenmetric-${selectedMetric.key}.pdf`);
    } catch (error) {
      console.error("No se pudo generar el PDF de métricas", error);
    }
  };

  const generateAllGreenMetricsPdf = async (
    recordsToExport: GreenMetricRecord[],
    rangeLabel: string,
  ) => {
    const sortedRecords = [...recordsToExport].sort(
      (left, right) =>
        new Date(left.calculationDate).getTime() -
        new Date(right.calculationDate).getTime(),
    );

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      doc.setFontSize(14);
      doc.text("GreenMetric - Reporte completo", 40, 38);
      doc.setFontSize(9);
      doc.setTextColor(78, 103, 99);
      doc.text(`Generado: ${new Date().toLocaleString("es-AR")}`, 40, 52);
      doc.text(`Rango de datos: ${rangeLabel}`, 320, 52);

      autoTable(doc, {
        startY: 62,
        head: [["Indicador", "Significado", "Fórmula"]],
        body: metricDefinitions.map((metric) => [
          metric.title.split(".")[0],
          `${metric.title.split(". ")[1] ?? metric.title} (${metric.unit})`,
          metric.formula,
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 4,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [63, 173, 147],
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [243, 251, 249],
        },
        margin: {
          left: 28,
          right: 28,
        },
      });

      const firstTableFinalY = (doc as { lastAutoTable?: { finalY: number } })
        .lastAutoTable?.finalY;

      autoTable(doc, {
        startY: (firstTableFinalY ?? 62) + 10,
        head: [
          [
            "#",
            "Registro",
            "Fecha cálculo",
            "Área total campus (m2)",
            "Área verde (m2)",
            "Población campus",
            "Área bosque denso (m2)",
            "Área absorción lluvia (m2)",
            "Presupuesto sostenibilidad",
            "Presupuesto conservación",
            "M1 (%)",
            "M2 (m2/persona)",
            "M3 (%)",
            "M4 (%)",
            "M5 (%)",
            "M6 (%)",
          ],
        ],
        body: sortedRecords.map((record, index) => [
          index + 1,
          `#${record.id}`,
          formatPeriod(record),
          formatNumber(record.totalCampusAreaM2),
          formatNumber(record.greenAreaM2),
          formatNumber(record.campusPopulation, 0),
          formatNumber(record.denseVegetationAreaM2),
          formatNumber(record.rainwaterAbsorptionAreaM2),
          formatNumber(record.sustainabilityBudget),
          formatNumber(record.conservationOperationBudget),
          formatNumber(record.metrics.metric1GreenAreaRatio),
          formatNumber(record.metrics.metric2GreenAreaPerCapita, 3),
          formatNumber(record.metrics.metric3DenseVegetationRatio),
          formatNumber(record.metrics.metric4RainwaterAbsorptionRatio),
          formatNumber(record.metrics.metric5SustainabilityBudgetShare),
          formatNumber(record.metrics.metric6ConservationOperationShare),
        ]),
        styles: {
          fontSize: 8,
          cellPadding: 5,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [63, 173, 147],
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [243, 251, 249],
        },
        margin: {
          left: 28,
          right: 28,
        },
      });

      for (const metric of metricDefinitions) {
        doc.addPage("a4", "landscape");
        doc.setFontSize(13);
        doc.setTextColor(20, 62, 57);
        doc.text(`Tendencia ${metric.title}`, 40, 40);
        doc.setFontSize(9);
        doc.setTextColor(78, 103, 99);
        doc.text(`${metric.formula} (${metric.unit})`, 40, 55);

        const svg = buildMetricChartSvg(metric, sortedRecords);
        const imageDataUrl = await svgToPngDataUrl(svg);

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const imageWidth = pageWidth - 80;
        const imageHeight = Math.min(
          pageHeight - 100,
          (imageWidth * 560) / 1400,
        );

        doc.addImage(imageDataUrl, "PNG", 40, 70, imageWidth, imageHeight);
      }

      doc.save("greenmetric-reporte-completo.pdf");
    } catch (error) {
      console.error("No se pudo generar el PDF completo de GreenMetric", error);
    }
  };

  const onConfirmDownloadAllGreenMetricsPdf = async () => {
    if (!records.length) {
      setShowReportRangeModal(false);
      return;
    }

    if (reportRangeMode === "all-time") {
      await generateAllGreenMetricsPdf(records, "Todo el historial");
      setShowReportRangeModal(false);
      return;
    }

    const startTimestamp = reportStartDate
      ? new Date(`${reportStartDate}T00:00:00`).getTime()
      : null;
    const endTimestamp = reportEndDate
      ? new Date(`${reportEndDate}T23:59:59`).getTime()
      : null;

    if (startTimestamp === null || endTimestamp === null) {
      return;
    }

    if (startTimestamp > endTimestamp) {
      return;
    }

    const filteredRecords = records.filter((record) => {
      const ts = new Date(record.calculationDate).getTime();
      if (Number.isNaN(ts)) return false;
      if (ts < startTimestamp) return false;
      if (ts > endTimestamp) return false;
      return true;
    });

    if (!filteredRecords.length) {
      return;
    }

    const startLabel = new Date(
      `${reportStartDate}T00:00:00`,
    ).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const endLabel = new Date(`${reportEndDate}T00:00:00`).toLocaleDateString(
      "es-AR",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );

    await generateAllGreenMetricsPdf(
      filteredRecords,
      `${startLabel} a ${endLabel}`,
    );
    setShowReportRangeModal(false);
  };

  const isCustomRangeIncomplete =
    reportRangeMode === "custom" && (!reportStartDate || !reportEndDate);
  const isCustomRangeInvalid =
    reportRangeMode === "custom" &&
    !!reportStartDate &&
    !!reportEndDate &&
    new Date(`${reportStartDate}T00:00:00`).getTime() >
      new Date(`${reportEndDate}T23:59:59`).getTime();

  const customRangeRecordsCount = useMemo(() => {
    if (reportRangeMode !== "custom") return records.length;
    if (!reportStartDate || !reportEndDate) return 0;

    const startTimestamp = new Date(`${reportStartDate}T00:00:00`).getTime();
    const endTimestamp = new Date(`${reportEndDate}T23:59:59`).getTime();
    if (startTimestamp > endTimestamp) return 0;

    return records.filter((record) => {
      const ts = new Date(record.calculationDate).getTime();
      if (Number.isNaN(ts)) return false;
      return ts >= startTimestamp && ts <= endTimestamp;
    }).length;
  }, [records, reportRangeMode, reportStartDate, reportEndDate]);

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
        <div className="button-row">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setShowReportRangeModal(true);
            }}
            disabled={records.length === 0}
          >
            Descargar PDF completo
          </button>
          {userRole === "admin" ? (
            <button type="button" onClick={() => setShowCreateModal(true)}>
              Nuevo cálculo
            </button>
          ) : null}
        </div>
      </article>

      <AppModal
        isOpen={showReportRangeModal}
        onClose={() => setShowReportRangeModal(false)}
        title="Descargar reporte GreenMetric"
        description="Selecciona el rango de fechas para incluir en el reporte completo PDF."
      >
        <div className="admin-form">
          <label>
            Alcance del reporte
            <select
              value={reportRangeMode}
              onChange={(event) =>
                setReportRangeMode(event.target.value as "all-time" | "custom")
              }
            >
              <option value="all-time">Todo el historial</option>
              <option value="custom">Rango personalizado</option>
            </select>
          </label>

          {reportRangeMode === "custom" ? (
            <>
              <div className="field-row">
                <label>
                  Fecha desde
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(event) => setReportStartDate(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Fecha hasta
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(event) => setReportEndDate(event.target.value)}
                    required
                  />
                </label>
              </div>

              {isCustomRangeInvalid ? (
                <p className="muted">
                  La fecha inicial no puede ser mayor que la fecha final.
                </p>
              ) : null}

              {!isCustomRangeIncomplete && !isCustomRangeInvalid ? (
                <p className="muted">
                  Registros incluidos: {customRangeRecordsCount}
                </p>
              ) : null}

              {!isCustomRangeIncomplete &&
              !isCustomRangeInvalid &&
              customRangeRecordsCount === 0 ? (
                <p className="muted">
                  No hay registros para el rango seleccionado.
                </p>
              ) : null}
            </>
          ) : (
            <p className="muted">
              Se incluirán todos los registros disponibles.
            </p>
          )}

          <div className="button-row">
            <button
              type="button"
              className="secondary"
              onClick={() => setShowReportRangeModal(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                void onConfirmDownloadAllGreenMetricsPdf();
              }}
              disabled={
                isCustomRangeIncomplete ||
                isCustomRangeInvalid ||
                (reportRangeMode === "custom" && customRangeRecordsCount === 0)
              }
            >
              Generar PDF
            </button>
          </div>
        </div>
      </AppModal>

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
            <div className="green-metric-results-toolbar">
              <p className="muted">
                Registros mostrados: <strong>{metricRows.length}</strong>
              </p>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  void onDownloadMetricTablePdf();
                }}
              >
                Descargar PDF
              </button>
            </div>
            <div className="green-metric-table-wrap">
              <table className="standard-table">
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
