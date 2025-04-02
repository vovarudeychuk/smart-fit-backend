import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition-back.service';
import { FoodItem, FoodItemSchema } from '../models/food-item.entity';
import { DailyNutrition, DailyNutritionSchema } from '../models/daily-nutrition.model';
import { NutritionGoals, NutritionGoalsSchema } from '../models/nutrition-goals.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FoodItem.name, schema: FoodItemSchema },
      { name: DailyNutrition.name, schema: DailyNutritionSchema },
      { name: NutritionGoals.name, schema: NutritionGoalsSchema },
    ]),
  ],
  controllers: [NutritionController],
  providers: [NutritionService],
  exports: [NutritionService],
})
export class NutritionModule {}
