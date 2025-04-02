import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import * as cors from 'cors';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.use(cors());
  
  // Remove the global interceptor since it's now registered in the AppModule
  // and requires AuthService dependency
  
  // Start server
  await app.listen(3000);
  logger.log('Server running on http://localhost:3000');
}
bootstrap();
