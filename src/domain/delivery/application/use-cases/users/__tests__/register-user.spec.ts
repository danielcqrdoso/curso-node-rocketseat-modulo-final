import { RegisterUserUseCase } from '../register-user'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { SendNotification } from '@/infra/emails/send-notification'
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { User, UserRole } from '@/domain/delivery/enterprise/entities/user'
import { NotFoundError } from '@/core/errors/errors/not-found-error'

let usersRepository: PrismaUsersRepository
let fakeHasher: FakeHasher
let emailService: SendNotification
let encrypter: FakeEncrypter

let sut: RegisterUserUseCase

describe('Register User', () => {
  beforeEach(() => {
    usersRepository = new PrismaUsersRepository(new PrismaService())
    fakeHasher = new FakeHasher()
    emailService = new SendNotification(
      new PrismaNotificationsRepository(new PrismaService()),
    )
    encrypter = new FakeEncrypter()

    sut = new RegisterUserUseCase(
      emailService,
      usersRepository,
      fakeHasher,
      encrypter,
    )
  })

  it('should be able to register a new admin', async () => {
    vi.spyOn(usersRepository, 'findByEmail').mockResolvedValueOnce(null)
    vi.spyOn(usersRepository, 'findByCPF').mockResolvedValueOnce(null)
    vi.spyOn(usersRepository, 'create').mockResolvedValueOnce()
    vi.spyOn(emailService, 'send').mockResolvedValueOnce({} as Notification)

    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '123456',
      cpf: '000000000',
      role: UserRole.ADMIN,
      latitude: 0,
      longitude: 0,
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.findByCPF).toBeCalledTimes(1)
    expect(usersRepository.findByEmail).toBeCalledTimes(1)
    expect(usersRepository.create).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledWith({
      emails: ['johndoe@example.com'],
      title: 'Criação de user',
      content: expect.any(String),
    })
  })

  it('should be able to register a new deliver', async () => {
    vi.spyOn(usersRepository, 'findByEmail').mockResolvedValueOnce(null)
    vi.spyOn(usersRepository, 'findByCPF').mockResolvedValueOnce(null)
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      email: 'adminEmail',
      role: 'ADMIN',
    } as User)
    vi.spyOn(usersRepository, 'create').mockResolvedValueOnce()
    vi.spyOn(emailService, 'send').mockResolvedValue({} as Notification)

    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '123456',
      cpf: '000000000',
      role: UserRole.DELIVERYMAN,
      adminId: 'id',
      latitude: 0,
      longitude: 0,
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.findByCPF).toBeCalledTimes(1)
    expect(usersRepository.findByEmail).toBeCalledTimes(1)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(usersRepository.create).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledTimes(2)
    expect(emailService.send).toHaveBeenNthCalledWith(1, {
      emails: ['adminEmail'],
      title: 'Novo Usuário Cadastrado',
      content: expect.any(String),
    })
    expect(emailService.send).toHaveBeenNthCalledWith(2, {
      emails: ['johndoe@example.com'],
      title: 'Criação de user',
      content: expect.any(String),
    })
  })

  it('shouldnt be able to register a new deliver', async () => {
    vi.spyOn(usersRepository, 'findByEmail').mockResolvedValueOnce(null)
    vi.spyOn(usersRepository, 'findByCPF').mockResolvedValueOnce(null)
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      email: 'adminEmail',
      role: 'DELIVERYMAN',
    } as User)
    vi.spyOn(usersRepository, 'create').mockResolvedValueOnce()
    vi.spyOn(emailService, 'send').mockResolvedValue({} as Notification)

    const result = await sut.execute({
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: '123456',
      cpf: '000000000',
      role: UserRole.DELIVERYMAN,
      adminId: 'id',
      latitude: 0,
      longitude: 0,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotFoundError)
    expect(usersRepository.findByCPF).toBeCalledTimes(1)
    expect(usersRepository.findByEmail).toBeCalledTimes(1)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(usersRepository.create).toBeCalledTimes(0)
    expect(emailService.send).toBeCalledTimes(0)
  })
})
