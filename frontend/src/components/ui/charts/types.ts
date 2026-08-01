export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TooltipData {
  x: number;
  y: number;
  label: string;
  value: string;
  color?: string;
}
