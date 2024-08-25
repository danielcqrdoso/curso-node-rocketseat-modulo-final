import { FakeHasher } from 'test/cryptography/fake-hasher'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { AuthenticateUserUseCase } from '../authenticate-user'
import { makeUser } from 'test/factories/make-user'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

let usersRepository: PrismaUsersRepository
let fakeHasher: FakeHasher
let encrypter: FakeEncrypter

let sut: AuthenticateUserUseCase

describe('Authenticate User', () => {
  beforeEach(() => {
    usersRepository = new PrismaUsersRepository(new PrismaService())
    fakeHasher = new FakeHasher()
    encrypter = new FakeEncrypter()

    sut = new AuthenticateUserUseCase(usersRepository, fakeHasher, encrypter)
  })

  it('should be able to authenticate a user with cpf', async () => {
    const user = makeUser({
      cpf: '00000000',
      password: await fakeHasher.hash('123456'),
    })
    vi.spyOn(usersRepository, 'findByCPF').mockResolvedValueOnce(user)

    const result = await sut.execute({
      cpf: '00000000',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.findByCPF).toBeCalledTimes(1)
    expect(usersRepository.findByCPF).toBeCalledWith('00000000')
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })
  })

  it('should be able to authenticate a user with email', async () => {
    const user = makeUser({
      email: 'email',
      password: await fakeHasher.hash('123456'),
    })
    vi.spyOn(usersRepository, 'findByEmail').mockResolvedValueOnce(user)

    const result = await sut.execute({
      email: 'email',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.findByEmail).toBeCalledTimes(1)
    expect(usersRepository.findByEmail).toBeCalledWith('email')
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })
  })
})
