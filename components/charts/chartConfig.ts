/**
 * Shared chart styling. Colors follow the entity, never the rank:
 * Meta is always blue, Google always orange, Total spend violet and
 * Shopify Net Sales aqua – on every chart in the product.
 */
export const CHART_COLORS = {
  meta: "#2a78d6",
  google: "#eb6834",
  total: "#4a3aa7",
  netSales: "#1baf7a",
  target: "#52514e",
  grid: "#e7e6e2",
  axis: "#8a8984",
  onTrack: "#1baf7a",
  attention: "#eda100",
  belowTarget: "#e34948",
} as const;

export const AXIS_TICK = { fontSize: 11, fill: CHART_COLORS.axis } as const;

export const TOOLTIP_STYLE = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #e7e6e2",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    fontSize: 12,
    padding: "8px 10px",
  },
  labelStyle: { fontWeight: 600, marginBottom: 4 },
  itemStyle: { padding: 0 },
} as const;
