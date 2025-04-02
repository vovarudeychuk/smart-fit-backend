import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FoodItem } from '../models/food-item.entity';
import { DailyNutrition } from '../models/daily-nutrition.model';
import { NutritionGoals } from '../models/nutrition-goals.entity';
import { startOfWeek, addDays, subWeeks, addWeeks, format } from 'date-fns';

@Injectable()
export class NutritionService {
  constructor(
    @InjectModel(FoodItem.name) private readonly foodItemModel: Model<FoodItem>,
    @InjectModel(DailyNutrition.name) private readonly dailyNutritionModel: Model<DailyNutrition>,
    @InjectModel(NutritionGoals.name) private readonly nutritionGoalsModel: Model<NutritionGoals>
  ) {
    // Initialize database with sample data if empty
    this.initializeDatabase();
  }

  // Getter methods for models to be used by the controller
  getFoodItemModel(): Model<FoodItem> {
    return this.foodItemModel;
  }

  getDailyNutritionModel(): Model<DailyNutrition> {
    return this.dailyNutritionModel;
  }

  getNutritionGoalsModel(): Model<NutritionGoals> {
    return this.nutritionGoalsModel;
  }

  // Initialize database with sample data if empty
  private async initializeDatabase(): Promise<void> {
    try {
      const foodCount = await this.foodItemModel.countDocuments().exec();
      
      if (foodCount === 0) {
        // Sample food data to populate
        const sampleFoods = [
          {
            name: 'Chicken Breast',
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            servingSize: '100g',
          },
          {
            name: 'Brown Rice',
            calories: 112,
            protein: 2.6,
            carbs: 23.5,
            fat: 0.9,
            servingSize: '100g',
          },
          {
            name: 'Broccoli',
            calories: 34,
            protein: 2.8,
            carbs: 6.6,
            fat: 0.4,
            servingSize: '100g',
          },
          {
            name: 'Salmon',
            calories: 208,
            protein: 20,
            carbs: 0,
            fat: 13,
            servingSize: '100g',
          },
          {
            name: 'Sweet Potato',
            calories: 86,
            protein: 1.6,
            carbs: 20,
            fat: 0.1,
            servingSize: '100g',
          },
          {
            name: 'Avocado',
            calories: 160,
            protein: 2,
            carbs: 8.5,
            fat: 14.7,
            servingSize: '100g',
          },
          {
            name: 'Egg',
            calories: 78,
            protein: 6.3,
            carbs: 0.6,
            fat: 5.3,
            servingSize: '1 large',
          },
          {
            name: 'Greek Yogurt',
            calories: 59,
            protein: 10,
            carbs: 3.6,
            fat: 0.4,
            servingSize: '100g',
          },
          {
            name: 'Almonds',
            calories: 579,
            protein: 21,
            carbs: 21.6,
            fat: 49.9,
            servingSize: '100g',
          },
          {
            name: 'Banana',
            calories: 89,
            protein: 1.1,
            carbs: 22.8,
            fat: 0.3,
            servingSize: '100g',
          },
        ];

        // Insert sample foods
        await this.foodItemModel.insertMany(sampleFoods);
        console.log('Sample food database initialized');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }

  // Get all food items from database
  async getAllFoodItems(): Promise<FoodItem[]> {
    return this.foodItemModel.find().exec();
  }

  // Add a new food item
  async addFoodItem(foodItemData: any): Promise<FoodItem> {
    const newFoodItem = new this.foodItemModel(foodItemData);
    return newFoodItem.save();
  }

  // Get nutrition goals for a specific user
  async getNutritionGoals(userId: string): Promise<NutritionGoals> {
    let goals = await this.nutritionGoalsModel.findOne({ userId }).exec();
    
    if (!goals) {
      // Create default goals if none exist
      goals = new this.nutritionGoalsModel({
        userId,
        calorieGoal: 2000,
        proteinGoal: 150,
        carbsGoal: 200,
        fatGoal: 65,
      });
      await goals.save();
    }
    
    return goals;
  }

  // Update nutrition goals for a user
  async updateNutritionGoals(userId: string, goalsData: any): Promise<NutritionGoals> {
    const goals = await this.nutritionGoalsModel.findOne({ userId }).exec();
    
    if (goals) {
      goals.calorieGoal = goalsData.calorieGoal;
      goals.proteinGoal = goalsData.proteinGoal;
      goals.carbsGoal = goalsData.carbsGoal;
      goals.fatGoal = goalsData.fatGoal;
      return goals.save();
    } else {
      const newGoals = new this.nutritionGoalsModel({
        userId,
        ...goalsData,
      });
      return newGoals.save();
    }
  }

  // Get weekly nutrition data for a user on a specific date
  async getWeeklyNutritionForDate(userId: string, date: Date): Promise<DailyNutrition[]> {
    try {
      console.log(`Getting weekly nutrition for user ${userId} on date ${date}`);
      const weekStartDate = startOfWeek(new Date(date));
      const weekEndDate = addDays(new Date(weekStartDate), 6);
      
      console.log(`Week range: ${weekStartDate.toISOString()} to ${weekEndDate.toISOString()}`);
      
      // Find all nutrition entries for this user between start and end dates
      const weeklyData = await this.dailyNutritionModel
        .find({
          userId,
          date: {
            $gte: weekStartDate,
            $lte: weekEndDate,
          },
        })
        .populate('foodItems')
        .exec();
      
      console.log(`Found ${weeklyData.length} entries for the week`);
      
      // If we have data, return it
      if (weeklyData.length > 0) {
        return weeklyData;
      }
      
      // No data for this week, create empty entries
      const emptyWeek: DailyNutrition[] = [];
      for (let i = 0; i < 7; i++) {
        const currentDay = addDays(new Date(weekStartDate), i);
        const dailyEntry = new this.dailyNutritionModel({
          date: currentDay,
          foodItems: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          userId,
        });
        
        // We don't save these empty records to DB, just return them
        emptyWeek.push(dailyEntry);
      }
      
      return emptyWeek;
    } catch (error) {
      console.error('Error getting weekly nutrition:', error);
      throw error;
    }
  }

  // Add a food item to a specific day
  async addFoodItemToDay(userId: string, date: Date, foodItemId: any): Promise<DailyNutrition> {
    try {
      // First find the food item - allow for either full object or ID
      let foodItem;
      
      if (typeof foodItemId === 'object' && foodItemId._id) {
        // If a full object with _id was passed
        foodItem = await this.foodItemModel.findById(foodItemId._id).exec();
      } else {
        // Try to find by the ID string
        foodItem = await this.foodItemModel.findById(foodItemId).exec();
      }
      
      if (!foodItem) {
        console.log('Food item not found with ID:', foodItemId);
        throw new Error('Food item not found');
      }
      
      console.log('Found food item:', foodItem);
      
      // Find or create daily nutrition for this date and user
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      let dailyNutrition = await this.dailyNutritionModel
        .findOne({
          userId,
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        })
        .exec();
      
      if (!dailyNutrition) {
        // Create new daily nutrition record
        dailyNutrition = new this.dailyNutritionModel({
          userId,
          date,
          foodItems: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
        });
      }
      
      // Add the food item to this day
      dailyNutrition.foodItems.push(foodItem._id as any);
      
      // Use the updated food's nutrition values
      dailyNutrition.totalCalories += foodItem.calories;
      dailyNutrition.totalProtein += foodItem.protein;
      dailyNutrition.totalCarbs += foodItem.carbs;
      dailyNutrition.totalFat += foodItem.fat;
      
      // Save and return updated daily nutrition
      return dailyNutrition.save();
    } catch (error) {
      console.error('Error adding food item:', error);
      throw error;
    }
  }

  // Remove a food item from a specific day
  async removeFoodItemFromDay(userId: string, date: Date, foodItemId: string): Promise<DailyNutrition | any> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      console.log(`Looking for food item ${foodItemId} on ${date} for user ${userId}`);
      
      // Find the daily nutrition record
      const dailyNutrition = await this.dailyNutritionModel
        .findOne({
          userId,
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        })
        .populate('foodItems')
        .exec();
      
      if (!dailyNutrition) {
        console.log(`No nutrition data found for this day, nothing to delete`);
        // Return success since the end result is the same - no food item exists
        return { success: true, message: 'No nutrition data for this day' };
      }
      
      console.log(`Found daily nutrition with ${dailyNutrition.foodItems.length} food items`);
      
      // Find the food item safely, without potentially throwing an error
      let foodItemIndex = -1;
      try {
        foodItemIndex = dailyNutrition.foodItems.findIndex(
          (item: any) => item && item._id && item._id.toString() === foodItemId
        );
      } catch (err) {
        console.log(`Error finding food item: ${err.message}`);
        // Continue with -1 index to indicate not found
      }
      
      console.log(`Food item index: ${foodItemIndex}`);
      
      if (foodItemIndex === -1) {
        console.log(`Food item ${foodItemId} not found in this day, nothing to delete`);
        // Return success since the end result is the same - no food item exists
        return { success: true, message: 'Food item not found in this day' };
      }
      
      // Get the food item to update totals
      const foodItem = dailyNutrition.foodItems[foodItemIndex];
      
      // Remove the food item
      dailyNutrition.foodItems.splice(foodItemIndex, 1);
      
      // Update nutritional totals
      dailyNutrition.totalCalories -= foodItem.calories || 0;
      dailyNutrition.totalProtein -= foodItem.protein || 0;
      dailyNutrition.totalCarbs -= foodItem.carbs || 0;
      dailyNutrition.totalFat -= foodItem.fat || 0;
      
      // Save and return updated daily nutrition
      return dailyNutrition.save();
    } catch (error) {
      console.error('Error removing food item:', error);
      // Return a structured error response instead of throwing
      return { success: false, message: error.message || 'Error removing food item' };
    }
  }

