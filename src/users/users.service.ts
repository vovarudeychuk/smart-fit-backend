import { Injectable } from '@nestjs/common';
import { User } from '../models/user.entity';

@Injectable()
export class UsersService {
  private users: User[] = [];
  private nextId = 1;

  async findByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async findById(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async create(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: this.nextId++,
      username: userData.username ?? '',
      email: userData.email ?? '',
      password: userData.password ?? '',
      firstName: userData.firstName,
      lastName: userData.lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  async update(id: number, userData: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) {
      return undefined;
    }

    const updatedUser = {
      ...this.users[index],
      ...userData,
      updatedAt: new Date(),
    };

    this.users[index] = updatedUser;
    return updatedUser;
  }

  async remove(id: number): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) {
      return false;
    }

    this.users.splice(index, 1);
    return true;
  }

  async findAll(): Promise<User[]> {
    return this.users.map(({ password, ...user }) => user as User);
  }
} 