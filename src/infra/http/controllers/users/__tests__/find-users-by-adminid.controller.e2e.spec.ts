import { AppModule } from '@/infra/app.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { DatabaseModule } from '@/infra/database/database.module'
import dayjs from 'dayjs'

describe('Find Users by admin (E2E) - [post] /accounts/find-by-admin', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    userFactory = moduleRef.get(UserFactory)
    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  it('should find users by ADMINID', async () => {
    const admin = await userFactory.makePrismaUser()
    const user = await userFactory.makePrismaUser({ adminId: admin.id })

    const accessToken = jwt.sign({
      sub: admin.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post(`/accounts/find-by-admin`)
      .send({
        page: '0',
        limit: '1',
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
    expect(response.body.value.entities[0].props.id).toBe(user.id)
  })

  it('should return 401 if route is not authenticated', async () => {
    await userFactory.makePrismaUser()

    const response = await request(app.getHttpServer())
      .post(`/accounts/find-by-admin`)
      .send({
        page: '1',
        limit: '1',
      })

    expect(response.statusCode).toBe(401)
  })
})
