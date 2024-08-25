import { FetchUsersUseCase } from '../fetch-users-by-adminid'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { User, UserRole } from '@/domain/delivery/enterprise/entities/user'

let usersRepository: PrismaUsersRepository
let sut: FetchUsersUseCase

describe('Fetch User', () => {
  beforeEach(() => {
    usersRepository = new PrismaUsersRepository(new PrismaService())

    sut = new FetchUsersUseCase(usersRepository)
  })

  it('should be able to fetch a user base on his adminId', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      role: UserRole.ADMIN,
    } as User)
    vi.spyOn(usersRepository, 'listByAdminId').mockResolvedValueOnce({
      entities: [{} as User],
      newPage: 1,
    })

    const result = await sut.execute({
      adminId: 'id',
      paginationParams: {
        limit: 1,
        page: 0,
      },
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(usersRepository.listByAdminId).toBeCalledTimes(1)
  })

  it('shouldnt be able to fetch a user base on his adminId', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      role: UserRole.RECIPIENT,
    } as User)

    const result = await sut.execute({
      adminId: 'id',
      paginationParams: {
        limit: 1,
        page: 0,
      },
    })

    expect(result.isLeft()).toBe(true)
    expect(usersRepository.findById).toBeCalledTimes(1)
  })
})
