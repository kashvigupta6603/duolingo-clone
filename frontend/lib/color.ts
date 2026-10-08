/** Lighten (+) or darken (-) a #rrggbb colour. Used for the 3D button edges. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 255) + amt);
  const b = clamp((n & 255) + amt);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}