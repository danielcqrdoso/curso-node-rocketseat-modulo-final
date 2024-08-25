import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeUser } from 'test/factories/make-user'
import { PrismaPackagesRepository } from '@/infra/database/prisma/repositories/prisma-packages-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { User } from '@/domain/delivery/enterprise/entities/user'
import {
  Pack,
  PackageStatus,
} from '@/domain/delivery/enterprise/entities/package'
import { makePack } from 'test/factories/make-package'
import { AvailablePickupPackageUseCase } from '../available-pickup-package'
import { FileType } from '@/core/repositories/photo-params'
import { envSchema } from '@/infra/env/env'
import { config } from 'dotenv'
import { SendNotification } from '@/infra/emails/send-notification'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository'

config({ path: '.env', override: true })

const env = envSchema.parse(process.env)

let usersRepository: PrismaUsersRepository
let packagesRepository: PrismaPackagesRepository
let emailService: SendNotification
let sut: AvailablePickupPackageUseCase

describe('Availble Pickup Pack', () => {
  beforeAll(async () => {
    packagesRepository = new PrismaPackagesRepository(new PrismaService())
    usersRepository = new PrismaUsersRepository(new PrismaService())
    emailService = new SendNotification(
      new PrismaNotificationsRepository(new PrismaService()),
    )

    sut = new AvailablePickupPackageUseCase(
      emailService,
      packagesRepository,
      usersRepository,
    )
  })

  it('should be able to be avalible to pickup a pack', async () => {
    const newUser = makeUser({}, new UniqueEntityID('user-1'))
    const newPack = makePack(
      {
        deliveryPersonId: newUser.id,
        status: PackageStatus.DELIVERED,
      },
      new UniqueEntityID('pack-1'),
    )
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      latitude: -18.8127589,
      longitude: -40.5722593,
      email: 'email',
    } as User)
    vi.spyOn(packagesRepository, 'findById').mockResolvedValueOnce(newPack)
    vi.spyOn(packagesRepository, 'listPackages').mockResolvedValueOnce({
      entities: [],
      newPage: 0,
    })
    vi.spyOn(
      packagesRepository,
      'changeStatusToAvailablePickup',
    ).mockResolvedValueOnce({} as Pack)
    vi.spyOn(emailService, 'send').mockResolvedValueOnce({} as Notification)

    const result = await sut.execute({
      id: newPack.id,
      deliveryPersonId: newUser.id,
      photo: {
        fileName: 'foto-pack-1',
        fileType: FileType.JPG,
        fileBody: Buffer.from(env.BUFFER_IMAGE_TEST, 'base64'),
      },
      location: {
        latitude: -18.8127589,
        longitude: -40.5722593,
      },
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.listPackages).toBeCalledTimes(1)
    expect(packagesRepository.changeStatusToAvailablePickup).toBeCalledTimes(1)
    expect(packagesRepository.changeStatusToAvailablePickup).toBeCalledWith(
      newPack.id,
      {
        fileBody: Buffer.from(env.BUFFER_IMAGE_TEST, 'base64'),
        fileName: 'foto-pack-1',
        fileType: FileType.JPG,
      },
      {
        latitude: -18.8127589,
        longitude: -40.5722593,
      },
    )
    expect(emailService.send).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledWith({
      emails: ['email'],
      title: 'Sua compra está disponível para retirada na transportadora local',
      content: `A compra ${newPack.id} está disponível para retirada na transportadora local`,
    })
  })
})
