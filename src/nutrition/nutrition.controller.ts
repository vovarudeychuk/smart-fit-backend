import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { NutritionService } from './nutrition-back.service';
import { FoodItem } from '../models/food-item.entity';
import { NutritionGoals } from '../models/nutrition-goals.entity';
import { DailyNutrition } from '../models/daily-nutrition.model';
import { Request } from 'express';

@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('foods')
  async getAllFoods() {
    return this.nutritionService.getAllFoodItems();
  }

  @Get('foods/search')
  async searchFoods(@Query('query') query: string) {
    // Simple search implementation
    const foods = await this.nutritionService.getAllFoodItems();
    if (!query || query.trim().length === 0) {
      return foods.slice(0, 10);
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    return foods.filter((food) =>
      food.name.toLowerCase().includes(normalizedQuery),
    );
  }

  @Post('foods')
  async addFood(@Body() newFood: Partial<FoodItem>) {
    return this.nutritionService.addFoodItem(newFood);
  }

  @Put('foods/:id')
  async updateFood(@Param('id') id: string, @Body() updatedFood: Partial<FoodItem>) {
    // Get the existing food
    const existingFood = await this.nutritionService.getFoodItemModel().findById(id).exec();
    if (!existingFood) {
      throw new Error(`Food with ID ${id} not found`);
    }
    
    // Update fields
    Object.assign(existingFood, updatedFood);
    return existingFood.save();
  }

  @Delete('foods/:id')
  async deleteFood(@Param('id') id: string) {
    await this.nutritionService.getFoodItemModel().findByIdAndDelete(id).exec();
    return { success: true };
  }

  @Get('goals')
  async getNutritionGoals(@Req() req: Request, @Query('userId') userIdParam?: string) {
    const userId = userIdParam || req['userId'] || 'default';
    return this.nutritionService.getNutritionGoals(userId);
  }

  @Put('goals')
  async updateNutritionGoals(
    @Body() goals: Partial<NutritionGoals>,
    @Req() req: Request,
    @Query('userId') userIdParam?: string
  ) {
    const userId = userIdParam || req['userId'] || 'default';
    return this.nutritionService.updateNutritionGoals(userId, goals);
  }

  @Get('weekly')
  async getWeeklyNutrition(
    @Req() req: Request,
    @Query('weekStartDate') weekStartDate?: string, 
    @Query('userId') userIdParam?: string
  ) {
    // Always prioritize user ID from request (set by interceptor)
    const userId = req['userId'] || userIdParam || 'default';
    console.log(`[API] Getting nutrition for week starting: ${weekStartDate || 'current'} for user ${userId}`);
    console.log(`Request userId property: ${req['userId']}, userIdParam: ${userIdParam}`);

    const date = weekStartDate ? new Date(weekStartDate) : new Date();
    const weekData = await this.nutritionService.getWeeklyNutritionForDate(userId, date);
    console.log(`Found ${weekData.length} entries for week`);

    // Get today's day index using the Sunday-based system 
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayIndex = dayOfWeek;

    console.log(
      `Today is ${today.toDateString()}, dayOfWeek=${dayOfWeek}, returning dayIndex=${dayIndex}`,
    );

    return {
      weekData,
      currentDayIndex: dayIndex,
    };
  }

  @Get('daily')
  async getDailyNutritionByDate(
    @Req() req: Request,
    @Query('date') dateStr: string,
    @Query('userId') userIdParam?: string
  ) {
    // Always prioritize user ID from request (set by interceptor)
    const userId = req['userId'] || userIdParam || 'default';
    console.log(`[API] Getting daily nutrition for date ${dateStr} with userId: ${userId}`);
    console.log(`Request userId property: ${req['userId']}, userIdParam: ${userIdParam}`);
    
    const date = new Date(dateStr);
    // Find all entries for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dailyNutrition = await this.nutritionService.getDailyNutritionModel()
      .findOne({
        userId,
        date: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      })
      .populate('foodItems')
      .exec();
    
    console.log(`Found daily nutrition for ${dateStr}, userId: ${userId}:`, 
                dailyNutrition ? 'Data exists' : 'No data found');
      
    return dailyNutrition || {
      date,
      foodItems: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      userId,
    };
  }

  @Get('daily/:dayIndex')
  async getDailyNutrition(
    @Param('dayIndex') dayIndex: string,
    @Req() req: Request,
    @Query('userId') userIdParam?: string
  ) {
    const userId = userIdParam || req['userId'] || 'default';
    // Calculate the date for the given day index
    const today = new Date();
    const weekStartDate = new Date(today);
    const dayOfWeek = today.getDay();
    weekStartDate.setDate(today.getDate() - dayOfWeek); // Go back to Sunday
    
    const targetDate = new Date(weekStartDate);
    targetDate.setDate(weekStartDate.getDate() + parseInt(dayIndex));
    
    return this.getDailyNutritionByDate(req, targetDate.toISOString(), userIdParam);
  }

  @Post('day/:dayIndex/foods')
  async addFoodToDay(
    @Req() req: Request,
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Body() foodData: any, // Allow any food data format
    @Query('weekStartDate') weekStartDate?: string,
    @Query('userId') userIdParam?: string
  ) {
    // Always prioritize the user ID from the request object (set by interceptor)
    const userId = req['userId'] || userIdParam || 'default';
    console.log(`[API] Adding food to day ${dayIndex} for user ${userId}:`, foodData);
    console.log(`Request userId property: ${req['userId']}`);

    // Calculate the date for this day
    let date: Date;
    if (weekStartDate) {
      const startDate = new Date(weekStartDate);
      date = new Date(startDate);
      date.setDate(startDate.getDate() + dayIndex);
    } else {
      // Use current week
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Go back to Sunday
      date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayIndex);
    }

    // Handle either a full food object or just an ID
    let foodItemId: any;
    if (foodData.foodItemId) {
      foodItemId = foodData.foodItemId;
    } else if (foodData._id) {
      // Full food object was passed
      foodItemId = foodData;
    } else {
      // Try using the whole object as the ID
      foodItemId = foodData;
    }

    return this.nutritionService.addFoodItemToDay(userId, date, foodItemId);
  }

  @Delete('day/:dayIndex/foods/:foodItemId')
  async removeFoodItem(
    @Req() req: Request,
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Param('foodItemId') foodItemId: string,
    @Query('weekStartDate') weekStartDate?: string,
    @Query('userId') userIdParam?: string
  ) {
    const userId = userIdParam || req['userId'] || 'default';
    console.log(`[API] Removing food ${foodItemId} from day ${dayIndex} for user ${userId}`);

    // Calculate the date for this day
    let date: Date;
    if (weekStartDate) {
      const startDate = new Date(weekStartDate);
      date = new Date(startDate);
      date.setDate(startDate.getDate() + dayIndex);
    } else {
      // Use current week
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Go back to Sunday
      date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayIndex);
    }

    return this.nutritionService.removeFoodItemFromDay(userId, date, foodItemId);
  }

  @Put('day/:dayIndex/foods/:foodItemId')
  async updateFoodInDay(
    @Req() req: Request,
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Param('foodItemId') foodItemId: string,
    @Body() updatedFood: Partial<FoodItem>,
    @Query('weekStartDate') weekStartDate?: string,
    @Query('userId') userIdParam?: string
  ) {
    const userId = userIdParam || req['userId'] || 'default';
    console.log(`[API] Updating food ${foodItemId} in day ${dayIndex} for user ${userId}`);

    // Calculate the date for this day
    let date: Date;
    if (weekStartDate) {
      const startDate = new Date(weekStartDate);
      date = new Date(startDate);
      date.setDate(startDate.getDate() + dayIndex);
    } else {
      // Use current week
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Go back to Sunday
      date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dayIndex);
    }

    return this.nutritionService.updateFoodItemInDay(userId, date, foodItemId, updatedFood);
  }

  @Get('health')
  healthCheck(@Req() req: Request) {
    // Add the userId to the health check response for debugging
    return { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      userId: req['userId'] || 'not set',
      headers: req.headers
    };
  }

  @Delete('clear-default-data')
  async clearDefaultData() {
    try {
      // Remove all nutrition data with the "default" userId
      const result = await this.nutritionService.getDailyNutritionModel().deleteMany({
        userId: 'default'
      }).exec();
      
      return {
        success: true,
        message: `Deleted ${result.deletedCount} records with default userId`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error clearing default data',
        error: error.message
      };
    }
  }

  @Post('associate-user')
  async associateUser(
    @Req() req: Request,
    @Body() body: { userId: string }
  ) {
    try {
      // If userId is provided in body, use it
      const userId = body.userId || req['userId'];
      
      if (!userId || userId === 'default') {
        return {
          success: false,
          message: 'Valid userId required to associate data'
        };
      }
      
      // Find all nutrition entries with default userId
      const result = await this.nutritionService.getDailyNutritionModel().updateMany(
        { userId: 'default' },
        { $set: { userId: userId } }
      ).exec();
      
      // Also update nutrition goals
      const goalsResult = await this.nutritionService.getNutritionGoalsModel().updateMany(
        { userId: 'default' },
        { $set: { userId: userId } }
      ).exec();
      
      return {
        success: true,
        message: `Associated ${result.modifiedCount} nutrition records with userId ${userId}`,
        goalsUpdated: goalsResult.modifiedCount,
        userId: userId
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error associating user data',
        error: error.message
      };
    }
  }
}
