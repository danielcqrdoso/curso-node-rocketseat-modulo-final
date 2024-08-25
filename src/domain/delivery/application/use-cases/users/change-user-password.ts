import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { User, UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { HashGenerator } from '@/domain/delivery/application/cryptography/hash-generator'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { Utils } from '../utils/use-case-utils'
import { ParamsNotProvidedError } from '@/core/errors/errors/params-not-provided-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

interface ChangeUserPasswordUseCaseRequest {
  cpf?: string
  email?: string
  adminId?: string
  password: string
}

type ChangeUserPasswordUseCaseResponse = Either<
  ParamsNotProvidedError | NotFoundError | NotAllowedError,
  User
>

@Injectable()
export class ChangeUserPasswordUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: ChangeUserPasswordUseCaseRequest,
  ): Promise<ChangeUserPasswordUseCaseResponse> {
    const user = params.cpf
      ? await this.usersRepository.findByCPF(params.cpf)
      : params.email
        ? await this.usersRepository.findByEmail(params.email)
        : null

    if (!user) {
      return left(new NotFoundError('User'))
    }

    if (user.role === UserRole.DELIVERYMAN) {
      const admin = await Utils.validateAdmin({
        usersRepository: this.usersRepository,
        adminId: params.adminId,
        deliveryPerson: user,
      })
      if (admin instanceof Error) {
        return left(admin)
      }
    }

    const hashedPassword = await this.hashGenerator.hash(params.password)

    const newUser = await this.usersRepository.update(user.id, {
      password: hashedPassword,
    })

    return right(newUser)
  }
}
