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
  NotFoundException,
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
    if (weekStartDate) {
      console.log(
        `[API] Getting nutrition for week starting: ${weekStartDate}`,
      );
      return this.nutritionService.getWeeklyNutritionForDate(
        new Date(weekStartDate),
      );
    }
    console.log('[API] Getting nutrition for current week');
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

  @Put('day/:dayIndex/foods/:foodId')
  updateFoodInDay(
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Param('foodId', ParseIntPipe) foodId: number,
    @Body() updatedFood: FoodItem,
  ) {
    return this.nutritionService.updateFoodItem(dayIndex, foodId, updatedFood);
  }

  @Delete('day/:dayIndex/foods/:foodId')
  deleteFoodFromDay(
    @Param('dayIndex', ParseIntPipe) dayIndex: number,
    @Param('foodId', ParseIntPipe) foodId: number,
  ) {
    return this.nutritionService.deleteFoodItem(dayIndex, foodId);
  }

  @Post('move-food')
  moveFoodBetweenDays(
    @Body()
    moveData: {
      sourceDayIndex: number;
      targetDayIndex: number;
      foodItemId: number;
    },
  ) {
    const { sourceDayIndex, targetDayIndex, foodItemId } = moveData;
    // Get the food from source day
    const sourceDay = this.nutritionService.getDailyNutrition(sourceDayIndex);
    const foodToMove = sourceDay.foodItems.find(
      (food) => food.id === foodItemId,
    );

    if (!foodToMove) {
      throw new NotFoundException('Food item not found');
    }
    // Delete from source
    this.nutritionService.deleteFoodItem(sourceDayIndex, foodItemId);
    // Add to target
    this.nutritionService.addFoodItem(targetDayIndex, foodToMove);
    return { success: true };
  }

  @Get('health')
  healthCheck() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }
}
