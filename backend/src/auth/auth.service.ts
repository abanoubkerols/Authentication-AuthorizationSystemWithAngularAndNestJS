import {
  ConflictException,
  Injectable,
  TooManyRequestsException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RedisService } from '../redis/redis.service';
import { TokenService } from './token.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions() {
    const isProd =
      this.configService.get<string>('NODE_ENV') === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict' as const,
      path: '/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };
  }

  private async checkRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    const attempts = await this.redisService.increment(key, windowSeconds);
    if (attempts > limit) {
      throw new TooManyRequestsException(
        'Too many requests. Please try again later.',
      );
    }
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    await this.checkRateLimit(`auth:register:email:${email}`, 5, 3600);

    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.usersService.create({
      email,
      passwordHash,
      name: dto.name.trim(),
    });

    return {
      message: 'Registration successful',
      userId: user._id.toString(),
    };
  }

  async login(dto: LoginDto, req: Request, res: Response) {
    const email = dto.email.trim().toLowerCase();
    const ip = req.ip || 'unknown';

    await this.checkRateLimit(`auth:login:ip:${ip}`, 20, 60);
    await this.checkRateLimit(`auth:login:email:${email}`, 10, 60);
    await this.checkRateLimit(`auth:login:ip-email:${ip}:${email}`, 5, 60);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionId = this.tokenService.generateSessionId();
    const refreshToken = this.tokenService.generateRefreshToken();
    const tokenId = this.tokenService.generateTokenId();
    const refreshTokenHash = this.tokenService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.sessionsService.createSession({
      userId: user._id.toString(),
      sessionId,
      expiresAt,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await this.sessionsService.createRefreshToken({
      userId: user._id.toString(),
      sessionId,
      tokenHash: refreshTokenHash,
      tokenId,
      expiresAt,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const accessToken = await this.tokenService.createAccessToken({
      userId: user._id.toString(),
      sessionId,
    });

    const csrfToken = this.tokenService.generateCsrfToken();

    res.cookie('refresh_token', refreshToken, this.getCookieOptions());
    res.cookie('csrf_token', csrfToken, {
      ...this.getCookieOptions(),
      httpOnly: false,
    });

    return {
      accessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refresh(req: Request, res: Response) {
    const ip = req.ip || 'unknown';
    await this.checkRateLimit(`auth:refresh:ip:${ip}`, 30, 60);

    const rawToken = req.cookies?.refresh_token;
    if (!rawToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const tokenHash = this.tokenService.hashToken(rawToken);
    const storedToken =
      await this.sessionsService.findRefreshTokenByHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Reuse detection
    if (storedToken.revokedAt) {
      await this.sessionsService.revokeSession(storedToken.sessionId);
      res.clearCookie('refresh_token', this.getCookieOptions());
      res.clearCookie('csrf_token', {
        ...this.getCookieOptions(),
        httpOnly: false,
      });
      throw new UnauthorizedException(
        'Token reuse detected. Session revoked. Please login again.',
      );
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const session = await this.sessionsService.findSessionBySessionId(
      storedToken.sessionId,
    );

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session invalid or expired');
    }

    // Rotate: revoke old, create new
    const newRefreshToken = this.tokenService.generateRefreshToken();
    const newTokenId = this.tokenService.generateTokenId();
    const newTokenHash = this.tokenService.hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.sessionsService.revokeRefreshToken(
      storedToken.tokenId,
      newTokenId,
    );

    await this.sessionsService.createRefreshToken({
      userId: storedToken.userId.toString(),
      sessionId: storedToken.sessionId,
      tokenHash: newTokenHash,
      tokenId: newTokenId,
      expiresAt,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await this.sessionsService.updateSessionLastUsed(storedToken.sessionId);

    const accessToken = await this.tokenService.createAccessToken({
      userId: storedToken.userId.toString(),
      sessionId: storedToken.sessionId,
    });

    const csrfToken = this.tokenService.generateCsrfToken();

    res.cookie('refresh_token', newRefreshToken, this.getCookieOptions());
    res.cookie('csrf_token', csrfToken, {
      ...this.getCookieOptions(),
      httpOnly: false,
    });

    return { accessToken };
  }

  async logout(req: any, res: Response) {
    const sessionId = req.user?.sessionId;
    if (sessionId) {
      await this.sessionsService.revokeSession(sessionId);
    }

    res.clearCookie('refresh_token', this.getCookieOptions());
    res.clearCookie('csrf_token', {
      ...this.getCookieOptions(),
      httpOnly: false,
    });

    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string, res: Response) {
    await this.sessionsService.revokeAllUserSessions(userId);

    res.clearCookie('refresh_token', this.getCookieOptions());
    res.clearCookie('csrf_token', {
      ...this.getCookieOptions(),
      httpOnly: false,
    });

    return { message: 'Logged out from all devices' };
  }
}
