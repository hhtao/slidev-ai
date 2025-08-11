import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateSlideDto {
    @IsString()
    @IsNotEmpty()
    title!: string;

    @IsString()
    @IsNotEmpty()
    content!: string;

    @IsString()
    @IsNotEmpty()
    @IsEnum(['public', 'private'])
    visibility!: 'public' | 'private';
}
