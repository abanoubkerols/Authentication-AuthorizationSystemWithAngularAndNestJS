import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({
    required: true,
    index: true,
    type: Types.ObjectId,
    ref: 'User',
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    index: true,
  })
  sessionId: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  tokenHash: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  tokenId: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: null })
  revokedAt: Date | null;

  @Prop({ default: null })
  replacedBy: string | null;

  @Prop()
  usedAt?: Date;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;
}

export type RefreshTokenDocument = RefreshToken & Document;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
