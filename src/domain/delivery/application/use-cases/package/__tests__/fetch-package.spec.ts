import { FetchPackageUseCase } from '../fetch-package'
import { PrismaPackagesRepository } from '@/infra/database/prisma/repositories/prisma-packages-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import {
  Pack,
  PackageStatus,
} from '@/domain/delivery/enterprise/entities/package'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { User } from '@/domain/delivery/enterprise/entities/user'

let usersRepository: PrismaUsersRepository
let packagesRepository: PrismaPackagesRepository
let sut: FetchPackageUseCase

describe('Fetch packages', () => {
  beforeEach(() => {
    packagesRepository = new PrismaPackagesRepository(new PrismaService())
    usersRepository = new PrismaUsersRepository(new PrismaService())

    sut = new FetchPackageUseCase(usersRepository, packagesRepository)
  })

  it('should be able to fetch packages by id', async () => {
    vi.spyOn(packagesRepository, 'findById').mockResolvedValueOnce({
      recipientId: 'id',
    } as Pack)

    const result = await sut.execute({
      id: 'id',
      filters: {
        recipientId: 'id',
      },
    })

    expect(result.isRight()).toBe(true)
    expect(packagesRepository.findById).toBeCalledTimes(1)
    expect(packagesRepository.findById).toBeCalledWith('id')
  })

  it('should be able to fetch packages by filters', async () => {
    vi.spyOn(packagesRepository, 'listPackages').mockResolvedValueOnce({
      entities: [{} as Pack],
      newPage: 0,
    })

    const result = await sut.execute({
      filters: {
        status: PackageStatus.AVAILABLE_PICKUP,
        deliveryPersonId: 'id',
      },
    })

    expect(result.isRight()).toBe(true)
    expect(packagesRepository.listPackages).toBeCalledTimes(1)
    expect(packagesRepository.listPackages).toBeCalledWith({
      status: PackageStatus.AVAILABLE_PICKUP,
      deliveryPersonId: 'id',
    })
  })

  it('shouldnt be able to fetch packages because admin is not valid', async () => {
    vi.spyOn(packagesRepository, 'listPackages').mockResolvedValueOnce({
      entities: [{} as Pack],
      newPage: 0,
    })
    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({} as User)
      .mockResolvedValueOnce({ adminId: 'notAdminId' } as User)

    const result = await sut.execute({
      adminId: 'adminId',
      filters: {
        status: PackageStatus.AVAILABLE_PICKUP,
        deliveryPersonId: 'id',
      },
    })

    expect(result.isLeft()).toBe(true)
    expect(packagesRepository.listPackages).toBeCalledTimes(0)
  })

  it('shouldnt be able to fetch packages because theres no deliveryperson or recipient', async () => {
    vi.spyOn(packagesRepository, 'listPackages').mockResolvedValueOnce({
      entities: [{} as Pack],
      newPage: 0,
    })

    const result = await sut.execute({
      filters: {
        status: PackageStatus.AVAILABLE_PICKUP,
      },
    })

    expect(result.isLeft()).toBe(true)
    expect(packagesRepository.listPackages).toBeCalledTimes(0)
  })
})
