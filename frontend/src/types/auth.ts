// This file defines the shapes of data for authentication
// It should match your NestJS DTOs

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface LoginDto {
  identifier: string;
  password: string;
}

// This is the expected response from your login API
export interface LoginResponse {
  accessToken: string;
}
