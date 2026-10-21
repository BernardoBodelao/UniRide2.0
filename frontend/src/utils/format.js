export function initialOf(text, fallback = "U") {
  const value = (text || "").trim();
  return (value ? value[0] : fallback).toUpperCase();
}

export function firstNameOf(user) {
  const name = (user?.name || "").trim();
  return name ? name.split(/\s+/)[0] : "";
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural;
}

// Monta o link do WhatsApp para números brasileiros (DDD + número, com ou sem 55).
export function whatsappLink(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `https://wa.me/55${digits}`;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return `https://wa.me/${digits}`;
  return null;
}
