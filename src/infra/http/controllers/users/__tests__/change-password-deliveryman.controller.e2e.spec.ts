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

describe('Change DELIVERYMAN password (E2E) - [PUT] /accounts/deliveryman/change-password', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let emailProvider: EmailSender
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, EmailModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)

    emailProvider = moduleRef.get(EmailSender)
    vi.spyOn(emailProvider, 'send').mockResolvedValue({} as Notification)

    await app.init()
  })

  it('should change a deliveryman password', async () => {
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
      .put('/accounts/deliveryman/change-password')
      .send({
        email: userDeliveryman.email,
        password: '123456',
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)
  })

  it('should return 400 if email is not valid', async () => {
    const userAdmin = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: userAdmin.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .put('/accounts/deliveryman/change-password')
      .send({
        email: 'not a email',
        password: '123456',
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if cpf is not valid', async () => {
    const userAdmin = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: userAdmin.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .put('/accounts/deliveryman/change-password')
      .send({
        cpf: '0000',
        password: '123456',
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if role is deliveryman', async () => {
    const userAdmin = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: userAdmin.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const user = await userFactory.makePrismaUser({
      role: UserRole.DELIVERYMAN,
    })

    const response = await request(app.getHttpServer())
      .put('/accounts/deliveryman/change-password')
      .send({
        email: user.email,
        password: '123456',
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })
})
