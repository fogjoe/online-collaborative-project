import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  entityId: string;

  @Prop({ required: true })
  entityType: string;

  @Prop({ type: Object })
  details: Record<string, any>;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
