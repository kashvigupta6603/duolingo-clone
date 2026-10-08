const PALETTE = ["#1cb0f6", "#ce82ff", "#ff9600", "#58cc02", "#ff86d0", "#ff4b4b"];

export default function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const color = PALETTE[name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: color, fontSize: size * 0.45 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}