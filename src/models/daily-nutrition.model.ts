import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { FoodItem } from './food-item.entity';

@Schema()
export class DailyNutrition extends Document {
  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'FoodItem' }] })
  foodItems: FoodItem[];

  @Prop({ required: true })
  totalCalories: number;

  @Prop({ required: true })
  totalProtein: number;

  @Prop({ required: true })
  totalCarbs: number;

  @Prop({ required: true })
  totalFat: number;

  @Prop({ type: String, required: true })
  userId: string;
}

export const DailyNutritionSchema = SchemaFactory.createForClass(DailyNutrition);
