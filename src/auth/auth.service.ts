import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async register(user: any) {
    // Check if user exists
    const existingUser = await this.usersService.findByUsername(user.username);
    if (existingUser) {
      return { success: false, message: 'Username already exists' };
    }

    const existingEmail = await this.usersService.findByEmail(user.email);
    if (existingEmail) {
      return { success: false, message: 'Email already in use' };
    }

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(user.password, salt);

    // Create user
    const newUser = await this.usersService.create({
      ...user,
      password: hashedPassword,
    });

    // Return token
    const { password, ...result } = newUser;
    return {
      success: true,
      access_token: this.jwtService.sign({ username: result.username, sub: result.id }),
      user: result,
    };
  }
}
