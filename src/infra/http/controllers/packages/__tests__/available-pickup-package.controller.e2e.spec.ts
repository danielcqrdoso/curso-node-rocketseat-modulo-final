import { AppModule } from '@/infra/app.module'
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
import { EnvService } from '@/infra/env/env.service'
import { PackageStatus } from '@/domain/delivery/enterprise/entities/package'

describe('Available to Pickup package (E2E) - [Patch] /package/available-pickup', () => {
  let app: INestApplication
  let userFactory: UserFactory
  let packFactory: PackFactory
  let productFactory: ProductFactory
  let jwt: JwtService
  let env: EnvService
  let emailProvider: EmailSender

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, ProductFactory, PackFactory],
    }).compile()

    app = moduleRef.createNestApplication()

    userFactory = moduleRef.get(UserFactory)
    packFactory = moduleRef.get(PackFactory)
    productFactory = moduleRef.get(ProductFactory)
    jwt = moduleRef.get(JwtService)
    env = moduleRef.get(EnvService)
    emailProvider = moduleRef.get(EmailSender)
    vi.spyOn(emailProvider, 'send').mockResolvedValue({} as Notification)

    await app.init()
  })

  it('should available to pickup a package', async () => {
    const recipient = await userFactory.makePrismaUser({
      role: UserRole.RECIPIENT,
    })
    const deliveryPerson = await userFactory.makePrismaUser({
      role: UserRole.DELIVERYMAN,
    })
    const product = await productFactory.makePrismaProduct()
    const pack = await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: recipient.id,
      deliveryPersonId: deliveryPerson.id,
      status: PackageStatus.DELIVERED,
    })

    const accessToken = jwt.sign({
      sub: deliveryPerson.id,
      role: 'DELIVERYMAN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .patch('/package/available-pickup')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('packageId', pack.id.toString())
      .field('latitude', '-22.5198507')
      .field('longitude', '-43.6504454')
      .attach(
        'file',
        Buffer.from(env.get('BUFFER_IMAGE_TEST'), 'base64'),
        'test-image.png',
      )

    expect(response.statusCode).toBe(204)
  })

  it('should return 400 if role is not deliveryPerson', async () => {
    const user = await userFactory.makePrismaUser({ role: UserRole.ADMIN })
    const product = await productFactory.makePrismaProduct()

    const pack = await packFactory.makePrismaPack({
      productId: product.id,
      recipientId: user.id,
      deliveryPersonId: user.id,
    })

    const accessToken = jwt.sign({
      sub: user.id,
      role: 'ADMIN',
      exp: dayjs().add(1, 'hour').unix(),
    })

    const response = await request(app.getHttpServer())
      .patch('/package/available-pickup')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('packageId', pack.id.toString())
      .field('latitude', '-22.5198507')
      .field('longitude', '-43.6504454')
      .attach(
        'file',
        Buffer.from(env.get('BUFFER_IMAGE_TEST'), 'base64'),
        'test-image.png',
      )

    expect(response.statusCode).toBe(400)
  })
})
