import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { CreateProductUseCase } from '@/domain/delivery/application/use-cases/product/create-product'
import { UserRole } from '@/domain/delivery/enterprise/entities/user'
import { ExclusiveRoute } from '@/infra/auth/exclusive-route-decorator'

const createProductBodySchema = z.object({
  name: z.string(),
  description: z.string(),
  latitude: z.coerce.number().refine((value) => {
    return Math.abs(value) <= 90
  }),
  longitude: z.coerce.number().refine((value) => {
    return Math.abs(value) <= 180
  }),
})

const bodyValidationPipe = new ZodValidationPipe(createProductBodySchema)

type CreateProductBodySchema = z.infer<typeof createProductBodySchema>

@Controller('/product')
export class CreateProductController {
  // eslint-disable-next-line prettier/prettier
  constructor(private createProduct: CreateProductUseCase) { }

  @Post()
  @HttpCode(201)
  async handle(
    @ExclusiveRoute([UserRole.ADMIN]) _: never,
    @Body(bodyValidationPipe) body: CreateProductBodySchema,
  ) {
    const result = await this.createProduct.execute({
      ...body,
    })

    if (result.isLeft()) {
      throw new BadRequestException('Something went wrong')
    }
  }
}
