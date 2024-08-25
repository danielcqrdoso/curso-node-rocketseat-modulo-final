import { UseCaseError } from '@/core/errors/use-case-error'

export class PassedDealineError extends Error implements UseCaseError {
  constructor() {
    super(`The package has already passed the return deadline.`)
  }
}
