export interface GreenMetricValues {
  metric1GreenAreaRatio: number;
  metric2GreenAreaPerCapita: number;
  metric3DenseVegetationRatio: number;
  metric4RainwaterAbsorptionRatio: number;
  metric5SustainabilityBudgetShare: number;
  metric6ConservationOperationShare: number;
}

export interface GreenMetricRecord {
  id: number;
  calculationDate: string;
  totalCampusAreaM2: number;
  greenAreaM2: number;
  campusPopulation: number;
  denseVegetationAreaM2: number;
  rainwaterAbsorptionAreaM2: number;
  sustainabilityBudget: number;
  conservationOperationBudget: number;
  metrics: GreenMetricValues;
  createdBy: {
    id: number;
    username: string;
    name: string;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface GreenMetricFormInput {
  calculationDate: string;
  totalCampusAreaM2: number;
  greenAreaM2: number;
  campusPopulation: number;
  denseVegetationAreaM2: number;
  rainwaterAbsorptionAreaM2: number;
  sustainabilityBudget: number;
  conservationOperationBudget: number;
}
