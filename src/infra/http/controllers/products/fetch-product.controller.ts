import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from '@nestjs/common'
import { z } from 'zod'
import { ZodValidationPipe } from '@/infra/http/pipes/zod-validation-pipe'
import { FetchProductUseCase } from '@/domain/delivery/application/use-cases/product/fetch-product'
import { Public } from '@/infra/auth/public'

const fetchProductBodySchema = z.object({
  name: z.string(),
  page: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).optional().default(10),
})

const bodyValidationPipe = new ZodValidationPipe(fetchProductBodySchema)

type FetchProductBodySchema = z.infer<typeof fetchProductBodySchema>

@Controller('/product/fetch')
@Public()
export class FetchProductController {
  // eslint-disable-next-line prettier/prettier
  constructor(private fetchProduct: FetchProductUseCase) { }

  @Post()
  @HttpCode(200)
  async handle(@Body(bodyValidationPipe) body: FetchProductBodySchema) {
    const result = await this.fetchProduct.execute({
      name: body.name,
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
