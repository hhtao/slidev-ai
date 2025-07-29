import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSlideDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  outline!: string;
}