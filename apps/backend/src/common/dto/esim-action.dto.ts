import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EsimSyncDto {
  @IsString()
  @IsNotEmpty()
  iccid: string;
}

export class EsimSuspendDto {
  @IsString()
  @IsNotEmpty()
  iccid: string;
}

export class EsimUnsuspendDto {
  @IsString()
  @IsNotEmpty()
  esimTranNo: string;
}

export class EsimRevokeDto {
  @IsString()
  @IsNotEmpty()
  esimTranNo: string;
}

