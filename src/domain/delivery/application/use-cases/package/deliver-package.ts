import {
  Pack,
  PackageStatus,
} from '@/domain/delivery/enterprise/entities/package'
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository'
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { Utils } from '../utils/use-case-utils'

interface DeliverPackageUseCaseRequest {
  deliveryPersonId: string
  id: string
}

type DeliverPackageUseCaseResponse = Either<NotFoundError, Pack>

@Injectable()
export class DeliverPackageUseCase {
  constructor(
    private sendNotification: EmailSender,
    private packagesRepository: PackagesRepository,
    private usersRepository: UsersRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: DeliverPackageUseCaseRequest,
  ): Promise<DeliverPackageUseCaseResponse> {
    const deliveryPerson = await this.usersRepository.findById(
      params.deliveryPersonId,
    )

    if (!deliveryPerson) {
      return left(new NotFoundError('DeliveryPerson'))
    }

    const pack = await Utils.validatePackage({
      packagesRepository: this.packagesRepository,
      packageId: params.id,
      requireStatus: [PackageStatus.WAITING],
    })

    if (pack instanceof Error) {
      return left(pack)
    }

    const newPack = await this.packagesRepository.changeStatusToDelivered(
      params.id,
      params.deliveryPersonId,
      {
        latitude: deliveryPerson.latitude,
        longitude: deliveryPerson.longitude,
      },
    )

    const recipientPerson = await this.usersRepository.findById(
      pack.recipientId,
    )

    this.sendNotification.send({
      emails: [recipientPerson!.email],
      title: 'Rastramento do produto',
      content: 'Aqui suas informações',
    })

    return right(newPack)
  }
}
