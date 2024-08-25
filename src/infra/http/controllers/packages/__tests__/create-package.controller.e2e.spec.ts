import { AppModule } from '@/infra/app.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import request from 'supertest'
import { UserFactory } from 'test/factories/make-user'
import { ProductFactory } from 'test/factories/make-product'
import { DatabaseModule } from '@/infra/database/database.module'
import dayjs from 'dayjs'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { EmailSender } from '@/domain/notification/application/email-sender/email-sender'
import { Notification } from '@/domain/notification/enterprise/entities/notification'

describe('Create package (E2E) - [POST] /package', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let productFactory: ProductFactory
  let jwt: JwtService
  let emailProvider: EmailSender

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, ProductFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    productFactory = moduleRef.get(ProductFactory)
    jwt = moduleRef.get(JwtService)
    emailProvider = moduleRef.get(EmailSender)
    vi.spyOn(emailProvider, 'send').mockResolvedValue({} as Notification)

    await app.init()
  })

  it('should create a package', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.RECIPIENT })
    const product = await productFactory.makePrismaProduct()

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'RECIPIENT',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/package')
      .send({
        productId: product.id,
        productQuantity: 2,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(201)

    const packageOnDatabase = await prisma.package.findFirst({
      where: {
        recipientId: user.id,
      },
    })

    expect(packageOnDatabase).toBeTruthy()
  })

  it('should return 400 if role is not recipient', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    const product = await productFactory.makePrismaProduct()

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .post('/package')
      .send({
        productId: product.id,
        productQuantity: 2,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)
  })
})
