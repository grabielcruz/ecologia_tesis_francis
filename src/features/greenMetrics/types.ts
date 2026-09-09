export interface QuarterlyMetricsValues {
  metric1GreenAreaRatio: number;
  metric2GreenAreaPerCapita: number;
  metric3DenseVegetationRatio: number;
  metric4RainwaterAbsorptionRatio: number;
  metric5SustainabilityBudgetShare: number;
  metric6ConservationOperationShare: number;
}

export interface QuarterlyGreenMetricRecord {
  id: number;
  year: number;
  quarter: number;
  periodStart?: string | null;
  periodEnd?: string | null;
  totalCampusAreaM2: number;
  greenAreaM2: number;
  campusPopulation: number;
  denseVegetationAreaM2: number;
  rainwaterAbsorptionAreaM2: number;
  sustainabilityBudget: number;
  conservationOperationBudget: number;
  metrics: QuarterlyMetricsValues;
  createdBy: {
    id: number;
    username: string;
    name: string;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface QuarterlyGreenMetricFormInput {
  year: number;
  quarter: number;
  totalCampusAreaM2: number;
  greenAreaM2: number;
  campusPopulation: number;
  denseVegetationAreaM2: number;
  rainwaterAbsorptionAreaM2: number;
  sustainabilityBudget: number;
  conservationOperationBudget: number;
}
