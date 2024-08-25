import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { EnvService } from '@/infra/env/env.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { cpf } from 'cpf-cnpj-validator'
import request from 'supertest'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { EmailModule } from '@/infra/emails/email.module'

describe('Create ADMIN Account (E2E) - [POST] /accounts/admin', () => {
  let app: INestApplication
  let prisma: PrismaService
  let env: EnvService
  let emailProvider: EmailSender

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, EmailModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    env = moduleRef.get(EnvService)
    emailProvider = moduleRef.get(EmailSender)
    vi.spyOn(emailProvider, 'send').mockResolvedValue({} as Notification)

    await app.init()
  })

  it('should create a admin account', async () => {
    const response = await request(app.getHttpServer())
      .post('/accounts/admin')
      .send({
        name: 'John Doe',
        cpf: cpf.generate(),
        email: env.get('EMAIL_TEST_RECIPIENT'),
        password: '123456',
        role: 'ADMIN',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })
    expect(response.statusCode).toBe(201)

    const userOnDatabase = await prisma.user.findUnique({
      where: {
        email: env.get('EMAIL_TEST_RECIPIENT'),
      },
    })

    expect(userOnDatabase).toBeTruthy()
  })

  it('should return 400 if email is not valid', async () => {
    const response = await request(app.getHttpServer())
      .post('/accounts/admin')
      .send({
        name: 'John Doe',
        cpf: cpf.generate(),
        email: 'not a email',
        password: '123456',
        role: 'ADMIN',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if cpf is not valid', async () => {
    const response = await request(app.getHttpServer())
      .post('/accounts/admin')
      .send({
        name: 'John Doe',
        cpf: '0000',
        email: env.get('EMAIL_TEST_RECIPIENT'),
        password: '123456',
        role: 'ADMIN',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if role is not valid', async () => {
    const response = await request(app.getHttpServer())
      .post('/accounts/admin')
      .send({
        name: 'John Doe',
        cpf: cpf.generate(),
        email: env.get('EMAIL_TEST_RECIPIENT'),
        password: '123456',
        role: 'not a role',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if role is deliveryman', async () => {
    const response = await request(app.getHttpServer())
      .post('/accounts/admin')
      .send({
        name: 'John Doe',
        cpf: cpf.generate(),
        email: env.get('EMAIL_TEST_RECIPIENT'),
        password: '123456',
        role: 'DELIVERYMAN',
        latitude: -22.5198507,
        longitude: -43.6504454,
      })

    expect(response.statusCode).toBe(400)
  })
})
