import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidFormatError extends Error implements UseCaseError {
  constructor(object: string) {
    super(`The format of ${object} is incorrect`)
  }
}
