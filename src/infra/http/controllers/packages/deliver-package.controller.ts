import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Patch,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { DeliverPackageUseCase } from '@/domain/delivery/application/use-cases/package/deliver-package'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'
import { NotFoundError } from '@/core/errors/errors/not-found-error'

const deliverPackageBodySchema = z.object({
  packageId: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(deliverPackageBodySchema)

type DeliverPackageBodySchema = z.infer<typeof deliverPackageBodySchema>

@Controller('/package/deliver')
export class DeliverPackageController {
  // eslint-disable-next-line prettier/prettier
  constructor(private deliverPackage: DeliverPackageUseCase) { }

  @Patch()
  @HttpCode(204)
  async handle(
    @ExclusiveRoute([UserRole.DELIVERYMAN]) user: UserPayload,
    @Body(bodyValidationPipe) body: DeliverPackageBodySchema,
  ) {
    const { packageId } = body

    const result = await this.deliverPackage.execute({
      id: packageId,
      deliveryPersonId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case NotFoundError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
