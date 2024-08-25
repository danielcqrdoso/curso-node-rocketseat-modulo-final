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
import { Public } from '@/infra/auth/public'

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

@Controller('/accounts/change-password')
@Public()
export class ChangePasswordController {
  // eslint-disable-next-line prettier/prettier
  constructor(private changePassword: ChangeUserPasswordUseCase) { }

  @Put()
  @HttpCode(204)
  async handle(@Body(bodyValidationPipe) body: ChangePasswordBodySchema) {
    const result = await this.changePassword.execute({
      ...body,
      cpf: body.cpf ? Cpf.onlyNumbers(body.cpf) : undefined,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
