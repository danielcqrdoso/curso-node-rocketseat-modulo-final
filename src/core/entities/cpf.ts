import { cpf as cpfValidator } from 'cpf-cnpj-validator'

import { InvalidFormatError } from '@/core/errors/errors/invalid-format-error'

export class Cpf {
  private readonly value: string

  constructor(value: string) {
    if (!Cpf.isValid(value)) {
      throw new InvalidFormatError('CPF')
    }
    this.value = value
  }

  static isValid(value: string): boolean {
    return cpfValidator.isValid(value)
  }

  static parse(value: string): Cpf {
    return new Cpf(value)
  }

  toString(): string {
    return this.value
  }

  static onlyNumbers(value: string): string {
    const cpf = new Cpf(value)
    return cpf.value.replace(/\D/g, '')
  }

  get formatted(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
}
