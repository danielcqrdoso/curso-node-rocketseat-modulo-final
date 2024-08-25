import {
  Pack,
  PackageStatus,
} from '@/domain/delivery/enterprise/entities/package'
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository'
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'
import { PhotoParams, FileType } from '@/core/repositories/photo-params'
import { InvalidAttachmentTypeError } from '@/core/errors/errors/invalid-attachment-type-error'
import { FileNameAlreadyExistsError } from '@/core/errors/errors/file-name-already-exists-error'
import { LocationParams } from '@/core/repositories/location-params'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { Utils } from '../utils/use-case-utils'

interface AvailablePickupPackageUseCaseRequest {
  deliveryPersonId: string
  id: string
  photo: PhotoParams
  location: LocationParams
}

type AvailablePickupPackageUseCaseResponse = Either<
  NotFoundError | InvalidAttachmentTypeError | FileNameAlreadyExistsError,
  Pack
>

@Injectable()
export class AvailablePickupPackageUseCase {
  constructor(
    private sendNotification: EmailSender,
    private packagesRepository: PackagesRepository,
    private usersRepository: UsersRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: AvailablePickupPackageUseCaseRequest,
  ): Promise<AvailablePickupPackageUseCaseResponse> {
    const deliveryPerson = await this.usersRepository.findById(
      params.deliveryPersonId,
    )

    if (!deliveryPerson) {
      return left(new NotFoundError('Delivery Person'))
    }

    const pack = await Utils.validatePackage({
      packagesRepository: this.packagesRepository,
      packageId: params.id,
      requireStatus: [PackageStatus.DELIVERED],
      deliveryPersonId: params.deliveryPersonId,
    })

    if (pack instanceof Error) {
      return left(pack)
    }

    if (!Object.values(FileType).includes(params.photo.fileType)) {
      return left(new InvalidAttachmentTypeError(params.photo.fileType))
    }

    const { entities } = await this.packagesRepository.listPackages({
      fileName: params.photo.fileName,
    })

    if (entities.length !== 0) {
      return left(new FileNameAlreadyExistsError(params.photo.fileName))
    }

    const [newPack] = await Promise.all([
      this.packagesRepository.changeStatusToAvailablePickup(
        params.id,
        {
          fileBody: params.photo.fileBody,
          fileName: params.photo.fileName,
          fileType: params.photo.fileType,
        },
        {
          latitude: params.location.latitude,
          longitude: params.location.longitude,
        },
      ),
      this.sendNotification.send({
        emails: [deliveryPerson.email],
        title:
          'Sua compra está disponível para retirada na transportadora local',
        content: `A compra ${pack.id} está disponível para retirada na transportadora local`,
        adminId: deliveryPerson.adminId,
      }),
    ])

    return right(newPack)
  }
}
