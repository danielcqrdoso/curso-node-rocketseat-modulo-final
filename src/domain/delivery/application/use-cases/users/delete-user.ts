import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { Injectable } from '@nestjs/common'
import { Either, left, right } from '@/core/either'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { Utils } from '../utils/use-case-utils'
import { ParamsNotProvidedError } from '@/core/errors/errors/params-not-provided-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ExecuteMultipleFunctions } from '@/core/utilis/execute-multiple-functions'

interface DeleteUserUseCaseRequest {
  id: string
  adminId?: string
}

type DeleteUserUseCaseResponse = Either<
  ParamsNotProvidedError | NotFoundError | NotAllowedError,
  null
>

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private sendNotification: EmailSender,
    private usersRepository: UsersRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute({
    id,
    adminId,
  }: DeleteUserUseCaseRequest): Promise<DeleteUserUseCaseResponse> {
    const promises = new ExecuteMultipleFunctions()
    const user = await this.usersRepository.findById(id)
    if (!user) {
      return left(new NotFoundError('User'))
    }

    promises.addFunction(
      this.usersRepository.delete.bind(this.usersRepository),
      id,
    )
    promises.addFunction(
      this.sendNotification.send.bind(this.sendNotification),
      {
        emails: [user.email],
        title: 'Adeus',
        content: 'Sua conta foi encerrada por um admin ou por você mesmo.',
      },
    )
    if (user.role === UserRole.DELIVERYMAN) {
      const admin = await Utils.validateAdmin({
        usersRepository: this.usersRepository,
        adminId,
        deliveryPerson: user,
      })
      if (admin instanceof Error) {
        return left(admin)
      }
      promises.addFunction(
        this.sendNotification.send.bind(this.sendNotification),
        {
          emails: [admin.email],
          title: 'Usuário deletado',
          content: `Você deletou o usuário: ${user.email}.`,
          adminId: admin.id,
        },
      )
    }

    await promises.execute()

    return right(null)
  }
}
