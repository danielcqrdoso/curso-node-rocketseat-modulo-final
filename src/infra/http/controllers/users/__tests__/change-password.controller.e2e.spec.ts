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

describe('Change ADMIN/RECIPIENT password (E2E) - [PUT] /accounts/change-password', () => {
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

  it('should change a admin password', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.ADMIN })

    const response = await request(app.getHttpServer())
      .put('/accounts/change-password')
      .send({
        email: user.email,
        password: '123456',
      })

    expect(response.statusCode).toBe(204)
  })

  it('should change a recipient password', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.RECIPIENT })

    const response = await request(app.getHttpServer())
      .put('/accounts/change-password')
      .send({
        cpf: user.cpf,
        password: '123456',
      })

    expect(response.statusCode).toBe(204)
  })

  it('should return 400 if email is not valid', async () => {
    const response = await request(app.getHttpServer())
      .put('/accounts/change-password')
      .send({
        email: 'not a email',
        password: '123456',
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if cpf is not valid', async () => {
    const response = await request(app.getHttpServer())
      .put('/accounts/change-password')
      .send({
        cpf: '0000',
        password: '123456',
      })

    expect(response.statusCode).toBe(400)
  })

  it('should return 400 if role is deliveryman', async () => {
    const user = await userFactory.makePrismaUser({
      role: UserRole.DELIVERYMAN,
    })

    const response = await request(app.getHttpServer())
      .put('/accounts/change-password')
      .send({
        email: user.email,
        password: '123456',
      })

    expect(response.statusCode).toBe(400)
  })
})
