import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { User, UserRole } from '@/domain/delivery/enterprise/entities//user'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { HashGenerator } from '@/domain/delivery/application/cryptography/hash-generator'
import { UserAlreadyExistsError } from '@/core/errors/errors/user-already-exists-error'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { Encrypter } from '@/domain/delivery/application//cryptography/encrypter'
import { ParamsNotProvidedError } from '@/core/errors/errors/params-not-provided-error'
import { Utils } from '../utils/use-case-utils'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { ExecuteMultipleFunctions } from '@/core/utilis/execute-multiple-functions'

export interface RegisterUserUseCaseRequest {
  name: string
  cpf: string
  email: string
  password: string
  role: UserRole
  adminId?: string
  latitude: number
  longitude: number
}

type RegisterUserUseCaseResponse = Either<
  UserAlreadyExistsError | ParamsNotProvidedError | NotFoundError,
  {
    accessToken: string
  }
>

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private sendNotification: EmailSender,
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
    private encrypter: Encrypter,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: RegisterUserUseCaseRequest,
  ): Promise<RegisterUserUseCaseResponse> {
    const promises = new ExecuteMultipleFunctions()
    const [userWithSameEmail, userWithSameCPF] = await Promise.all([
      this.usersRepository.findByEmail(params.email),
      this.usersRepository.findByCPF(params.cpf),
    ])

    if (userWithSameEmail) {
      return left(new UserAlreadyExistsError(params.email))
    }
    if (userWithSameCPF) {
      return left(new UserAlreadyExistsError(params.cpf))
    }

    if (params.role === UserRole.DELIVERYMAN) {
      const admin = await Utils.findAdmin(this.usersRepository, params.adminId)
      if (admin instanceof Error) {
        return left(admin)
      }

      promises.addFunction(
        this.sendNotification.send.bind(this.sendNotification),
        {
          emails: [admin.email],
          title: 'Novo Usuário Cadastrado',
          content: `Você cadastrou um novo usuário: ${params.email}.`,
          adminId: admin.id,
        },
      )
    }

    const hashedPassword = await this.hashGenerator.hash(params.password)

    const user = User.create({
      ...params,
      password: hashedPassword,
    })

    promises.addFunction(
      this.usersRepository.create.bind(this.usersRepository),
      user,
    )
    promises.addFunction(
      this.sendNotification.send.bind(this.sendNotification),
      {
        emails: [params.email],
        title: 'Criação de user',
        content: 'Agora você faz parte do nosso time.',
      },
    )

    await promises.execute()

    const accessToken = await Utils.createJWTToken(this.encrypter, user)

    return right({ accessToken })
  }
}
