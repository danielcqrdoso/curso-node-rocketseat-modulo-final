import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Put,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { ChangeUserLocationUseCase } from '@/domain/delivery/application/use-cases/users/change-user-location'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { UserPayload } from '@/infra/auth/jwt.strategy'

const changeLocationBodySchema = z.object({
  id: z.string().optional(),
  latitude: z.coerce.number().refine((value) => {
    return Math.abs(value) <= 90
  }),
  longitude: z.coerce.number().refine((value) => {
    return Math.abs(value) <= 180
  }),
})

const bodyValidationPipe = new ZodValidationPipe(changeLocationBodySchema)

type ChangeLocationBodySchema = z.infer<typeof changeLocationBodySchema>

@Controller('/accounts/change-location')
export class ChangeLocationController {
  // eslint-disable-next-line prettier/prettier
  constructor(private changeLocation: ChangeUserLocationUseCase) { }

  @Put()
  @HttpCode(204)
  async handle(
    @ExclusiveRoute([UserRole.ADMIN, UserRole.RECIPIENT]) user: UserPayload,
    @Body(bodyValidationPipe) body: ChangeLocationBodySchema,
  ) {
    if (user.role === UserRole.RECIPIENT || !body.id) {
      body.id = user.sub
    }

    // There’s no problem with using the user ID as admin, even if it is a recipient, because the ID is correct.
    const result = await this.changeLocation.execute({
      id: body.id,
      adminId: user.sub,
      location: {
        ...body,
      },
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
