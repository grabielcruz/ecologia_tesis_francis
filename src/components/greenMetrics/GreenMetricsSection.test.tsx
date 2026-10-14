import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { GreenMetricsSection } from "./GreenMetricsSection";
import { GreenMetricRecord } from "../../features/greenMetrics/types";

const pdf = vi.hoisted(() => ({
  text: vi.fn(),
  save: vi.fn(),
  table: vi.fn(),
}));

vi.mock("jspdf", () => ({
  default: class {
    internal = { pageSize: { getWidth: () => 842 } };
    setFontSize = vi.fn();
    setTextColor = vi.fn();
    text = pdf.text;
    addImage = vi.fn();
    save = pdf.save;
  },
}));
vi.mock("jspdf-autotable", () => ({ default: pdf.table }));

const makeRecord = (id: number, calculationDate: string): GreenMetricRecord => ({
  id,
  calculationDate,
  totalCampusAreaM2: 1000,
  greenAreaM2: 100 * id,
  campusPopulation: 100,
  denseVegetationAreaM2: 50,
  rainwaterAbsorptionAreaM2: 40,
  sustainabilityBudget: 60,
  conservationOperationBudget: 40,
  metrics: {
    metric1GreenAreaRatio: 10 * id,
    metric2GreenAreaPerCapita: id,
    metric3DenseVegetationRatio: 5,
    metric4RainwaterAbsorptionRatio: 4,
    metric5SustainabilityBudgetShare: 60,
    metric6ConservationOperationShare: 40,
  },
  createdBy: null,
});

const records = [
  makeRecord(3, "2026-08-14T12:00:00"),
  makeRecord(2, "2026-05-14T12:00:00"),
  makeRecord(1, "2026-02-14T12:00:00"),
];
const props = {
  records,
  latestRecord: records[0],
  formInput: records[0],
  isSubmitting: false,
  isLoading: false,
  onSetFormValue: vi.fn(),
  onSave: vi.fn(),
};

