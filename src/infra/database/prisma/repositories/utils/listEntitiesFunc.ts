import { PaginationParams } from '@/core/repositories/pagination-params'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../prisma.service'

export async function listEntitiesfunc<Entity>(
  params: PaginationParams & {
    filterRaw: string
    selectRaw?: string
    orderBy?: string
    table: string
    mapperFunc: (raw: Entity) => Entity
    prisma: PrismaService
  },
): Promise<{
  entities: Entity[]
  newPage: number
}> {
  const limit = params.limit ?? 100
  const page = params.page ?? 0

  const query = `
    SELECT ${params.selectRaw ?? '*'} 
    FROM ${params.table} 
    WHERE ${params.filterRaw} 
    ORDER BY ${params.orderBy ?? '"createdAt" ASC'} 
    LIMIT ${limit} 
    OFFSET ${page}
  `

  const entities = await params.prisma.$queryRaw<Entity[]>(Prisma.raw(query))

  const entitiesDomain: Entity[] = []
  entities.forEach((entitie) => {
    entitiesDomain.push(params.mapperFunc(entitie))
  })

  return {
    entities: entitiesDomain,
    newPage: page + entities.length,
  }
}
