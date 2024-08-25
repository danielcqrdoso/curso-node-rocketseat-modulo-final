import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { FetchUsersUseCase } from '@/domain/delivery/application/use-cases/users/fetch-users-by-adminid'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UserPayload } from '@/infra/auth/jwt.strategy'

const findUserBodySchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).optional().default(10),
})

const bodyValidationPipe = new ZodValidationPipe(findUserBodySchema)

type FindUserBodySchema = z.infer<typeof findUserBodySchema>

@Controller('/accounts/find-by-admin')
export class FindUsersByAdminIdController {
  // eslint-disable-next-line prettier/prettier
  constructor(private findUser: FetchUsersUseCase) { }

  @Post()
  @HttpCode(200)
  async handle(
    @Body(bodyValidationPipe) body: FindUserBodySchema,
    @ExclusiveRoute([UserRole.ADMIN]) user: UserPayload,
  ) {
    const result = await this.findUser.execute({
      adminId: user.sub,
      paginationParams: {
        ...body,
      },
    })

    if (result.isLeft()) {
      throw new BadRequestException('Something went wrong')
    }

    return result
  }
}
