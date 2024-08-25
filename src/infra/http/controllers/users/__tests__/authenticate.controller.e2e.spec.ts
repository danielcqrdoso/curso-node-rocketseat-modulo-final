import { AppModule } from '@/infra/app.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { hash } from 'bcryptjs'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { Notification } from '@/domain/notification/enterprise/entities/notification'
import { EmailModule } from '@/infra/emails/email.module'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'

describe('Authenticate (E2E) - [POST] /accounts/sessions', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let emailProvider: EmailSender

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, EmailModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    userFactory = moduleRef.get(UserFactory)
    emailProvider = moduleRef.get(EmailSender)
    vi.spyOn(emailProvider, 'send').mockResolvedValue({} as Notification)
    await app.init()
  })

  it('should authenticate user', async () => {
    await userFactory.makePrismaUser({
      email: 'johndoe@example.com',
      password: await hash('123456', 8),
    })

    const response = await request(app.getHttpServer())
      .post('/accounts/sessions')
      .send({
        email: 'johndoe@example.com',
        password: '123456',
      })

    expect(response.statusCode).toBe(201)
    expect(response.body).toEqual({
      access_token: expect.any(String),
    })
  })

  it('shouldnt authenticate user because dont have cpf and email', async () => {
    await userFactory.makePrismaUser({
      email: 'johndoe2@example.com',
      password: await hash('123456', 8),
    })

    const response = await request(app.getHttpServer())
      .post('/accounts/sessions')
      .send({
        password: '123456',
      })

    expect(response.statusCode).toBe(400)
  })
})
