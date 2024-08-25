import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CreatePackageUseCase } from '@/domain/delivery/application/use-cases/package/create-package'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'
import { NotFoundError } from '@/core/errors/errors/not-found-error'

const createPackageBodySchema = z.object({
  productId: z.string(),
  productQuantity: z.coerce.number().int().min(1),
})

const bodyValidationPipe = new ZodValidationPipe(createPackageBodySchema)

type CreatePackageBodySchema = z.infer<typeof createPackageBodySchema>

@Controller('/package')
export class CreatePackageController {
  // eslint-disable-next-line prettier/prettier
  constructor(private createPackage: CreatePackageUseCase) { }

  @Post()
  @HttpCode(201)
  async handle(
    @ExclusiveRoute([UserRole.RECIPIENT]) user: UserPayload,
    @Body(bodyValidationPipe) body: CreatePackageBodySchema,
  ) {
    const result = await this.createPackage.execute({
      ...body,
      recipientId: user.sub,
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
