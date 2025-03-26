import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { NutritionService } from './nutrition.service';
import { FoodItem } from '../models/food-item.entity';
import { NutritionGoals } from '../models/nutrition-goals.entity';

@Controller('nutrition')
export class NutritionController {
  constructor(private readonly nutritionService: NutritionService) {}

  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

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
  getWeeklyNutrition() {
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
    @Param('dayIndex') dayIndex: string,
    @Body() foodItem: FoodItem,
  ) {
    return this.nutritionService.addFoodItem(+dayIndex, foodItem);
  }

  @Put('day/:dayIndex/foods/:foodId')
  updateFoodInDay(
    @Param('dayIndex') dayIndex: string,
    @Param('foodId') foodId: string,
    @Body() updatedFood: FoodItem,
  ) {
    return this.nutritionService.updateFoodItem(
      +dayIndex,
      +foodId,
      updatedFood,
    );
  }

  @Delete('day/:dayIndex/foods/:foodId')
  deleteFoodFromDay(
    @Param('dayIndex') dayIndex: string,
    @Param('foodId') foodId: string,
  ) {
    return this.nutritionService.deleteFoodItem(+dayIndex, +foodId);
  }

  @Post('move-food')
  moveFoodBetweenDays(
    @Body() moveData: { sourceDayIndex: number; targetDayIndex: number; foodItemId: number },
  ) {
    return this.nutritionService.moveFoodBetweenDays(
      moveData.sourceDayIndex,
      moveData.targetDayIndex,
      moveData.foodItemId,
    );
  }
}
