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
import { FetchNotificationUseCase } from '@/domain/notification/application/use-cases/fetch-notification'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UserPayload } from '@/infra/auth/jwt.strategy'
import { ParamsNotProvidedError } from '@/core/errors/errors/params-not-provided-error'
import { NotFoundError } from '@/core/errors/errors/not-found-error'

const findNotificationBodySchema = z.object({
  email: z.string().email().optional(),
  title: z.string().optional(),
  page: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).optional().default(10),
})

const bodyValidationPipe = new ZodValidationPipe(findNotificationBodySchema)

type FindNotificationBodySchema = z.infer<typeof findNotificationBodySchema>

@Controller('/notification/list')
export class FindNotificationsController {
  // eslint-disable-next-line prettier/prettier
  constructor(private findNotification: FetchNotificationUseCase) { }

  @Post()
  @HttpCode(200)
  async handle(
    @Body(bodyValidationPipe) body: FindNotificationBodySchema,
    @ExclusiveRoute([UserRole.ADMIN]) user: UserPayload,
  ) {
    const result = await this.findNotification.execute({
      ...body,
      adminId: user.sub,
    })

    if (result.isLeft()) {
      const error = result.value

      if (
        error instanceof NotFoundError ||
        error instanceof ParamsNotProvidedError
      ) {
        throw new ConflictException(error.message)
      } else {
        throw new BadRequestException('Something went wrong')
      }
    }

    return result
  }
}
