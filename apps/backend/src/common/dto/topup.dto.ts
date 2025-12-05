import { IsString, IsNumber, IsNotEmpty, IsOptional, Min, Max } from 'class-validator';

export class CreateTopUpDto {
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @IsString()
  @IsNotEmpty()
  planCode: string;

  @IsNumber()
  @Min(0.01)
  @Max(10000)
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;
}

export class TopUpCheckoutDto {
  @IsString()
  @IsNotEmpty()
  iccid: string;

  @IsString()
  @IsNotEmpty()
  planCode: string;

  @IsNumber()
  @Min(0.01)
  @Max(10000)
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsOptional()
  displayCurrency?: string;
}

