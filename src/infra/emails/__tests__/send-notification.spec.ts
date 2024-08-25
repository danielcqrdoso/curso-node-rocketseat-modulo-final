import { SendNotification } from '../send-notification'
import { envSchema } from '@/infra/env/env'
import { config } from 'dotenv'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { PrismaNotificationsRepository } from '@/infra/database/prisma/repositories/prisma-notifications-repository'
import { Notification } from '@/domain/notification/enterprise/entities/notification'

config({ path: '.env', override: true })

const env = envSchema.parse(process.env)

let notificationsRepository: PrismaNotificationsRepository
let sut: SendNotification

describe.skip('Send Notification', () => {
  beforeEach(() => {
    notificationsRepository = new PrismaNotificationsRepository(
      new PrismaService(),
    )

    sut = new SendNotification(notificationsRepository)
  })

  it('should be able to send a notification', async () => {
    vi.spyOn(notificationsRepository, 'create').mockResolvedValueOnce()

    const result = await sut.send({
      emails: [env.EMAIL_TEST_RECIPIENT],
      title: 'Nova notificação',
      content: 'Conteúdo da notificação',
    })

    expect(result).toBeInstanceOf(Notification)
    expect(notificationsRepository.create).toBeCalledTimes(1)
    expect(notificationsRepository.create).toBeCalledWith(result)
  })
})
