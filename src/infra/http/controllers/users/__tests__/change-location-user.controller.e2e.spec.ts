import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { EmailModule } from '@/infra/emails/email.module'
import { UserFactory } from 'test/factories/make-user'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { DatabaseModule } from '@/infra/database/database.module'
import dayjs from 'dayjs'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Change user location (E2E) - [PUT] /accounts/change-location', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let emailProvider: EmailSender
  let jwt: JwtService
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, EmailModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)
    prisma = moduleRef.get(PrismaService)

    emailProvider = moduleRef.get(EmailSender)
    vi.spyOn(emailProvider, 'send').mockResolvedValue({} as Notification)

    await app.init()
  })

  it('should change a deliveryman location', async () => {
    const userAdmin = await userFactory.makePrismaUser()
    const userDeliveryman = await userFactory.makePrismaUser({
      role: UserRole.DELIVERYMAN,
      adminId: userAdmin.id,
    })

    const accessToken = jwt.sign({
      sub: userAdmin.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .put('/accounts/change-location')
      .send({
        latitude: -22.6981097,
        longitude: -42.9395012,
        id: userDeliveryman.id,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    const userOnDatabase = prisma.user.findMany({
      where: {
        latitude: -22.6981097,
      },
    })

    expect(response.statusCode).toBe(204)
    expect(userOnDatabase).toBeTruthy()
  })

  it('should change a admin location', async () => {
    const userAdmin = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: userAdmin.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .put('/accounts/change-location')
      .send({
        latitude: -23.6981097,
        longitude: -42.9395012,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    const userOnDatabase = prisma.user.findMany({
      where: {
        latitude: -23.6981097,
      },
    })

    expect(response.statusCode).toBe(204)
    expect(userOnDatabase).toBeTruthy()
  })
})
