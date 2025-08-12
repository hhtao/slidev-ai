
import { IsString, MinLength,IsEnum } from 'class-validator';


export class CreateUserDto {
    @IsString()
    @MinLength(4)
    username!: string;

    @IsString()
    @MinLength(6)
    password!: string;

     @IsString()
    @MinLength(6)
    email!: string;
}