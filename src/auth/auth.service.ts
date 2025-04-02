import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../models/user.entity';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  // In-memory token to userId mapping (for development purposes only)
  private tokenToUserMap: Map<string, string> = new Map();


  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly httpService: HttpService,
  ) {}

  // Set the userId for a token
  setUserForToken(token: string, userId: string): void {
    console.log(`Setting userId ${userId} for token: ${token}`);
    this.tokenToUserMap.set(token, userId);
  }

  // Get userId from token 
  getUserIdFromToken(token: string): string | null {
    const userId = this.tokenToUserMap.get(token);
    console.log(`Looking up token ${token}: userId = ${userId || 'not found'}`);
    return userId || null;
  }

  getCurrentUserId(): string | null {
    const userData = localStorage.getItem('user_data'); // Use string directly instead of this.userKey
    if (!userData) return null;
    
    try {
      const user = JSON.parse(userData);
      return user && user.id ? String(user.id) : null;
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  async login(username: string, password: string) {
    // Log the login attempt for debugging
    console.log(`Login attempt with username: "${username}" and password length: ${password?.length}`);
    
    // Try to find user by username or email
    const user = await this.userModel.findOne({ 
      $or: [
        { username },
        { email: username } // Also try matching email
      ],
      password 
    }).exec();
    
    if (!user) {
      // Debug message to check if any users exist with this username or email
      const existingUser = await this.userModel.findOne({ 
        $or: [
          { username },
          { email: username }
        ]
      }).exec();
      
      if (existingUser) {
        console.log('User found but password does not match');
      } else {
        console.log('No user found with this username or email');
      }
      
      return { success: false, message: 'Invalid credentials' };
    }
    
    console.log(`Successfully authenticated user: ${user.username}`);
    
    const userObject = user.toObject();
    const { password: _, ...result } = userObject;
    
    // Store the mapping of token to userId
    const userId = String(userObject._id);
    const token = 'fake-jwt-token';
    this.setUserForToken(token, userId);
    
    // Associate any default data with this user
    await this.associateUserData(userId);
    
    return {
      success: true,
      access_token: token,
      user: result,
      userId: userId // Include userId explicitly in response
    };
  }
  
  async register(userData: any) {
    // Check if user exists
    const existingUser = await this.userModel.findOne({ 
      username: userData.username 
    }).exec();
    
    if (existingUser) {
      return { success: false, message: 'Username already exists' };
    }
    
    const existingEmail = await this.userModel.findOne({ 
      email: userData.email 
    }).exec();
    
    if (existingEmail) {
      return { success: false, message: 'Email already in use' };
    }
    
    // Create user
    const newUser = new this.userModel(userData);
    await newUser.save();
    
    console.log('Registered user:', newUser);
    
    // Return without password
    const userObject = newUser.toObject();
    const { password, ...result } = userObject;
    
    // Store the mapping of token to userId
    const userId = String(userObject._id);
    const token = 'fake-jwt-token';
    this.setUserForToken(token, userId);
    
    // Associate any default data with this user
    await this.associateUserData(userId);
    
    return {
      success: true,
      access_token: token,
      user: result,
      userId: userId // Include userId explicitly in response
    };
  }

  // Helper method to associate default data with a user
  async associateUserData(userId: string): Promise<any> {
    try {
      console.log(`Associating data for user ${userId}`);
      // Call the nutrition service endpoint to associate data
      const response = await firstValueFrom(
        this.httpService.post('http://localhost:3000/nutrition/associate-user', {
          userId: userId
        })
      );
      console.log(`Successfully associated data for user ${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to associate data for user ${userId}:`, error);
      throw error;
    }
  }
} 