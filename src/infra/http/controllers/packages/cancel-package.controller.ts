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
import { DeletePackageUseCase } from '@/domain/delivery/application/use-cases/package/delete-package'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'
import { NotFoundError } from '@/core/errors/errors/not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

const cancelPackageBodySchema = z.object({
  packageId: z.string(),
})

const bodyValidationPipe = new ZodValidationPipe(cancelPackageBodySchema)

type CancelPackageBodySchema = z.infer<typeof cancelPackageBodySchema>

@Controller('/package/cancel')
export class CancelPackageController {
  // eslint-disable-next-line prettier/prettier
  constructor(private cancelPackage: DeletePackageUseCase) { }

  @Patch()
  @HttpCode(204)
  async handle(
    @ExclusiveRoute([UserRole.RECIPIENT]) user: UserPayload,
    @Body(bodyValidationPipe) body: CancelPackageBodySchema,
  ) {
    const { packageId } = body

    const result = await this.cancelPackage.execute({
      packageId,
      recipientId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      if (error instanceof NotFoundError || error instanceof NotAllowedError) {
        throw new ConflictException(error.message)
      } else {
        throw new BadRequestException('Something went wrong')
      }
    }
  }
}
