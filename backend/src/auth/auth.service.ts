import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../entities';

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private users: Repository<User>, private jwt: JwtService) {}

  async register(name: string, email: string, password: string) {
    email = (email || '').trim().toLowerCase();
    if (!name?.trim()) throw new BadRequestException('Name is required');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new BadRequestException('Valid email is required');
    if (!password || password.length < 6) throw new BadRequestException('Password must be at least 6 characters');
    if (await this.users.findOne({ where: { email } })) throw new BadRequestException('Email already registered');
    const user = await this.users.save(
      this.users.create({ name: name.trim(), email, password: await bcrypt.hash(password, 10), role: 'USER' }),
    );
    return this.sign(user);
  }

  async login(email: string, password: string) {
    const user = await this.authenticate(email, password);
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Admin accounts must sign in through the admin portal');
    }
    return this.sign(user);
  }

  async adminLogin(email: string, password: string) {
    const user = await this.authenticate(email, password);
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access only. Contact your administrator.');
    }
    return this.sign(user);
  }

  private async authenticate(email: string, password: string) {
    const user = await this.users.findOne({ where: { email: (email || '').trim().toLowerCase() } });
    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return user;
  }

  private sign(user: User) {
    return { token: this.jwt.sign({ sub: user.id, role: user.role }), user };
  }
}
