import { Pack } from '@/domain/delivery/enterprise/entities/package'
import { DeletePackageUseCase } from '../delete-package'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaPackagesRepository } from '@/infra/database/prisma/repositories/prisma-packages-repository'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { SendNotification } from '@/infra/emails/send-notification'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository'
import { User } from '@/domain/delivery/enterprise/entities/user'
import { makePack } from 'test/factories/make-package'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

let packagesRepository: PrismaPackagesRepository
let usersRepository: PrismaUsersRepository
let emailService: SendNotification
let sut: DeletePackageUseCase

describe('Delete package', () => {
  beforeEach(() => {
    packagesRepository = new PrismaPackagesRepository(new PrismaService())
    usersRepository = new PrismaUsersRepository(new PrismaService())
    emailService = new SendNotification(
      new PrismaNotificationsRepository(new PrismaService()),
    )

    sut = new DeletePackageUseCase(
      emailService,
      usersRepository,
      packagesRepository,
    )
  })

  it('should be able to delete a package', async () => {
    const pack = makePack(
      { recipientId: 'recipientId', deliveryPersonId: 'deliveryPersonId' },
      new UniqueEntityID('pack-1'),
    )
    vi.spyOn(packagesRepository, 'findById').mockResolvedValueOnce(pack)
    vi.spyOn(packagesRepository, 'delete').mockResolvedValueOnce({} as Pack)
    vi.spyOn(emailService, 'send').mockResolvedValue({} as Notification)
    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        email: 'email',
      } as User)
      .mockResolvedValueOnce({
        email: 'email',
      } as User)

    const result = await sut.execute({
      recipientId: 'recipientId',
      packageId: 'id',
    })

    expect(result.isRight()).toBe(true)
    expect(packagesRepository.delete).toBeCalledTimes(1)
    expect(packagesRepository.findById).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledTimes(2)
    expect(emailService.send).toHaveBeenNthCalledWith(1, {
      emails: ['email'],
      title: 'Compra cancelada com sucesso',
      content: `A compra ${pack.id} foi cancelada com sucesso`,
    })
    expect(emailService.send).toHaveBeenNthCalledWith(2, {
      emails: ['email'],
      title: 'Entrega cancelada',
      content: `A entrega ${pack.id} foi cancelada, entre no site para mais informações`,
    })
  })
})
