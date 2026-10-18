import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async createSession(data: {
    userId: string;
    sessionId: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }): Promise<SessionDocument> {
    const session = new this.sessionModel({
      userId: new Types.ObjectId(data.userId),
      sessionId: data.sessionId,
      expiresAt: data.expiresAt,
      ip: data.ip,
      userAgent: data.userAgent,
      lastUsedAt: new Date(),
    });
    return session.save();
  }

  async createRefreshToken(data: {
    userId: string;
    sessionId: string;
    tokenHash: string;
    tokenId: string;
    expiresAt: Date;
    ip?: string;
    userAgent?: string;
  }): Promise<RefreshTokenDocument> {
    const token = new this.refreshTokenModel({
      userId: new Types.ObjectId(data.userId),
      sessionId: data.sessionId,
      tokenHash: data.tokenHash,
      tokenId: data.tokenId,
      expiresAt: data.expiresAt,
      ip: data.ip,
      userAgent: data.userAgent,
    });
    return token.save();
  }

  async findRefreshTokenByHash(
    tokenHash: string,
  ): Promise<RefreshTokenDocument | null> {
    return this.refreshTokenModel.findOne({ tokenHash }).exec();
  }

  async findSessionBySessionId(
    sessionId: string,
  ): Promise<SessionDocument | null> {
    return this.sessionModel.findOne({ sessionId }).exec();
  }

  async revokeRefreshToken(
    tokenId: string,
    replacedBy?: string,
  ): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { tokenId },
      {
        revokedAt: new Date(),
        usedAt: new Date(),
        ...(replacedBy ? { replacedBy } : {}),
      },
    );
  }

  async revokeSession(sessionId: string): Promise<void> {
    const now = new Date();
    await this.sessionModel.updateOne(
      { sessionId },
      { revokedAt: now },
    );
    await this.refreshTokenModel.updateMany(
      { sessionId, revokedAt: null },
      { revokedAt: now },
    );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const now = new Date();
    await this.sessionModel.updateMany(
      { userId: new Types.ObjectId(userId), revokedAt: null },
      { revokedAt: now },
    );
    await this.refreshTokenModel.updateMany(
      { userId: new Types.ObjectId(userId), revokedAt: null },
      { revokedAt: now },
    );
  }

  async updateSessionLastUsed(sessionId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { sessionId },
      { lastUsedAt: new Date() },
    );
  }

  async findActiveSessionsByUser(
    userId: string,
  ): Promise<SessionDocument[]> {
    return this.sessionModel
      .find({
        userId: new Types.ObjectId(userId),
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .exec();
  }
}
