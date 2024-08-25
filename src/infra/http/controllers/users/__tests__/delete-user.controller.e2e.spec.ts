import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { DatabaseModule } from '@/infra/database/database.module'
import dayjs from 'dayjs'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { EmailModule } from '@/infra/emails/email.module'
import { Notification } from '@/domain/notification/enterprise/entities/notification'

describe('Delete Account (E2E) - [DELETE] /accounts/delete', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let jwt: JwtService
  let emailProvider: EmailSender

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, EmailModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)
    emailProvider = moduleRef.get(EmailSender)
    vi.spyOn(emailProvider, 'send').mockResolvedValue({} as Notification)

    await app.init()
  })

  it('should delete a ADMIN account', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .delete(`/accounts/delete/${user.id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
    })

    expect(userOnDatabase).toBeNull()
  })

  it('should delete a DELIVERYMAN account', async () => {
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
      .delete(`/accounts/delete/${userDeliveryman.id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        id: userDeliveryman.id,
      },
    })

    expect(userOnDatabase).toBeNull()
  })

  it('should return 401 if route is not authenticated', async () => {
    const user = await userFactory.makePrismaUser()

    const response = await request(app.getHttpServer()).delete(
      `/accounts/delete/${user.id}`,
    )

    expect(response.statusCode).toBe(401)
  })
})
