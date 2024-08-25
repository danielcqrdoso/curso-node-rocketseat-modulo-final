import { ChangeUserPasswordUseCase } from '../change-user-password'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { User, UserRole } from '@/domain/delivery/enterprise/entities/user'

let usersRepository: PrismaUsersRepository
let fakeHasher: FakeHasher

let sut: ChangeUserPasswordUseCase

describe('Change User Password', () => {
  beforeEach(() => {
    usersRepository = new PrismaUsersRepository(new PrismaService())
    fakeHasher = new FakeHasher()

    sut = new ChangeUserPasswordUseCase(usersRepository, fakeHasher)
  })

  it('should be able to change a user passoword', async () => {
    vi.spyOn(usersRepository, 'findByEmail').mockResolvedValueOnce({
      id: 'id',
      role: UserRole.ADMIN,
    } as User)
    vi.spyOn(usersRepository, 'update').mockResolvedValueOnce({
      id: 'id',
    } as User)

    const result = await sut.execute({
      email: 'johndoe@example.com',
      password: '123456',
    })

    const fakePassword = await fakeHasher.hash('123456')

    expect(result.isRight()).toBe(true)
    expect(usersRepository.findByEmail).toBeCalledTimes(1)
    expect(usersRepository.update).toBeCalledTimes(1)
    expect(usersRepository.update).toBeCalledWith('id', {
      password: fakePassword,
    })
  })
})
