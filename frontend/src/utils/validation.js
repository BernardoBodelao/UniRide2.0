// Regras espelhadas do backend (backend/app/validators.py). O servidor continua sendo
// a fonte de verdade; aqui só evitamos uma ida à API por erros que já dá para ver.

const EMAIL_PATTERN = /^[\w.-]+@[\w.-]+\.\w{2,}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const LIMITS = { place: 120, name: 120, course: 120, phone: 30, bio: 500, seatsMin: 1, seatsMax: 8, passwordMin: 6 };

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return "Informe seu e-mail.";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return "Esse e-mail não parece válido. Confira se há @ e domínio completo.";
  return "";
}

export function validateLoginPassword(value) {
  return value ? "" : "Informe sua senha.";
}

export function validateNewPassword(value) {
  if (!value) return "Crie uma senha.";
  if (value.length < LIMITS.passwordMin) return `Use pelo menos ${LIMITS.passwordMin} caracteres.`;
  if (value.length > 128) return "Use no máximo 128 caracteres.";
  return "";
}

export function validateRide({ from, to, time, seats }) {
  const errors = {};
  if (!from.trim()) errors.from = "Informe de onde você sai.";
  else if (from.trim().length > LIMITS.place) errors.from = `Use no máximo ${LIMITS.place} caracteres.`;

  if (!to.trim()) errors.to = "Informe para onde você vai.";
  else if (to.trim().length > LIMITS.place) errors.to = `Use no máximo ${LIMITS.place} caracteres.`;

  if (!time) errors.time = "Informe o horário de saída.";
  else if (!TIME_PATTERN.test(time)) errors.time = "Use o formato HH:MM, por exemplo 18:40.";

  const count = Number(seats);
  if (!Number.isInteger(count) || count < LIMITS.seatsMin || count > LIMITS.seatsMax) {
    errors.seats = `Informe de ${LIMITS.seatsMin} a ${LIMITS.seatsMax} vagas.`;
  }
  return errors;
}

export function validateProfile({ name, course, phone }) {
  const errors = {};
  if (!name.trim()) errors.name = "Informe seu nome completo.";
  else if (name.trim().length > LIMITS.name) errors.name = `Use no máximo ${LIMITS.name} caracteres.`;

  if (!course.trim()) errors.course = "Informe seu curso ou faculdade.";
  else if (course.trim().length > LIMITS.course) errors.course = `Use no máximo ${LIMITS.course} caracteres.`;

  if (!phone.trim()) errors.phone = "Informe um telefone ou WhatsApp.";
  else if (phone.trim().length > LIMITS.phone) errors.phone = `Use no máximo ${LIMITS.phone} caracteres.`;
  return errors;
}
