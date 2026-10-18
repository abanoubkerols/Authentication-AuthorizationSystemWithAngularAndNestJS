import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async createAccessToken(data: {
    userId: string;
    sessionId: string;
  }): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: data.userId,
        sid: data.sessionId,
        type: 'access',
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN') || '15m',
      },
    );
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  generateSessionId(): string {
    return randomBytes(16).toString('hex');
  }

  generateTokenId(): string {
    return randomBytes(16).toString('hex');
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }
}
