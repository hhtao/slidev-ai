import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSlideDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  outline?: string;
}