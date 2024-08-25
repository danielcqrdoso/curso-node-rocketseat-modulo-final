import { DeleteUserUseCase } from '../delete-user'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { User, UserRole } from '@/domain/delivery/enterprise/entities/user'
import { SendNotification } from '@/infra/emails/send-notification'
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
// import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

let usersRepository: PrismaUsersRepository
let emailService: SendNotification
let sut: DeleteUserUseCase

describe('Delete User', () => {
  beforeEach(() => {
    usersRepository = new PrismaUsersRepository(new PrismaService())
    emailService = new SendNotification(
      new PrismaNotificationsRepository(new PrismaService()),
    )

    sut = new DeleteUserUseCase(emailService, usersRepository)
  })

  it('should be able to delete a admin', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      email: 'email',
      role: UserRole.ADMIN,
    } as User)
    vi.spyOn(usersRepository, 'delete').mockResolvedValueOnce()
    vi.spyOn(emailService, 'send').mockResolvedValueOnce({} as Notification)

    const result = await sut.execute({
      id: 'user-1',
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.delete).toBeCalledTimes(1)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledWith({
      emails: ['email'],
      title: 'Adeus',
      content: expect.any(String),
    })
  })

  it('should be able to delete a recipient', async () => {
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      email: 'email',
      role: UserRole.RECIPIENT,
    } as User)
    vi.spyOn(usersRepository, 'delete').mockResolvedValueOnce()
    vi.spyOn(emailService, 'send').mockResolvedValueOnce({} as Notification)

    const result = await sut.execute({
      id: 'user-1',
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.delete).toBeCalledTimes(1)
    expect(usersRepository.findById).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledTimes(1)
    expect(emailService.send).toBeCalledWith({
      emails: ['email'],
      title: 'Adeus',
      content: expect.any(String),
    })
  })

  it('should be able to delete a deliveryman', async () => {
    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        email: 'email',
        role: UserRole.DELIVERYMAN,
        adminId: 'id',
      } as User)
      .mockResolvedValueOnce({
        email: 'adminEmail',
        role: UserRole.ADMIN,
        id: 'user-1',
      } as User)

    vi.spyOn(usersRepository, 'delete').mockResolvedValueOnce()
    vi.spyOn(emailService, 'send').mockResolvedValue({} as Notification)

    const result = await sut.execute({
      id: 'user-1',
      adminId: 'id',
    })

    expect(result.isRight()).toBe(true)
    expect(usersRepository.delete).toBeCalledTimes(1)
    expect(usersRepository.findById).toBeCalledTimes(2)
    expect(emailService.send).toBeCalledTimes(2)
    expect(emailService.send).toHaveBeenNthCalledWith(1, {
      emails: ['email'],
      title: 'Adeus',
      content: expect.any(String),
    })
    expect(emailService.send).toHaveBeenNthCalledWith(2, {
      emails: ['adminEmail'],
      title: 'Usuário deletado',
      content: expect.any(String),
      adminId: expect.any(String),
    })
  })

  it('shouldnt be able to delete a deliveryman', async () => {
    vi.spyOn(usersRepository, 'findById')
      .mockResolvedValueOnce({
        email: 'email',
        role: UserRole.DELIVERYMAN,
        adminId: 'id',
      } as User)
      .mockResolvedValueOnce({
        email: 'adminEmail',
        role: UserRole.ADMIN,
        id: 'user-id',
      } as User)

    vi.spyOn(usersRepository, 'delete').mockResolvedValueOnce()
    vi.spyOn(emailService, 'send').mockResolvedValue({} as Notification)

    const result = await sut.execute({
      id: 'user-1',
      adminId: 'not adminid',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(emailService.send).toBeCalledTimes(0)
  })
})
