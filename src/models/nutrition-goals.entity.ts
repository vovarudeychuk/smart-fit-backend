import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class NutritionGoals extends Document {
  @Prop({ required: true })
  calorieGoal: number;

  @Prop({ required: true })
  proteinGoal: number;

  @Prop({ required: true })
  carbsGoal: number;

  @Prop({ required: true })
  fatGoal: number;

  @Prop({ type: String, required: true })
  userId: string;
}

export const NutritionGoalsSchema = SchemaFactory.createForClass(NutritionGoals);
