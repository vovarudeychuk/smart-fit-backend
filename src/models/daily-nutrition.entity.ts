import { FoodItem } from './food-item.entity';

export class DailyNutrition {
  date: Date;
  foodItems: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}
