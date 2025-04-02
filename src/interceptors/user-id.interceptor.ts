import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UserIdInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    console.log('Headers:', JSON.stringify(request.headers));
    console.log('URL:', request.url);
    
    // Check for Authorization header
    if (request.headers.authorization) {
      const authHeader = request.headers.authorization;
      console.log(`Auth header: ${authHeader}`);
      
      // Extract token from the Authorization header
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove "Bearer " prefix
        
        // For our fake token, just use 'fake-jwt-token' as the key
        if (token.startsWith('fake-jwt-token')) {
          // Strip any additional parts (like :userId)
          const baseToken = 'fake-jwt-token';
          
          // Check if token has userId embedded (format: "fake-jwt-token:userId")
          if (token.includes(':')) {
            const userId = token.split(':')[1];
            request.userId = userId;
            console.log(`Extracted userId from token format: ${request.userId}`);
          } 
          // Otherwise look up the token in our service
          else {
            const userId = this.authService.getUserIdFromToken(baseToken);
            if (userId) {
              request.userId = userId;
              console.log(`Found userId for token in map: ${request.userId}`);
            }
          }
        }
      }
    }
    
    // If by this point we don't have a userId, try other methods
    if (!request.userId) {
      // If this is a login or register request, don't worry about userId
      if (request.url === '/auth/login' || request.url === '/auth/register') {
        console.log('Login/Register request, no userId needed yet');
      }
      // If user-id header is present, use that
      else if (request.headers['user-id']) {
        request.userId = request.headers['user-id'];
        console.log(`Using userId from header: ${request.userId}`);
      }
      // If userId in cookies, use that
      else if (request.cookies && request.cookies.userId) {
        request.userId = request.cookies.userId;
        console.log(`Using userId from cookie: ${request.userId}`);
      }
      // If userId in query params, use that
      else if (request.query.userId) {
        request.userId = request.query.userId;
        console.log(`Using userId from query param: ${request.userId}`);
      }
      // Try to get userId from authenticated user
      else if (request.user && request.user._id) {
        request.userId = request.user._id;
        console.log(`Using userId from auth: ${request.userId}`);
      }
      // Default to 'default'
      else {
        request.userId = 'default';
        console.log(`No userId found, using default`);
      }
    }
    
    console.log(`[UserIdInterceptor] Final userId: ${request.userId}`);
    
    return next.handle();
  }
} 