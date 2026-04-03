import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  login(dto: LoginDto): { access_token: string } {
    const adminEmail = this.config.get<string>('ADMIN_EMAIL');
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD');

    if (dto.email !== adminEmail || dto.password !== adminPassword) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const token = this.jwtService.sign({ sub: 'admin', email: dto.email });
    return { access_token: token };
  }
}
