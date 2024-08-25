import { FetchNotificationUseCase } from '../fetch-notification'
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { PrismaUsersRepository } from '@/infra/database/prisma/repositories/prisma-users-repository'
import { User, UserRole } from '@/domain/delivery/enterprise/entities/user'
import { NotFoundError } from '@/core/errors/errors/not-found-error'

let notificationsRepository: PrismaNotificationsRepository
let usersRepository: PrismaUsersRepository
let sut: FetchNotificationUseCase

describe('Fetch notifications', () => {
  beforeEach(() => {
    notificationsRepository = new PrismaNotificationsRepository(
      new PrismaService(),
    )
    usersRepository = new PrismaUsersRepository(new PrismaService())

    sut = new FetchNotificationUseCase(notificationsRepository, usersRepository)
  })

  it('should be able to fetch notifications by email', async () => {
    vi.spyOn(
      notificationsRepository,
      'listNotifications',
    ).mockResolvedValueOnce({
      entities: [{} as Notification],
      newPage: 1,
    })
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      role: UserRole.ADMIN,
    } as User)

    const result = await sut.execute({
      email: 'email',
      adminId: 'id',
    })

    expect(result.isRight()).toBe(true)
    expect(notificationsRepository.listNotifications).toBeCalledTimes(1)
    expect(notificationsRepository.listNotifications).toBeCalledWith({
      adminId: 'id',
      email: 'email',
    })
  })

  it('should be able to fetch notifications by title', async () => {
    vi.spyOn(
      notificationsRepository,
      'listNotifications',
    ).mockResolvedValueOnce({
      entities: [{} as Notification],
      newPage: 1,
    })
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      role: UserRole.ADMIN,
    } as User)

    const result = await sut.execute({
      title: 'title',
      adminId: 'id',
    })

    expect(result.isRight()).toBe(true)
    expect(notificationsRepository.listNotifications).toBeCalledTimes(1)
    expect(notificationsRepository.listNotifications).toBeCalledWith({
      adminId: 'id',
      title: 'title',
    })
  })

  it('shouldnt be able to fetch notifications ', async () => {
    vi.spyOn(
      notificationsRepository,
      'listNotifications',
    ).mockResolvedValueOnce({
      entities: [{} as Notification],
      newPage: 1,
    })
    vi.spyOn(usersRepository, 'findById').mockResolvedValueOnce({
      role: UserRole.DELIVERYMAN,
    } as User)

    const result = await sut.execute({
      title: 'title',
      adminId: 'id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotFoundError)
  })
})
