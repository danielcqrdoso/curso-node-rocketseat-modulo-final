import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { DatabaseModule } from '@/infra/database/database.module'
import dayjs from 'dayjs'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { NotificationFactory } from 'test/factories/make-notification'

describe('List notification (E2E) - [POST] /notification/list', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let notificationFactory: NotificationFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, NotificationFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    userFactory = moduleRef.get(UserFactory)
    notificationFactory = moduleRef.get(NotificationFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  it('should list a notification base on title', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    await notificationFactory.makePrismaNotification({
      adminId: user.id,
      title: 'title',
      emails: ['email'],
    })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/notification/list')
      .send({
        title: 'title',
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)

    expect(response.body.value.entities.length).toBe(1)
    expect(response.body.value.entities[0].props.emails[0]).toBe('email')
  })

  it('should list a notification base on email', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    await notificationFactory.makePrismaNotification({
      adminId: user.id,
      title: 'title',
      emails: ['email@gmail.com'],
    })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/notification/list')
      .send({
        email: 'email@gmail.com',
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)

    expect(response.body.value.entities.length).toBe(1)
    expect(response.body.value.entities[0].props.title).toBe('title')
  })

  it('shouldnt list a notification because it dont passa title or email', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/notification/list')
      .send({})
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(409)
  })
})
