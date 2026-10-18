import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true, index: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  sessionId: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: null })
  revokedAt: Date | null;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  @Prop()
  lastUsedAt?: Date;
}

export type SessionDocument = Session & Document;
export const SessionSchema = SchemaFactory.createForClass(Session);
