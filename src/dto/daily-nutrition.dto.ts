import { FoodItemDto } from './food-item.dto';

export class DailyNutritionDto {
  date: string;
  foodItems: FoodItemDto[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
