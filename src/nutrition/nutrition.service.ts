import { Injectable } from '@nestjs/common';
import { FoodItem } from '../models/food-item.entity';
import { DailyNutrition } from '../models/daily-nutrition.entity';
import { NutritionGoals } from '../models/nutrition-goals.entity';

@Injectable()
export class NutritionService {
  // User goals
  private nutritionGoals: NutritionGoals = {
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 65,
  };

  // Food database
  private foodDatabase: FoodItem[] = [
    {
      id: 1,
      name: 'Chicken Breast',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      servingSize: '100g',
    },
    {
      id: 2,
      name: 'Brown Rice',
      calories: 112,
      protein: 2.6,
      carbs: 23.5,
      fat: 0.9,
      servingSize: '100g',
    },
    {
      id: 3,
      name: 'Broccoli',
      calories: 34,
      protein: 2.8,
      carbs: 6.6,
      fat: 0.4,
      servingSize: '100g',
    },
    {
      id: 4,
      name: 'Salmon',
      calories: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
      servingSize: '100g',
    },
    {
      id: 5,
      name: 'Sweet Potato',
      calories: 86,
      protein: 1.6,
      carbs: 20,
      fat: 0.1,
      servingSize: '100g',
    },
    {
      id: 6,
      name: 'Avocado',
      calories: 160,
      protein: 2,
      carbs: 8.5,
      fat: 14.7,
      servingSize: '100g',
    },
    {
      id: 7,
      name: 'Egg',
      calories: 78,
      protein: 6.3,
      carbs: 0.6,
      fat: 5.3,
      servingSize: '1 large',
    },
    {
      id: 8,
      name: 'Greek Yogurt',
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      servingSize: '100g',
    },
    {
      id: 9,
      name: 'Almonds',
      calories: 579,
      protein: 21,
      carbs: 21.6,
      fat: 49.9,
      servingSize: '100g',
    },
    {
      id: 10,
      name: 'Banana',
      calories: 89,
      protein: 1.1,
      carbs: 22.8,
      fat: 0.3,
      servingSize: '100g',
    },
  ];

  // Weekly nutrition data
  private weeklyNutrition: DailyNutrition[] = [];

  constructor() {
    this.initializeWeeklyNutrition();
  }

  private initializeWeeklyNutrition(): void {
    const weekDates = this.generateWeekDates();
    this.weeklyNutrition = weekDates.map((date) => {
      // Generate random food items for each day
      const randomFoodItems = this.getRandomFoodItems(
        Math.floor(Math.random() * 4) + 1,
      );

      // Calculate totals
      const totalCalories = randomFoodItems.reduce(
        (sum, item) => sum + item.calories,
        0,
      );
      const totalProtein = randomFoodItems.reduce(
        (sum, item) => sum + item.protein,
        0,
      );
      const totalCarbs = randomFoodItems.reduce(
        (sum, item) => sum + item.carbs,
        0,
      );
      const totalFat = randomFoodItems.reduce((sum, item) => sum + item.fat, 0);

      return {
        date,
        foodItems: randomFoodItems,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      };
    });
  }

  private generateWeekDates(): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();

    // Generate dates for Sun-Sat containing the current date
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOfWeek + i);
      dates.push(date);
    }

    return dates;
  }

  private getRandomFoodItems(count: number): FoodItem[] {
    const items: FoodItem[] = [];
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * this.foodDatabase.length);
      items.push({ ...this.foodDatabase[randomIndex] });
    }
    return items;
  }

  // Calculate nutrition totals for a day
  private calculateDayTotals(day: DailyNutrition): void {
    day.totalCalories = day.foodItems.reduce(
      (sum, item) => sum + item.calories,
      0,
    );
    day.totalProtein = day.foodItems.reduce(
      (sum, item) => sum + item.protein,
      0,
    );
    day.totalCarbs = day.foodItems.reduce((sum, item) => sum + item.carbs, 0);
    day.totalFat = day.foodItems.reduce((sum, item) => sum + item.fat, 0);
  }

  // Public methods
  getAllFoods(): FoodItem[] {
    return this.foodDatabase;
  }

  searchFoods(query: string): FoodItem[] {
    if (!query || query.trim() === '') {
      return [];
    }

    query = query.toLowerCase();
    return this.foodDatabase.filter((food) =>
      food.name.toLowerCase().includes(query),
    );
  }

  getNutritionGoals(): NutritionGoals {
    return this.nutritionGoals;
  }

  updateNutritionGoals(goals: NutritionGoals): NutritionGoals {
    this.nutritionGoals = goals;
    return this.nutritionGoals;
  }

  getWeeklyNutrition(): DailyNutrition[] {
    return this.weeklyNutrition;
  }

  getDailyNutrition(dayIndex: number): DailyNutrition {
    if (dayIndex < 0 || dayIndex >= 7) {
      throw new Error('Day index out of range');
    }
    return this.weeklyNutrition[dayIndex];
  }

  addFoodItem(dayIndex: number, foodItem: FoodItem): DailyNutrition {
    if (dayIndex < 0 || dayIndex >= 7) {
      throw new Error('Day index out of range');
    }

    const day = this.weeklyNutrition[dayIndex];
    day.foodItems.push({ ...foodItem });
    this.calculateDayTotals(day);

    return day;
  }

  updateFoodItem(
    dayIndex: number,
    foodItemId: number,
    updatedFood: FoodItem,
  ): DailyNutrition {
    if (dayIndex < 0 || dayIndex >= 7) {
      throw new Error('Day index out of range');
    }

    const day = this.weeklyNutrition[dayIndex];
    const foodIndex = day.foodItems.findIndex((item) => item.id === foodItemId);

    if (foodIndex === -1) {
      throw new Error('Food item not found');
    }

    day.foodItems[foodIndex] = { ...updatedFood };
    this.calculateDayTotals(day);

    return day;
  }

  deleteFoodItem(dayIndex: number, foodItemId: number): DailyNutrition {
    if (dayIndex < 0 || dayIndex >= 7) {
      throw new Error('Day index out of range');
    }

    const day = this.weeklyNutrition[dayIndex];
    day.foodItems = day.foodItems.filter((item) => item.id !== foodItemId);
    this.calculateDayTotals(day);

    return day;
  }

  // Food database CRUD operations
  addFoodToDatabase(newFood: FoodItem): FoodItem {
    const maxId = Math.max(...this.foodDatabase.map((food) => food.id), 0);
    const foodToAdd = {
      ...newFood,
      id: maxId + 1,
    };

    this.foodDatabase.push(foodToAdd);
    return foodToAdd;
  }

  updateFoodInDatabase(foodId: number, updatedFood: FoodItem): FoodItem {
    const index = this.foodDatabase.findIndex((food) => food.id === foodId);
    if (index === -1) {
      throw new Error('Food not found in database');
    }

    this.foodDatabase[index] = {
      ...updatedFood,
      id: foodId,
    };

    return this.foodDatabase[index];
  }

  deleteFoodFromDatabase(foodId: number): void {
    this.foodDatabase = this.foodDatabase.filter((food) => food.id !== foodId);
  }

  getDailyNutritionByDate(date: Date): DailyNutrition {
    // Find nutrition entry for the specified date
    const formattedTargetDate = date.toDateString();
    const dayData = this.weeklyNutrition.find(
      (day) => day.date.toDateString() === formattedTargetDate,
    );
    if (!dayData) {
      // If no data exists for that day, create a new empty day
      const emptyDay: DailyNutrition = {
        date,
        foodItems: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      };
      console.log('Empty day created:', emptyDay);
      return emptyDay;
    }

    return dayData;
  }
}
