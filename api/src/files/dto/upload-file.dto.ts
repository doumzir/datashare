import { IsOptional, IsString, IsNumberString, MinLength, MaxLength } from 'class-validator';

export class UploadFileDto {
  @IsOptional()
  @IsNumberString()
  expiresIn?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  tags?: string;
}
