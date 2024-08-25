import { Either, left, right } from '@/core/either'
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { Injectable } from '@nestjs/common'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { Pack } from '@/domain/delivery/enterprise/entities/package'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { ExecuteMultipleFunctions } from '@/core/utilis/execute-multiple-functions'
import { User } from '@/domain/delivery/enterprise/entities/user'

interface DeletePackageUseCaseRequest {
  recipientId: string
  packageId: string
}

type DeletePackageUseCaseResponse = Either<
  NotFoundError | NotAllowedError,
  Pack
>

@Injectable()
export class DeletePackageUseCase {
  constructor(
    private sendNotification: EmailSender,
    private usersRepository: UsersRepository,
    private packagesRepository: PackagesRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute({
    recipientId,
    packageId,
  }: DeletePackageUseCaseRequest): Promise<DeletePackageUseCaseResponse> {
    const promises = new ExecuteMultipleFunctions()
    let deliveryPerson: User | null = null
    const pack = await this.packagesRepository.findById(packageId)

    if (!pack || pack.isDeleted) {
      return left(new NotFoundError('Package'))
    }

    if (pack.recipientId !== recipientId) {
      return left(new NotAllowedError())
    }

    const [newPack, recipientPerson] = await Promise.all([
      this.packagesRepository.delete(packageId),
      this.usersRepository.findById(pack.recipientId),
    ])

    if (pack.deliveryPersonId) {
      deliveryPerson = await this.usersRepository.findById(
        pack.deliveryPersonId,
      )
    }

    promises.addFunction(
      this.sendNotification.send.bind(this.sendNotification),
      {
        emails: [recipientPerson!.email],
        title: 'Compra cancelada com sucesso',
        content: `A compra ${pack.id} foi cancelada com sucesso`,
      },
    )

    if (deliveryPerson) {
      promises.addFunction(
        this.sendNotification.send.bind(this.sendNotification),
        {
          emails: [deliveryPerson.email],
          title: 'Entrega cancelada',
          content: `A entrega ${pack.id} foi cancelada, entre no site para mais informações`,
          adminId: deliveryPerson.adminId,
        },
      )
    }

    await promises.execute()

    return right(newPack)
  }
}
