const idr = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatIdr(value: number): string {
  return idr.format(Math.round(value));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(Math.round(value));
}
