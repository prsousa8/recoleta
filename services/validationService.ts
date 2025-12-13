
// Validation Service

// Removes non-numeric characters
export const cleanDigits = (value: string) => value.replace(/\D/g, '');

export const validateCPF = (cpf: string): boolean => {
  const clean = cleanDigits(cpf);
  if (clean.length !== 11) return false;

  // Check for repeated digits (e.g., 111.111.111-11)
  if (/^(\d)\1+$/.test(clean)) return false;

  // Validate first digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(clean.charAt(9))) return false;

  // Validate second digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(clean.charAt(10))) return false;

  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  const clean = cleanDigits(cnpj);
  if (clean.length !== 14) return false;

  // Check for repeated digits
  if (/^(\d)\1+$/.test(clean)) return false;

  // Validate first digit
  let size = clean.length - 2;
  let numbers = clean.substring(0, size);
  const digits = clean.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;

  // Validate second digit
  size = size + 1;
  numbers = clean.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

export const validateCEP = (cep: string): boolean => {
  const clean = cleanDigits(cep);
  return clean.length === 8;
};

export const validatePhone = (phone: string): boolean => {
  const clean = cleanDigits(phone);
  // Aceita fixo (10) ou celular (11)
  return clean.length === 10 || clean.length === 11;
};

export const validateName = (name: string): boolean => {
  if (!name) return false;
  // Pelo menos 3 caracteres e sem números
  return name.trim().length >= 3 && !/\d/.test(name);
};

// Formatters
export const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

export const formatPhone = (value: string) => {
  const clean = value.replace(/\D/g, '');
  if (clean.length > 10) {
    // Mobile: (11) 99999-9999
    return clean
      .replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
  } else if (clean.length > 5) {
    // Landline: (11) 9999-9999
    return clean
      .replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
  } else if (clean.length > 2) {
    return clean.replace(/^(\d\d)(\d{0,5})/, '($1) $2');
  } else {
    return clean;
  }
};
