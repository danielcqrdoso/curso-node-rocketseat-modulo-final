import {
  Pack,
  PackageStatus,
} from '@/domain/delivery/enterprise/entities/package'
import { PackagesRepository } from '@/domain/delivery/application/repositories/packages-repository'
import { Either, left, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { ProductsRepository } from '@/domain/delivery/application/repositories/products-repository'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { UsersRepository } from '@/domain/delivery/application/repositories/users-repository'

interface CreatePackageUseCaseRequest {
  productQuantity: number
  recipientId: string
  productId: string
}

type CreatePackageUseCaseResponse = Either<
  NotFoundError,
  {
    pack: Pack
  }
>

@Injectable()
export class CreatePackageUseCase {
  constructor(
    private sendNotification: EmailSender,
    private packagesRepository: PackagesRepository,
    private productsRepository: ProductsRepository,
    private usersRepository: UsersRepository,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async execute(
    params: CreatePackageUseCaseRequest,
  ): Promise<CreatePackageUseCaseResponse> {
    const [product, user] = await Promise.all([
      this.productsRepository.findById(params.productId),
      this.usersRepository.findById(params.recipientId),
    ])

    if (!product) {
      return left(new NotFoundError('Product'))
    }

    if (!user) {
      return left(new NotFoundError('User'))
    }

    const pack = Pack.create({
      ...params,
      latitude: product.latitude,
      longitude: product.longitude,
      status: PackageStatus.WAITING,
    })

    await Promise.all([
      this.packagesRepository.create(pack),
      this.sendNotification.send({
        emails: [user.email],
        title: 'Compra realizada com sucesso',
        content: `A compra ${pack.id} foi realizada com sucesso`,
      }),
    ])

    return right({
      pack,
    })
  }
}