const change = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
const resultRows = () => within(screen.getByRole("table")).getAllByRole("row").slice(1);
const selectComparison = () => {
  change("Tipo de consulta", "two-records");
  change("Primer registro", "3");
  change("Segundo registro", "1");
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GreenMetric indicator queries", () => {
  it("preserves the query panel height when switching modes and resets it on resize", () => {
    render(<GreenMetricsSection {...props} />);
    const panel = screen.getByRole("heading", { name: "2) Consulta por indicador" }).closest("article")!;
    vi.spyOn(panel, "getBoundingClientRect").mockReturnValue(
      new DOMRect(0, 0, 800, 700),
    );

    change("Tipo de consulta", "two-records");
    expect(panel).toHaveStyle({ minHeight: "700px" });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    change("Primer registro", "3");
    change("Segundo registro", "1");
    expect(panel).toHaveStyle({ minHeight: "700px" });
    change("Tipo de consulta", "date-range");
    expect(panel).toHaveStyle({ minHeight: "700px" });
    expect(resultRows()).toHaveLength(3);

    fireEvent(window, new Event("resize"));
    expect(panel.style.minHeight).toBe("");
  });

  it("keeps date-range queries as the default and preserves filters across modes", () => {
    render(<GreenMetricsSection {...props} />);
    expect(resultRows()).toHaveLength(3);
    change("Fecha desde", "2026-05-01");
    change("Fecha hasta", "2026-05-31");
    expect(resultRows()).toHaveLength(1);
    expect(resultRows()[0]).toHaveTextContent("#2");

    selectComparison();
    expect(resultRows()).toHaveLength(2);
    change("Tipo de consulta", "date-range");
    expect(screen.getByLabelText("Fecha desde")).toHaveValue("2026-05-01");
    expect(screen.getByLabelText("Fecha hasta")).toHaveValue("2026-05-31");
    expect(resultRows()[0]).toHaveTextContent("#2");
    change("Tipo de consulta", "two-records");
    expect(screen.getByLabelText("Primer registro")).toHaveValue("3");
    expect(screen.getByLabelText("Segundo registro")).toHaveValue("1");
    expect(resultRows()).toHaveLength(2);
  });

  it("compares exactly the two chosen records chronologically for every indicator", () => {
    const { container } = render(<GreenMetricsSection {...props} />);
    selectComparison();
    expect(resultRows()[0]).toHaveTextContent("#1");
    expect(resultRows()[1]).toHaveTextContent("#3");
    const metricSelect = screen.getByLabelText("Indicador");
    const options = within(metricSelect).getAllByRole<HTMLOptionElement>("option");
    for (const option of options) {
      change("Indicador", option.value);
      expect(screen.getByRole("columnheader", { name: option.textContent! })).toBeInTheDocument();
      expect(resultRows()).toHaveLength(2);
      expect(container.querySelectorAll("svg circle")).toHaveLength(2);
    }
    change("Indicador", "metric2GreenAreaPerCapita");
    expect(within(resultRows()[0]).getAllByRole("cell")[2]).toHaveTextContent(/^1$/);
    expect(within(resultRows()[1]).getAllByRole("cell")[2]).toHaveTextContent(/^3$/);
    expect(screen.getByRole("heading", { name: "Comparación: M2. Área verde por persona" })).toBeInTheDocument();
  });

  it("requires two distinct selections and prevents choosing the same record twice", () => {
    render(<GreenMetricsSection {...props} />);
    change("Tipo de consulta", "two-records");
    expect(screen.getByText("Selecciona dos registros distintos para consultar el indicador.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    change("Primer registro", "3");
    expect(within(screen.getByLabelText("Segundo registro")).getByRole("option", { name: /#3/ })).toBeDisabled();
    change("Segundo registro", "1");
    expect(within(screen.getByLabelText("Primer registro")).getByRole("option", { name: /#1/ })).toBeDisabled();
    change("Primer registro", "");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descargar PDF" })).not.toBeInTheDocument();
  });

  it.each([0, 1])("explains when there are only %i saved records", (count) => {
    render(<GreenMetricsSection {...props} records={records.slice(0, count)} />);
    change("Tipo de consulta", "two-records");
    expect(screen.getByText("Se necesitan al menos dos registros guardados para comparar.")).toBeInTheDocument();
    expect(screen.getByLabelText("Primer registro")).toBeDisabled();
    expect(screen.getByLabelText("Segundo registro")).toBeDisabled();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("handles loading and removed records without showing a partial comparison", () => {
    const { rerender } = render(<GreenMetricsSection {...props} />);
    selectComparison();
    rerender(<GreenMetricsSection {...props} isLoading />);
    expect(screen.getByText("Cargando histórico...")).toBeInTheDocument();
    expect(screen.getByLabelText("Primer registro")).toBeDisabled();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    rerender(<GreenMetricsSection {...props} records={records.slice(0, 2)} />);
    expect(screen.getByLabelText("Segundo registro")).toHaveValue("");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Selecciona dos registros distintos para consultar el indicador.")).toBeInTheDocument();
  });

  it("exports only the selected records and indicator to PDF", async () => {
    vi.stubGlobal("Image", class {
      width = 1400;
      height = 560;
      onload: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    });
    vi.stubGlobal("URL", class extends URL {
      static createObjectURL = vi.fn(() => "blob:chart");
      static revokeObjectURL = vi.fn();
    });
    const context: Partial<CanvasRenderingContext2D> = {
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,chart");
    render(<GreenMetricsSection {...props} />);
    selectComparison();
    change("Indicador", "metric2GreenAreaPerCapita");
    fireEvent.click(screen.getByRole("button", { name: "Descargar PDF" }));
    await waitFor(() => expect(pdf.save).toHaveBeenCalledWith("greenmetric-metric2GreenAreaPerCapita.pdf"));
    expect(pdf.table).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      body: [
        [expect.any(String), "#1", "1 m2/persona"],
        [expect.any(String), "#3", "3 m2/persona"],
      ],
    }));
    expect(pdf.text).toHaveBeenCalledWith(expect.stringMatching(/^Comparación: #1 .* y #3 /), 40, 66);
  });
});
