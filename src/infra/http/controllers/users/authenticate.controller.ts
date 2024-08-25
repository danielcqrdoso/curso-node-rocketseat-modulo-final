import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { z } from 'zod'
import { AuthenticateUserUseCase } from '@/domain/delivery/application/use-cases/users/authenticate-user'
import { WrongCredentialsError } from '@/core/errors/errors/wrong-credentials-error'
import { Public } from '@/infra/auth/public'
import { Cpf } from '../../../../core/entities/cpf'

const authenticateBodySchema = z.object({
  cpf: z
    .string()
    .refine(Cpf.isValid, {
      message: 'Invalid Document',
    })
    .optional(),
  email: z.string().email().optional(),
  password: z.string(),
})

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/accounts/sessions')
@Public()
export class AuthenticateController {
  // eslint-disable-next-line prettier/prettier
  constructor(private authenticateUser: AuthenticateUserUseCase) { }

  @Post()
  @HttpCode(201)
  @UsePipes(new ZodValidationPipe(authenticateBodySchema))
  async handle(@Body() body: AuthenticateBodySchema) {
    const result = await this.authenticateUser.execute({
      ...body,
      cpf: body.cpf ? Cpf.onlyNumbers(body.cpf) : undefined,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { accessToken } = result.value

    return {
      access_token: accessToken,
    }
  }
}
