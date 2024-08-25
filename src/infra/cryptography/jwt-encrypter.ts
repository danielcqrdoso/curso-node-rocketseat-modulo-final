import { Encrypter } from '@/domain/delivery/application/cryptography/encrypter'
import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { EnvService } from '@/infra/env/env.service'
import { addHours, getUnixTime } from 'date-fns'

@Injectable()
export class JwtEncrypter implements Encrypter {
  constructor(
    private jwtService: JwtService,
    private env: EnvService,
    // eslint-disable-next-line prettier/prettier
  ) { }

  async encrypt(payload: Record<string, unknown>): Promise<string> {
    const expirationTime = addHours(
      new Date(),
      this.env.get('JWT_EXP_IN_HOURS'),
    )
    payload.exp = getUnixTime(expirationTime)
    return this.jwtService.signAsync(payload)
  }
}