  // Update a food item in a specific day
  async updateFoodItemInDay(userId: string, date: Date, foodItemId: string, updatedFood: Partial<any>): Promise<DailyNutrition> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Find the daily nutrition record
      let dailyNutrition = await this.dailyNutritionModel
        .findOne({
          userId,
          date: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        })
        .populate('foodItems')
        .exec();
      
      if (!dailyNutrition) {
        console.log(`No nutrition record found for date ${date}, creating a new one`);
        
        // Get the food item we're trying to update
        const foodItem = await this.foodItemModel.findById(foodItemId).exec();
        if (!foodItem) {
          throw new Error('Food item not found');
        }
        
        // Create new daily nutrition record with this food item
        dailyNutrition = new this.dailyNutritionModel({
          userId,
          date,
          foodItems: [foodItem._id],
          totalCalories: updatedFood.calories || 0,
          totalProtein: updatedFood.protein || 0,
          totalCarbs: updatedFood.carbs || 0,
          totalFat: updatedFood.fat || 0,
        });
        
        // Save and return the new record
        return dailyNutrition.save();
      }
      
      // Find the food item
      const foodItemIndex = dailyNutrition.foodItems.findIndex(
        (item: any) => item._id.toString() === foodItemId
      );
      
      if (foodItemIndex === -1) {
        console.log(`Food item ${foodItemId} not found in day, adding it`);
        
        // Get the food item by ID
        const foodItem = await this.foodItemModel.findById(foodItemId).exec();
        if (!foodItem) {
          throw new Error('Food item not found');
        }
        
        // Add the food item to this day
        dailyNutrition.foodItems.push(foodItem._id as any);
        
        // Use the updated food's nutrition values
        dailyNutrition.totalCalories += updatedFood.calories || 0;
        dailyNutrition.totalProtein += updatedFood.protein || 0;
        dailyNutrition.totalCarbs += updatedFood.carbs || 0;
        dailyNutrition.totalFat += updatedFood.fat || 0;
      } else {
        // Get the original food item to update totals
        const originalFoodItem = dailyNutrition.foodItems[foodItemIndex];
        
        // Update nutritional totals (subtract original values)
        dailyNutrition.totalCalories -= originalFoodItem.calories;
        dailyNutrition.totalProtein -= originalFoodItem.protein;
        dailyNutrition.totalCarbs -= originalFoodItem.carbs;
        dailyNutrition.totalFat -= originalFoodItem.fat;
        
        // Update the food item properties
        Object.assign(originalFoodItem, updatedFood);
        
        // Add the new nutritional values
        dailyNutrition.totalCalories += originalFoodItem.calories;
        dailyNutrition.totalProtein += originalFoodItem.protein;
        dailyNutrition.totalCarbs += originalFoodItem.carbs;
        dailyNutrition.totalFat += originalFoodItem.fat;
      }
      
      // Save and return updated daily nutrition
      return dailyNutrition.save();
    } catch (error) {
      console.error('Error updating food item:', error);
      throw error;
    }
  }
}
