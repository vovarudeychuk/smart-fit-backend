import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class FoodItem extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  calories: number;

  @Prop({ required: true })
  protein: number;

  @Prop({ required: true })
  carbs: number;

  @Prop({ required: true })
  fat: number;

  @Prop()
  servingSize: string;
}

export const FoodItemSchema = SchemaFactory.createForClass(FoodItem);
