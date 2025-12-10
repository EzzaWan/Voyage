import { IsString, IsEmail, IsOptional, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  orderId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  device?: string;

  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(10, { message: 'Message must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Message must be no more than 1000 characters long' })
  message: string;
}

