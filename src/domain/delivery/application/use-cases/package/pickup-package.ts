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
import { Utils } from '../utils/use-case-utils'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

interface PickupPackageUseCaseRequest {
  deliveryPersonId: string
  id: string
  photo: PhotoParams
  location: LocationParams
}

type PickupPackageUseCaseResponse = Either<
  | NotFoundError
  | InvalidAttachmentTypeError
  | FileNameAlreadyExistsError
  | NotAllowedError,
  Pack
>

@Injectable()
export class PickupPackageUseCase {
  constructor(
    private packagesRepository: PackagesRepository,
    private usersRepository: UsersRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: PickupPackageUseCaseRequest,
  ): Promise<PickupPackageUseCaseResponse> {
    const deliveryPerson = await this.usersRepository.findById(
      params.deliveryPersonId,
    )

    if (!deliveryPerson) {
      return left(new NotFoundError('Recipient Person'))
    }

    const pack = await Utils.validatePackage({
      packagesRepository: this.packagesRepository,
      packageId: params.id,
      requireStatus: [PackageStatus.AVAILABLE_PICKUP, PackageStatus.DELIVERED],
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

    const newPack = await this.packagesRepository.changeStatusToPickup(
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
    )

    return right(newPack)
  }
}
