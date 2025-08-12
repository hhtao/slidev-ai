import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UserRepository } from '../app/users/users.repository';
import { CreateUserDto } from '../app/users/user.dto';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get(UserRepository);

  // 从环境变量读取超级管理员信息，没有则交互输入
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  function ask(question: string): Promise<string> {
    return new Promise(resolve => rl.question(question, resolve));
  }

  let email = process.env.ADMIN_EMAIL;
  let password = process.env.ADMIN_PASSWORD;
  let username = process.env.ADMIN_USERNAME;

  if (!email) {
    email = await ask('请输入超级管理员邮箱: ');
  }
  if (!username) {
    username = await ask('请输入超级管理员用户名: ');
  }
  if (!password) {
    password = await ask('请输入超级管理员密码: ');
  }

  // 检查是否已存在超级管理员
  const exist = await userRepository.findOneByUsername(username);
  if (exist) {
    console.log('创建失败，用户名已存在:', username);
    rl.close();
    await app.close();
    return;
  }

  // 创建超级管理员
  const hash = await bcrypt.hash(password, 10);
  const adminDto: any = {
    username,
    password: hash,
    email:email,
    role: 'admin',
  };
  await userRepository.create(adminDto);
  console.log('超级管理员创建成功:', username);
  rl.close();
  await app.close();
}

bootstrap();
