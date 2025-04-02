import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NutritionModule } from './nutrition/nutrition.module';
import { AuthModule } from './auth/auth.module';
import { UserIdInterceptor } from './interceptors/user-id.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/smart-fit'),
    NutritionModule, 
    AuthModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserIdInterceptor,
    }
  ],
})
export class AppModule {}
