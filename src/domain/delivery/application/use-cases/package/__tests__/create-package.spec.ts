import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeProduct } from 'test/factories/make-product'
import { makeUser } from 'test/factories/make-user'
import { CreatePackageUseCase } from '../create-package'
import { PrismaProductsRepository } from '@/infra/database/prisma/repositories/prisma-products-repository'
import { PrismaPackagesRepository } from '@/infra/database/prisma/repositories/prisma-packages-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { SendNotification } from '@/infra/emails/send-notification'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { User } from '@/domain/delivery/enterprise/entities/user'

let productsRepository: PrismaProductsRepository
let packagesRepository: PrismaPackagesRepository
let emailService: SendNotification
let usersRepository: PrismaUsersRepository
let sut: CreatePackageUseCase

describe('Create Pack', () => {
  beforeAll(async () => {
    packagesRepository = new PrismaPackagesRepository(new PrismaService())
    productsRepository = new PrismaProductsRepository(new PrismaService())
    emailService = new SendNotification(
      new PrismaNotificationsRepository(new PrismaService()),
    )
    usersRepository = new PrismaUsersRepository(new PrismaService())

    sut = new CreatePackageUseCase(
      emailService,
      packagesRepository,
      productsRepository,
      usersRepository,
    )
  })

  it('should be able to create a pack', async () => {
    const newUser = makeUser({}, new UniqueEntityID('user-1'))
    const newProduct = makeProduct({}, new UniqueEntityID('product-1'))
    vi.spyOn(productsRepository, 'findById').mockResolvedValueOnce(newProduct)
    vi.spyOn(packagesRepository, 'create').mockResolvedValueOnce()
    vi.spyOn(emailService, 'send').mockResolvedValueOnce({} as Notification)
    vi.spyOn(usersRepository, 'findById').mockResolvedValue({
      email: 'email',
    } as User)

    const result = await sut.execute({
      productQuantity: 1,
      recipientId: newUser.id,
      productId: newProduct.id,
    })

    expect(result.isRight()).toBe(true)
    expect(packagesRepository.create).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledWith({
      emails: ['email'],
      title: 'Compra realizada com sucesso',
      content: expect.any(String),
    })
  })
})
