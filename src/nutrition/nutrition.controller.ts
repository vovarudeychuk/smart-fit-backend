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
} from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { FoodItem } from '../models/food-item.entity';
import { NutritionGoals } from '../models/nutrition-goals.entity';

@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('foods')
  getAllFoods() {
    return this.nutritionService.getAllFoods();
  }

  @Get('foods/search')
  searchFoods(@Query('query') query: string) {
    return this.nutritionService.searchFoods(query);
  }

  @Post('foods')
  addFood(@Body() newFood: FoodItem) {
    return this.nutritionService.addFoodToDatabase(newFood);
  }

  @Put('foods/:id')
  updateFood(@Param('id') id: string, @Body() updatedFood: FoodItem) {
    return this.nutritionService.updateFoodInDatabase(+id, updatedFood);
  }

  @Delete('foods/:id')
  deleteFood(@Param('id') id: string) {
    this.nutritionService.deleteFoodFromDatabase(+id);
    return { success: true };
  }

  @Get('goals')
  getNutritionGoals() {
    return this.nutritionService.getNutritionGoals();
  }

  @Put('goals')
  updateNutritionGoals(@Body() goals: NutritionGoals) {
    return this.nutritionService.updateNutritionGoals(goals);
  }

  @Get('weekly')
  getWeeklyNutrition(@Query('weekStartDate') weekStartDate?: string) {
    console.log(
      `[API] Getting nutrition for week starting: ${weekStartDate || 'current'}`,
    );

    if (weekStartDate) {
      return this.nutritionService.getWeeklyNutritionForDate(
        new Date(weekStartDate),
      );
    }

    return this.nutritionService.getWeeklyNutrition();
  }

  @Get('daily')
  getDailyNutritionByDate(@Query('date') date: string) {
    return this.nutritionService.getDailyNutritionByDate(new Date(date));
  }

  @Get('daily/:dayIndex')
  getDailyNutrition(@Param('dayIndex') dayIndex: string) {
    return this.nutritionService.getDailyNutrition(+dayIndex);
  }

  @Post('day/:dayIndex/foods')
  addFoodToDay(
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Body() foodItem: FoodItem,
    @Query('weekStartDate') weekStartDate?: string,
  ) {
    console.log(`[API] Adding food to day ${dayIndex}:`, foodItem);

    if (weekStartDate) {
      return this.nutritionService.addFoodItemForWeek(
        new Date(weekStartDate),
        dayIndex,
        foodItem,
      );
    }

    return this.nutritionService.addFoodItem(dayIndex, foodItem);
  }

  @Put('day/:dayIndex/foods/:foodItemId')
  updateFoodItem(
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Param('foodItemId', ParseIntPipe) foodItemId: number,
    @Body() foodItem: FoodItem,
    @Query('weekStartDate') weekStartDate?: string,
  ) {
    console.log(
      `[API] Updating food ${foodItemId} on day ${dayIndex}:`,
      foodItem,
    );

    if (weekStartDate) {
      return this.nutritionService.updateFoodItemForWeek(
        new Date(weekStartDate),
        dayIndex,
        foodItem,
      );
    }

    return this.nutritionService.updateFoodItem(dayIndex, foodItem);
  }

  @Delete('day/:dayIndex/foods/:foodItemId')
  removeFoodItem(
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Param('foodItemId', ParseIntPipe) foodItemId: number,
    @Query('weekStartDate') weekStartDate?: string,
  ) {
    console.log(`[API] Removing food ${foodItemId} from day ${dayIndex}`);

    if (weekStartDate) {
      return this.nutritionService.removeFoodItemForWeek(
        new Date(weekStartDate),
        dayIndex,
        foodItemId,
      );
    }

    return this.nutritionService.removeFoodItem(dayIndex, foodItemId);
  }

  @Post('move-food')
  moveFoodBetweenDays(
    @Body()
    moveData: {
      sourceDayIndex: number;
      targetDayIndex: number;
      foodItemId: number;
    },
    @Query('weekStartDate') weekStartDate?: string,
  ) {
    console.log(
      `[API] Moving food ${moveData.foodItemId} from day ${moveData.sourceDayIndex} to day ${moveData.targetDayIndex}`,
    );

    if (weekStartDate) {
      return this.nutritionService.moveFoodBetweenDaysForWeek(
        new Date(weekStartDate),
        moveData.sourceDayIndex,
        moveData.targetDayIndex,
        moveData.foodItemId,
      );
    }

    return this.nutritionService.moveFoodBetweenDays(
      moveData.sourceDayIndex,
      moveData.targetDayIndex,
      moveData.foodItemId,
    );
  }

  @Get('health')
  healthCheck() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }
}
