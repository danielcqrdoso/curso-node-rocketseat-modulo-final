import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvService } from '@/infra/env/env.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { cpf } from 'cpf-cnpj-validator'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { faker } from '@faker-js/faker'
import { DatabaseModule } from '@/infra/database/database.module'
import dayjs from 'dayjs'
import { EmailModule } from '@/infra/emails/email.module'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { Notification } from '@/domain/notification/enterprise/entities/notification'

describe('Create DELIVERYMAN Account (E2E) - [POST] /accounts/deliveryman', () => {
  let app: INestApplication
  let prisma: PrismaService
  let env: EnvService
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
    env = moduleRef.get(EnvService)
    jwt = moduleRef.get(JwtService)
    emailProvider = moduleRef.get(EmailSender)
    vi.spyOn(emailProvider, 'send').mockResolvedValue({} as Notification)

    await app.init()
  })

  it('should create a deliveryman account', async () => {
    const email = faker.internet.email()
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/accounts/deliveryman')
      .send({
        name: 'John Doe',
        cpf: cpf.generate(),
        email,
        password: '123456',
        role: 'DELIVERYMAN',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(201)

    const [userOnDatabase, userOnDatabase2] = await Promise.all([
      prisma.user.findUnique({
        where: {
          email,
        },
      }),
      prisma.user.findMany({
        where: {
          adminId: user.id,
        },
      }),
    ])

    expect(userOnDatabase).toBeTruthy()
    expect(userOnDatabase2).toBeTruthy()
  })

  it('should return 400 if email is not valid', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })
    const response = await request(app.getHttpServer())
      .post('/accounts/deliveryman')
      .send({
        name: 'John Doe',
        cpf: cpf.generate(),
        email: 'not a email',
        password: '123456',
        role: 'DELIVERYMAN',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if cpf is not valid', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })
    const response = await request(app.getHttpServer())
      .post('/accounts/deliveryman')
      .send({
        name: 'John Doe',
        cpf: '0000',
        email: env.get('EMAIL_TEST_RECIPIENT'),
        password: '123456',
        role: 'DELIVERYMAN',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if role is not valid', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })
    const response = await request(app.getHttpServer())
      .post('/accounts/deliveryman')
      .send({
        name: 'John Doe',
        cpf: cpf.generate(),
        email: env.get('EMAIL_TEST_RECIPIENT'),
        password: '123456',
        role: 'not a role',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if role is admin', async () => {
    const user = await userFactory.makePrismaUser()

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })
    const response = await request(app.getHttpServer())
      .post('/accounts/deliveryman')
      .send({
        name: 'John Doe',
        cpf: cpf.generate(),
        email: env.get('EMAIL_TEST_RECIPIENT'),
        password: '123456',
        role: 'ADMIN',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })
})
