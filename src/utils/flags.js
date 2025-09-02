// Convert ISO 3166-1 alpha-2 country code to emoji flag
export function countryCodeToEmoji(code) {
  if (!code || typeof code !== "string") return "";
  const cc = code.trim().toUpperCase();
  if (cc.length !== 2) return "";
  const A = 0x1f1e6;
  const base = "A".charCodeAt(0);
  const chars = [...cc].map((c) => String.fromCodePoint(A + (c.charCodeAt(0) - base)));
  return chars.join("");
}

