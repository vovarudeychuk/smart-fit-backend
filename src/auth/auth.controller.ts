import { Controller, Post, Body, Get, Req, Res, HttpStatus, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res() res: Response
  ) {
    const result = await this.authService.login(body.username, body.password);
    
    if (result.success && result.user) {
      try {
        // Create a simple userId string
        const userId = String(result.user._id);
        
        // Store this mapping for future requests
        this.authService.setUserForToken('fake-jwt-token', userId);
        
        // Set userId in response
        result.userId = userId;
        
        console.log(`Login success, userId: ${userId} mapped to token: fake-jwt-token`);
      } catch (error) {
        console.error('Error setting auth token mapping:', error);
      }
    }
    
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('register')
  async register(
    @Body() body: any,
    @Res() res: Response
  ) {
    const result = await this.authService.register(body);
    
    if (result.success && result.user) {
      try {
        // Create a simple userId string
        const userId = String(result.user._id);
        
        // Set custom auth header with user ID embedded
        // Format: "Bearer fake-jwt-token:userId"
        const authToken = `Bearer fake-jwt-token:${userId}`;
        
        // Set in auth header
        res.setHeader('Authorization', authToken);
        
        console.log(`Registration success, setting auth header with userId: ${userId}`);
        console.log(`Auth header: ${authToken}`);
      } catch (error) {
        console.error('Error setting auth header:', error);
      }
    }
    
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('set-user-id')
  async setUserId(
    @Headers('authorization') authHeader: string,
    @Body() body: { userId: string }
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, message: 'Authorization header required' };
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const userId = body.userId;

    if (!userId) {
      return { success: false, message: 'userId required in request body' };
    }

    // Associate this token with the userId
    this.authService.setUserForToken(token, userId);
    
    return { 
      success: true, 
      message: 'UserId associated with token',
      userId: userId,
      token: token
    };
  }

  @Get('profile')
  getProfile(@Req() req, @Headers('authorization') auth: string) {
    let userId = 'unknown';
    
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.substring(7); // Remove "Bearer " prefix
      
      // Try to get userId from our service
      userId = this.authService.getUserIdFromToken(token) || 'unknown';
      
      // If not found and it's our special format with userId embedded
      if (userId === 'unknown' && token.includes(':')) {
        const parts = token.split(':');
        if (parts.length > 1) {
          userId = parts[1];
        }
      }
    }
    
    return { 
      id: userId, 
      username: 'user', 
      email: 'user@example.com',
      userId: userId
    };
  }

  @Post('associate-user-data')
  async associateUserData(
    @Req() req: Request,
    @Body() body: { userId?: string }
  ) {
    try {
      // Get userId from request (set by interceptor) or from body
      const userId = req['userId'] || body.userId;
      
      if (!userId || userId === 'default') {
        return {
          success: false,
          message: 'Valid userId required to associate data'
        };
      }
      
      // Call nutrition service to associate data
      const response = await this.authService.associateUserData(userId);
      
      return {
        success: true,
        message: `Associated user data for ${userId}`,
        details: response
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