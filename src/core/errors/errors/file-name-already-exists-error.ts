import { UseCaseError } from '@/core/errors/use-case-error'

export class FileNameAlreadyExistsError extends Error implements UseCaseError {
  constructor(filename: string) {
    super(`File name "${filename}" already exists.`)
  }
}
