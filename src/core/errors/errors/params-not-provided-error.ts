import { UseCaseError } from '@/core/errors/use-case-error'

export class ParamsNotProvidedError extends Error implements UseCaseError {
  constructor(params: string) {
    super(`The params: "${params}" were not provided`)
  }
}
