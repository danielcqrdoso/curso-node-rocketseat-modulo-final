import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Put,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { ChangeUserPasswordUseCase } from '@/domain/delivery/application/use-cases/users/change-user-password'
import { Cpf } from '@/core/entities/cpf'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'
import { UserPayload } from '@/infra/auth/jwt.strategy'

const changePasswordBodySchema = z.object({
  password: z.string(),
  email: z.string().email().optional(),
  cpf: z
    .string()
    .refine(Cpf.isValid, {
      message: 'Invalid Document',
    })
    .optional(),
})

const bodyValidationPipe = new ZodValidationPipe(changePasswordBodySchema)

type ChangePasswordBodySchema = z.infer<typeof changePasswordBodySchema>

@Controller('/accounts/deliveryman/change-password')
export class ChangeDeliverymanPasswordController {
  // eslint-disable-next-line prettier/prettier
  constructor(private changePassword: ChangeUserPasswordUseCase) { }

  @Put()
  @HttpCode(204)
  async handle(
    @ExclusiveRoute([UserRole.ADMIN]) user: UserPayload,
    @Body(bodyValidationPipe) body: ChangePasswordBodySchema,
  ) {
    const result = await this.changePassword.execute({
      ...body,
      adminId: user.sub,
      cpf: body.cpf ? Cpf.onlyNumbers(body.cpf) : undefined,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
