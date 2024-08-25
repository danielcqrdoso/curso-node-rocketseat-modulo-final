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
import { PickupPackageUseCase } from '../pickup-package'
import { FileType } from '@/core/repositories/photo-params'
import { envSchema } from '@/infra/env/env'
import { config } from 'dotenv'

config({ path: '.env', override: true })

const env = envSchema.parse(process.env)

let usersRepository: PrismaUsersRepository
let packagesRepository: PrismaPackagesRepository
let sut: PickupPackageUseCase

describe('Pickup Pack', () => {
  beforeAll(async () => {
    packagesRepository = new PrismaPackagesRepository(new PrismaService())
    usersRepository = new PrismaUsersRepository(new PrismaService())

    sut = new PickupPackageUseCase(packagesRepository, usersRepository)
  })

  it('should be able to pickup a pack', async () => {
    const newUser = makeUser({}, new UniqueEntityID('user-1'))
    const newPack = makePack({}, new UniqueEntityID('pack-1'))
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      latitude: -18.8127589,
      longitude: -40.5722593,
    } as User)
    vi.spyOn(packagesRepository, 'findById').mockResolvedValueOnce({
      deliveryPersonId: newUser.id,
      isDeleted: false,
      status: PackageStatus.AVAILABLE_PICKUP,
    } as Pack)
    vi.spyOn(packagesRepository, 'listPackages').mockResolvedValueOnce({
      entities: [],
      newPage: 0,
    })
    vi.spyOn(packagesRepository, 'changeStatusToPickup').mockResolvedValueOnce(
      {} as Pack,
    )

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
    expect(packagesRepository.changeStatusToPickup).toBeCalledTimes(1)
    expect(packagesRepository.changeStatusToPickup).toBeCalledWith(
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
  })
})
