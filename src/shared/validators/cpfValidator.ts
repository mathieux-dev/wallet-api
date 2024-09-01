import { cpf as cpfValidator } from 'cpf-cnpj-validator';

export function IsValidCpf(cpf: string): boolean {
  return cpfValidator.isValid(cpf);
}
