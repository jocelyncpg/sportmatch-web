export function validarTexto(value, label, min, max, opcional = false) {
  const text = value.trim();
  if (!text && opcional) return text;
  if (text.length < min) throw new Error(`${label} debe tener al menos ${min} caracteres.`);
  if (text.length > max) throw new Error(`${label} no puede superar ${max} caracteres.`);
  return text;
}
export function queryString(values) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") query.set(key, String(value));
  const result = query.toString(); return result ? `?${result}` : "";
}
