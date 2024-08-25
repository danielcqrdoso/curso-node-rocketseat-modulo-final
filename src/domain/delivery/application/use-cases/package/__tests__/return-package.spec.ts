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
import { ReturnPackageUseCase } from '../return-package'
import { FileType } from '@/core/repositories/photo-params'
import { envSchema } from '@/infra/env/env'
import { config } from 'dotenv'
import { PassedDealineError } from '../../../../../../core/errors/errors/passed-deadline-error'
import { SendNotification } from '@/infra/emails/send-notification'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

config({ path: '.env', override: true })

const env = envSchema.parse(process.env)

let usersRepository: PrismaUsersRepository
let packagesRepository: PrismaPackagesRepository
let sut: ReturnPackageUseCase
let emailService: SendNotification

describe('Return Pack', () => {
  beforeAll(async () => {
    packagesRepository = new PrismaPackagesRepository(new PrismaService())
    usersRepository = new PrismaUsersRepository(new PrismaService())
    emailService = new SendNotification(
      new PrismaNotificationsRepository(new PrismaService()),
    )

    sut = new ReturnPackageUseCase(
      emailService,
      packagesRepository,
      usersRepository,
    )
  })

  it('should be able to return a pack', async () => {
    const newUser = makeUser({}, new UniqueEntityID('user-1'))
    const newPack = makePack({}, new UniqueEntityID('pack-1'))
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      email: 'email',
      latitude: -18.8127589,
      longitude: -40.5722593,
    } as User)
    vi.spyOn(packagesRepository, 'findById').mockResolvedValueOnce({
      pickupAt: new Date(),
      recipientId: newUser.id,
      status: PackageStatus.PICKUP,
    } as Pack)
    vi.spyOn(packagesRepository, 'listPackages').mockResolvedValueOnce({
      entities: [],
      newPage: 0,
    })
    vi.spyOn(
      packagesRepository,
      'changeStatusToReturned',
    ).mockResolvedValueOnce({} as Pack)
    vi.spyOn(emailService, 'send').mockResolvedValueOnce({} as Notification)

    const result = await sut.execute({
      id: newPack.id,
      recipientPersonId: newUser.id,
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
    expect(packagesRepository.changeStatusToReturned).toBeCalledTimes(1)
    expect(packagesRepository.changeStatusToReturned).toBeCalledWith(
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
      title: 'Informações sobre o retorno',
      content: 'O pedido de reembolso foi realizado com sucesso',
    })
  })

  it('shouldnt be able to return a pack because passed deadline', async () => {
    const newUser = makeUser({}, new UniqueEntityID('user-1'))
    const newPack = makePack({}, new UniqueEntityID('pack-1'))
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      latitude: -18.8127589,
      longitude: -40.5722593,
    } as User)
    vi.spyOn(packagesRepository, 'findById').mockResolvedValueOnce({
      pickupAt: new Date('1900-01-23'),
      recipientId: newUser.id,
      status: PackageStatus.PICKUP,
    } as Pack)
    vi.spyOn(packagesRepository, 'listPackages').mockResolvedValueOnce({
      entities: [],
      newPage: 0,
    })
    vi.spyOn(
      packagesRepository,
      'changeStatusToReturned',
    ).mockResolvedValueOnce({} as Pack)

    const result = await sut.execute({
      id: newPack.id,
      recipientPersonId: newUser.id,
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

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(PassedDealineError)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.listPackages).toBeCalledTimes(0)
    expect(packagesRepository.changeStatusToReturned).toBeCalledTimes(0)
  })

  it('shouldnt be able to return a pack because recipientId isnt match', async () => {
    const newUser = makeUser({}, new UniqueEntityID('user-1'))
    const newPack = makePack({}, new UniqueEntityID('pack-1'))
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      latitude: -18.8127589,
      longitude: -40.5722593,
    } as User)
    vi.spyOn(packagesRepository, 'findById').mockResolvedValueOnce({
      pickupAt: new Date('1900-01-23'),
      recipientId: 'id',
      status: PackageStatus.PICKUP,
    } as Pack)
    vi.spyOn(packagesRepository, 'listPackages').mockResolvedValueOnce({
      entities: [],
      newPage: 0,
    })
    vi.spyOn(
      packagesRepository,
      'changeStatusToReturned',
    ).mockResolvedValueOnce({} as Pack)

    const result = await sut.execute({
      id: newPack.id,
      recipientPersonId: newUser.id,
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

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.listPackages).toBeCalledTimes(0)
    expect(packagesRepository.changeStatusToReturned).toBeCalledTimes(0)
  })

  it('shouldnt be able to return a pack because status isnt pickup', async () => {
    const newUser = makeUser({}, new UniqueEntityID('user-1'))
    const newPack = makePack({}, new UniqueEntityID('pack-1'))
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      latitude: -18.8127589,
      longitude: -40.5722593,
    } as User)
    vi.spyOn(packagesRepository, 'findById').mockResolvedValueOnce({
      pickupAt: new Date('1900-01-23'),
      recipientId: newUser.id,
      status: PackageStatus.WAITING,
    } as Pack)
    vi.spyOn(packagesRepository, 'listPackages').mockResolvedValueOnce({
      entities: [],
      newPage: 0,
    })
    vi.spyOn(
      packagesRepository,
      'changeStatusToReturned',
    ).mockResolvedValueOnce({} as Pack)

    const result = await sut.execute({
      id: newPack.id,
      recipientPersonId: newUser.id,
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

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.listPackages).toBeCalledTimes(0)
    expect(packagesRepository.changeStatusToReturned).toBeCalledTimes(0)
  })
})
