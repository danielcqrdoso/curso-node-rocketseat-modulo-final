import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-user'
import { DeliverPackageUseCase } from '../deliver-package'
import { PrismaPackagesRepository } from '@/infra/database/prisma/repositories/prisma-packages-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { User } from '@/domain/delivery/enterprise/entities/user'
import {
  Pack,
  PackageStatus,
} from '@/domain/delivery/enterprise/entities/package'
import { makePack } from 'test/factories/make-package'
import { SendNotification } from '@/infra/emails/send-notification'
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository'
import { Notification } from '@/domain/notification/enterprise/entities/notification'

let usersRepository: PrismaUsersRepository
let packagesRepository: PrismaPackagesRepository
let emailService: SendNotification
let sut: DeliverPackageUseCase

describe('Deliver Pack', () => {
  beforeAll(async () => {
    packagesRepository = new PrismaPackagesRepository(new PrismaService())
    usersRepository = new PrismaUsersRepository(new PrismaService())
    emailService = new SendNotification(
      new PrismaNotificationsRepository(new PrismaService()),
    )

    sut = new DeliverPackageUseCase(
      emailService,
      packagesRepository,
      usersRepository,
    )
  })

  it('should be able to deliver a pack', async () => {
    const newUser = makeUser({}, new UniqueEntityID('user-1'))
    const newPack = makePack({}, new UniqueEntityID('pack-1'))
    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        latitude: -18.8127589,
        longitude: -40.5722593,
      } as User)
      .mockResolvedValueOnce({
        email: 'user@email',
        latitude: -18.8127589,
        longitude: -40.5722593,
      } as User)

    vi.spyOn(packagesRepository, 'findById').mockResolvedValueOnce({
      isDeleted: false,
      status: PackageStatus.WAITING,
    } as Pack)
    vi.spyOn(
      packagesRepository,
      'changeStatusToDelivered',
    ).mockResolvedValueOnce({} as Pack)
    vi.spyOn(emailService, 'send').mockResolvedValueOnce({} as Notification)

    const result = await sut.execute({
      id: newPack.id,
      deliveryPersonId: newUser.id,
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.findById).toBeCalledTimes(2)
    expect(packagesRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.changeStatusToDelivered).toBeCalledTimes(1)
    expect(packagesRepository.changeStatusToDelivered).toBeCalledWith(
      newPack.id,
      newUser.id,
      {
        latitude: -18.8127589,
        longitude: -40.5722593,
      },
    )
    expect(emailService.send).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledWith({
      emails: ['user@email'],
      title: 'Rastramento do produto',
      content: 'Aqui suas informações',
    })
  })
})
