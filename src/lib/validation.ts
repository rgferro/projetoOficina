/**
 * Validação Oficial de CPF (Cadastro de Pessoas Físicas)
 */
export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;

  // Rejeita sequências repetidas (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10))) return false;

  return true;
}

/**
 * Validação Oficial de CNPJ (Cadastro Nacional da Pessoa Jurídica)
 */
export function validateCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return false;

  // Rejeita sequências repetidas
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Máscara dinâmica para CPF / CNPJ
 */
export function maskDocument(value: string): string {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 11) {
    // CPF: 000.000.000-00
    return clean
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  }
  // CNPJ: 00.000.000/0001-00
  return clean
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

/**
 * Máscara dinâmica para Telefone / Celular (XX) XXXXX-XXXX
 */
export function maskPhone(value: string): string {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 14);
  }
  return clean
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}

/**
 * Máscara para CEP: 00000-000
 */
export function maskCEP(value: string): string {
  const clean = value.replace(/\D/g, "");
  return clean.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
}
