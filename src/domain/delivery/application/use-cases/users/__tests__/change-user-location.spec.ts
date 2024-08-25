import { ChangeUserLocationUseCase } from '../change-user-location'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { User } from '@/domain/delivery/enterprise/entities/user'
import { faker } from '@faker-js/faker'

let usersRepository: PrismaUsersRepository

let sut: ChangeUserLocationUseCase

describe('Change User Location', () => {
  beforeEach(() => {
    usersRepository = new PrismaUsersRepository(new PrismaService())

    sut = new ChangeUserLocationUseCase(usersRepository)
  })

  it('should be able to change a user location', async () => {
    const location = {
      latitude: faker.location.latitude(),
      longitude: faker.location.longitude(),
    }
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({} as User)
    vi.spyOn(usersRepository, 'update').mockResolvedValueOnce({} as User)

    const result = await sut.execute({
      id: 'id',
      location,
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(usersRepository.update).toBeCalledTimes(1)
    expect(usersRepository.update).toBeCalledWith('id', {
      ...location,
    })
  })
})
