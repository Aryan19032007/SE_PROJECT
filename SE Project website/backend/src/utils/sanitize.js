function cleanString(value, maxLength = 500) {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).replace(/\0/g, '').trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function cleanNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function isValidPhone(phone) {
  return /^\d{10}$/.test(String(phone || '').trim());
}

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

module.exports = {
  cleanBoolean,
  cleanNumber,
  cleanString,
  isValidEmail,
  isValidPhone
};
