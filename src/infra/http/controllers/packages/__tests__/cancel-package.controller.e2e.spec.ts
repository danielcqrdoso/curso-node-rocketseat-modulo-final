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
import { PackFactory } from 'test/factories/make-package'

describe('Cancel package (E2E) - [Patch] /package/cancel', () => {
  let app: INestApplication
  let prisma: PrismaService
  let userFactory: UserFactory
  let packFactory: PackFactory
  let productFactory: ProductFactory
  let jwt: JwtService
  let emailProvider: EmailSender

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, ProductFactory, PackFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)
    userFactory = moduleRef.get(UserFactory)
    packFactory = moduleRef.get(PackFactory)
    productFactory = moduleRef.get(ProductFactory)
    jwt = moduleRef.get(JwtService)
    emailProvider = moduleRef.get(EmailSender)
    vi.spyOn(emailProvider, 'send').mockResolvedValue({} as Notification)

    await app.init()
  })

  it('should cancel a package', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.RECIPIENT })
    const product = await productFactory.makePrismaProduct()
    const pack = await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: user.id,
    })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'RECIPIENT',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .patch('/package/cancel')
      .send({
        packageId: pack.id,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(204)

    const packageOnDatabase = await prisma.package.findFirst({
      where: {
        recipientId: user.id,
      },
    })

    expect(packageOnDatabase!.isDeleted).toBeTruthy()
  })

  it('should return 400 if role is not recipient', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    const product = await productFactory.makePrismaProduct()

    const pack = await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: user.id,
    })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .patch('/package/cancel')
      .send({
        packageId: pack.id,
      })
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(400)

    const packageOnDatabase = await prisma.package.findFirst({
      where: {
        recipientId: user.id,
      },
    })

    expect(packageOnDatabase!.isDeleted).toBeFalsy()
  })
})
