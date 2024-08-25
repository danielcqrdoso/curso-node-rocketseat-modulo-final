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
import { calculateDaysPassed } from '@/core/utilis/data-calculation'
import { envSchema } from '@/infra/env/env'
import { config } from 'dotenv'
import { PassedDealineError } from '@/core/errors/errors/passed-deadline-error'
import { LocationParams } from '@/core/repositories/location-params'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { Utils } from '../utils/use-case-utils'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

config({ path: '.env', override: true })

const env = envSchema.parse(process.env)

interface ReturnPackageUseCaseRequest {
  recipientPersonId: string
  id: string
  photo: PhotoParams
  location: LocationParams
}

type ReturnPackageUseCaseResponse = Either<
  | NotFoundError
  | InvalidAttachmentTypeError
  | FileNameAlreadyExistsError
  | PassedDealineError
  | NotAllowedError,
  Pack
>

@Injectable()
export class ReturnPackageUseCase {
  constructor(
    private sendNotification: EmailSender,
    private packagesRepository: PackagesRepository,
    private usersRepository: UsersRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: ReturnPackageUseCaseRequest,
  ): Promise<ReturnPackageUseCaseResponse> {
    const recipientPerson = await this.usersRepository.findById(
      params.recipientPersonId,
    )

    if (!recipientPerson) {
      return left(new NotFoundError('Recipient Person'))
    }

    const pack = await Utils.validatePackage({
      packagesRepository: this.packagesRepository,
      packageId: params.id,
      requireStatus: [PackageStatus.PICKUP],
      recipientId: params.recipientPersonId,
    })

    if (pack instanceof Error) {
      return left(pack)
    }

    const daysSincePickup = calculateDaysPassed(pack.pickupAt!)

    if (daysSincePickup > env.RETURN_PERIOD_DAYS) {
      return left(new PassedDealineError())
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
      this.packagesRepository.changeStatusToReturned(
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
        emails: [recipientPerson.email],
        title: 'Informações sobre o retorno',
        content: 'O pedido de reembolso foi realizado com sucesso',
      }),
    ])

    return right(newPack)
  }
}
