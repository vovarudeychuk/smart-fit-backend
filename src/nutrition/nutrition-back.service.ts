import { Injectable } from '@nestjs/common';
import { FoodItem } from '../models/food-item.entity';
import { DailyNutrition } from '../models/daily-nutrition.entity';
import { NutritionGoals } from '../models/nutrition-goals.entity';
import { startOfWeek, addDays, subWeeks, addWeeks, format } from 'date-fns';

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

  // Storage for multiple weeks of nutrition data
  private weeklyNutritionByDate: Map<string, DailyNutrition[]> = new Map();

  constructor() {
    // Initialize with mock data for previous, current, and next week
    this.initializeMultiWeekData();
  }

  // Initialize mock data for 3 weeks (previous, current, next)
  private initializeMultiWeekData(): void {
    const today = new Date();

    // Generate data for previous week
    const previousWeekStart = startOfWeek(subWeeks(today, 1));
    this.generateAndStoreWeekData(previousWeekStart, true);

    // Generate data for current week
    const currentWeekStart = startOfWeek(today);
    this.generateAndStoreWeekData(currentWeekStart, true);

    // Generate data for next week
    const nextWeekStart = startOfWeek(addWeeks(today, 1));
    this.generateAndStoreWeekData(nextWeekStart, false); // less food for future week

    console.log(
      `Mock data initialized for 3 weeks. Available weeks: ${[...this.weeklyNutritionByDate.keys()].join(', ')}`,
    );
  }

  // Generate mock data for a specific week and store it
  private generateAndStoreWeekData(
    weekStartDate: Date,
    includeFood: boolean,
  ): void {
    const weekKey = format(weekStartDate, 'yyyy-MM-dd');

    // Skip if we already have data for this week
    if (this.weeklyNutritionByDate.has(weekKey)) {
      return;
    }

    const weekData: DailyNutrition[] = Array(7)
      .fill(null)
      .map((_, index) => {
        const currentDay = addDays(new Date(weekStartDate), index);
        console.log(`Day ${index}: ${format(currentDay, 'EEE MMM dd yyyy')}`);
        // For demonstration, we'll add more food items to weekdays than weekends
        const isWeekend =
          currentDay.getDay() === 0 || currentDay.getDay() === 6;
        const maxItems = isWeekend ? 2 : 4;

        // Only include food items if specified (for past/current weeks)
        const foodItems = includeFood
          ? this.getRandomFoodItems(Math.floor(Math.random() * maxItems) + 1)
          : [];

        // Calculate totals
        const totalCalories = foodItems.reduce(
          (sum, item) => sum + item.calories,
          0,
        );
        const totalProtein = foodItems.reduce(
          (sum, item) => sum + item.protein,
          0,
        );
        const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
        const totalFat = foodItems.reduce((sum, item) => sum + item.fat, 0);

        return {
          date: currentDay,
          foodItems,
          totalCalories,
          totalProtein,
          totalCarbs,
          totalFat,
        };
      });

    // Store the week data
    this.weeklyNutritionByDate.set(weekKey, weekData);
  }

  // Get weekly nutrition data for a specific date
  getWeeklyNutritionForDate(date: Date): DailyNutrition[] {
    const weekStartDate = startOfWeek(date);
    const weekKey = format(weekStartDate, 'yyyy-MM-dd');

    console.log(`Requesting nutrition data for week: ${weekKey}`);

    // If we don't have data for this week yet, generate it
    if (!this.weeklyNutritionByDate.has(weekKey)) {
      // Check if this is a future week (generate empty) or past week (generate with food)
      const today = new Date();
      const isFutureWeek = weekStartDate > today;

      this.generateAndStoreWeekData(weekStartDate, !isFutureWeek);
      console.log(`Generated new mock data for week: ${weekKey}`);
    }

    return this.weeklyNutritionByDate.get(weekKey) || [];
  }

  // Get the current week's nutrition data
  getWeeklyNutrition(): DailyNutrition[] {
    return this.getWeeklyNutritionForDate(new Date());
  }

  // Add a food item to a specific day
  addFoodItem(dayIndex: number, foodItem: FoodItem): FoodItem {
    // Use current week
    return this.addFoodItemForWeek(new Date(), dayIndex, foodItem);
  }

  // Add a food item to a specific day in a specific week
  addFoodItemForWeek(
    weekDate: Date,
    dayIndex: number,
    foodItem: FoodItem,
  ): FoodItem {
    const weekStartDate = startOfWeek(weekDate);
    const weekKey = format(weekStartDate, 'yyyy-MM-dd');

    // Ensure we have data for this week
    if (!this.weeklyNutritionByDate.has(weekKey)) {
      this.getWeeklyNutritionForDate(weekDate);
    }

    const weekData = this.weeklyNutritionByDate.get(weekKey);

    if (!weekData || dayIndex < 0 || dayIndex >= weekData.length) {
      throw new Error(`Invalid day index: ${dayIndex} for week: ${weekKey}`);
    }

    // Assign a unique ID to the food item if it doesn't have one
    if (!foodItem.id) {
      foodItem.id = Date.now();
    }

    // Add the food item and update totals
    const day = weekData[dayIndex];
    day.foodItems.push(foodItem);
    day.totalCalories += foodItem.calories;
    day.totalProtein += foodItem.protein;
    day.totalCarbs += foodItem.carbs;
    day.totalFat += foodItem.fat;

    console.log(`Added ${foodItem.name} to day ${dayIndex} of week ${weekKey}`);

    return foodItem;
  }

  // Remove a food item from a specific day
  removeFoodItem(dayIndex: number, foodItemId: number): boolean {
    // Use current week
    return this.removeFoodItemForWeek(new Date(), dayIndex, foodItemId);
  }

  // Remove a food item from a specific day in a specific week
  removeFoodItemForWeek(
    weekDate: Date,
    dayIndex: number,
    foodItemId: number,
  ): boolean {
    const weekStartDate = startOfWeek(weekDate);
    const weekKey = format(weekStartDate, 'yyyy-MM-dd');

    if (!this.weeklyNutritionByDate.has(weekKey)) {
      return false;
    }

    const weekData = this.weeklyNutritionByDate.get(weekKey);

    if (!weekData || dayIndex < 0 || dayIndex >= weekData.length) {
      return false;
    }

    const day = weekData[dayIndex];
    const foodIndex = day.foodItems.findIndex((item) => item.id === foodItemId);

    if (foodIndex === -1) {
      return false;
    }

    // Remove the food item and update totals
    const foodItem = day.foodItems[foodIndex];
    day.foodItems.splice(foodIndex, 1);
    day.totalCalories -= foodItem.calories;
    day.totalProtein -= foodItem.protein;
    day.totalCarbs -= foodItem.carbs;
    day.totalFat -= foodItem.fat;

    console.log(
      `Removed food item ${foodItemId} from day ${dayIndex} of week ${weekKey}`,
    );

    return true;
  }

  // Update an existing food item
  updateFoodItem(dayIndex: number, foodItem: FoodItem): FoodItem {
    // Use current week
    return this.updateFoodItemForWeek(new Date(), dayIndex, foodItem);
  }

  // Update an existing food item in a specific week
  updateFoodItemForWeek(
    weekDate: Date,
    dayIndex: number,
    foodItem: FoodItem,
  ): FoodItem {
    const weekStartDate = startOfWeek(weekDate);
    const weekKey = format(weekStartDate, 'yyyy-MM-dd');

    if (!this.weeklyNutritionByDate.has(weekKey)) {
      throw new Error(`No data found for week: ${weekKey}`);
    }

    const weekData = this.weeklyNutritionByDate.get(weekKey);

    if (!weekData || dayIndex < 0 || dayIndex >= weekData.length) {
      throw new Error(`Invalid day index: ${dayIndex} for week: ${weekKey}`);
    }

    const day = weekData[dayIndex];
    const foodIndex = day.foodItems.findIndex(
      (item) => item.id === foodItem.id,
    );

    if (foodIndex === -1) {
      throw new Error(`Food item with ID ${foodItem.id} not found`);
    }

    // Remove old values from totals
    const oldFoodItem = day.foodItems[foodIndex];
    day.totalCalories -= oldFoodItem.calories;
    day.totalProtein -= oldFoodItem.protein;
    day.totalCarbs -= oldFoodItem.carbs;
    day.totalFat -= oldFoodItem.fat;

    // Add new values to totals
    day.totalCalories += foodItem.calories;
    day.totalProtein += foodItem.protein;
    day.totalCarbs += foodItem.carbs;
    day.totalFat += foodItem.fat;

    // Update the food item
    day.foodItems[foodIndex] = foodItem;

    console.log(
      `Updated food item ${foodItem.id} on day ${dayIndex} of week ${weekKey}`,
    );

    return foodItem;
  }

  // Move a food item between days
  moveFoodBetweenDays(
    sourceDayIndex: number,
    targetDayIndex: number,
    foodItemId: number,
  ): boolean {
    // Use current week
    return this.moveFoodBetweenDaysForWeek(
      new Date(),
      sourceDayIndex,
      targetDayIndex,
      foodItemId,
    );
  }

  // Move a food item between days in a specific week
  moveFoodBetweenDaysForWeek(
    weekDate: Date,
    sourceDayIndex: number,
    targetDayIndex: number,
    foodItemId: number,
  ): boolean {
    const weekStartDate = startOfWeek(weekDate);
    const weekKey = format(weekStartDate, 'yyyy-MM-dd');

    if (!this.weeklyNutritionByDate.has(weekKey)) {
      return false;
    }

    const weekData = this.weeklyNutritionByDate.get(weekKey);

    if (
      !weekData ||
      sourceDayIndex < 0 ||
      sourceDayIndex >= weekData.length ||
      targetDayIndex < 0 ||
      targetDayIndex >= weekData.length
    ) {
      return false;
    }

    const sourceDay = weekData[sourceDayIndex];
    const foodIndex = sourceDay.foodItems.findIndex(
      (item) => item.id === foodItemId,
    );

    if (foodIndex === -1) {
      return false;
    }

    // Get the food item
    const foodItem = { ...sourceDay.foodItems[foodIndex] };

    // Remove from source day
    this.removeFoodItemForWeek(weekDate, sourceDayIndex, foodItemId);

    // Add to target day
    this.addFoodItemForWeek(weekDate, targetDayIndex, foodItem);

    console.log(
      `Moved food item ${foodItemId} from day ${sourceDayIndex} to day ${targetDayIndex} of week ${weekKey}`,
    );

    return true;
  }

  // Search foods in the database
  searchFoods(query: string): FoodItem[] {
    if (!query || query.trim().length === 0) {
      return this.foodDatabase.slice(0, 10); // Return first 10 items if no query
    }

    const normalizedQuery = query.toLowerCase().trim();
    return this.foodDatabase.filter((food) =>
      food.name.toLowerCase().includes(normalizedQuery),
    );
  }

  // Get nutrition goals
  getNutritionGoals(): NutritionGoals {
    return this.nutritionGoals;
  }

  // Helper method to get random food items from the database
  private getRandomFoodItems(count: number): FoodItem[] {
    const items: FoodItem[] = [];

    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * this.foodDatabase.length);
      const randomFood = this.foodDatabase[randomIndex];

      // Create a copy and generate a unique ID
      const foodCopy = {
        ...randomFood,
        id: Date.now() + i,
        // Add some randomness to quantities for more realistic data
        calories: Math.round(randomFood.calories * (0.8 + Math.random() * 0.4)),
        protein:
          Math.round(randomFood.protein * (0.8 + Math.random() * 0.4) * 10) /
          10,
        carbs:
          Math.round(randomFood.carbs * (0.8 + Math.random() * 0.4) * 10) / 10,
        fat: Math.round(randomFood.fat * (0.8 + Math.random() * 0.4) * 10) / 10,
      };

      items.push(foodCopy);
    }

    return items;
  }

  // Return all foods in the database
  getAllFoods(): FoodItem[] {
    return this.foodDatabase;
  }

  // Add a new food item to the database
  addFoodToDatabase(newFood: FoodItem): FoodItem {
    if (!newFood.id) {
      const maxId = Math.max(...this.foodDatabase.map((f) => f.id || 0), 0);
      newFood.id = maxId + 1;
    }
    this.foodDatabase.push(newFood);
    return newFood;
  }

  // Update a food in the database
  updateFoodInDatabase(id: number, updatedFood: FoodItem): FoodItem {
    const index = this.foodDatabase.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error(`Food with ID ${id} not found`);
    }
    updatedFood.id = id; // Ensure ID is preserved
    this.foodDatabase[index] = updatedFood;
    return updatedFood;
  }

  // Delete a food from the database
  deleteFoodFromDatabase(id: number): void {
    this.foodDatabase = this.foodDatabase.filter((f) => f.id !== id);
  }

  // Get nutrition for a specific day
  getDailyNutrition(dayIndex: number): DailyNutrition {
    const weekData = this.getWeeklyNutrition();
    if (dayIndex < 0 || dayIndex >= weekData.length) {
      throw new Error(`Invalid day index: ${dayIndex}`);
    }
    return weekData[dayIndex];
  }

  // Get nutrition for a specific date
  getDailyNutritionByDate(date: Date): DailyNutrition {
    const weekData = this.getWeeklyNutritionForDate(date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return weekData[dayOfWeek];
  }

  // Update nutrition goals
  updateNutritionGoals(goals: NutritionGoals): NutritionGoals {
    this.nutritionGoals = goals;
    return this.nutritionGoals;
  }
}
