import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { HashComparer } from '@/domain/delivery/application/cryptography/hash-comparer'
import { Encrypter } from '@/domain/delivery/application/cryptography/encrypter'
import { WrongCredentialsError } from '@/core/errors/errors/wrong-credentials-error'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { User } from '@/domain/delivery/enterprise/entities//user'
import { Utils } from '../utils/use-case-utils'

interface AuthenticateUserUseCaseRequest {
  cpf?: string
  email?: string
  password: string
}

type AuthenticateUserUseCaseResponse = Either<
  WrongCredentialsError | NotFoundError,
  {
    accessToken: string
  }
>

@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashComparer: HashComparer,
    private encrypter: Encrypter,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: AuthenticateUserUseCaseRequest,
  ): Promise<AuthenticateUserUseCaseResponse> {
    let user: User | null = null

    if (params.cpf || params.email) {
      user = params.cpf
        ? await this.usersRepository.findByCPF(params.cpf)
        : await this.usersRepository.findByEmail(params.email!)

      if (!user) {
        return left(new NotFoundError('User'))
      }
    } else {
      return left(new NotFoundError('User'))
    }

    const isPasswordValid = await this.hashComparer.compare(
      params.password,
      user.password,
    )

    if (!isPasswordValid) {
      return left(new WrongCredentialsError())
    }

    const accessToken = await Utils.createJWTToken(this.encrypter, user)

    return right({
      accessToken,
    })
  }
}
