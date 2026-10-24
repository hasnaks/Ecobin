import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class User {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id: string;
  @Field() @Column() name: string;
  @Field() @Column({ unique: true }) email: string;
  @Column() password: string;
  @Field() @Column({ default: 'USER' }) role: string; // USER | ADMIN
  @Field(() => Int) @Column({ default: 0 }) points: number;
  @Field(() => Float) @Column({ type: 'float', default: 0 }) totalWasteKg: number;
  @Field() @CreateDateColumn() createdAt: Date;
}

@ObjectType()
@Entity()
export class Bin {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id: string;
  @Field() @Column() name: string;
  @Field() @Column() location: string;
  @Field() @Column({ default: '' }) household: string; // assigned household / area
  @Field() @Column() wasteType: string;
  @Field(() => Float) @Column({ type: 'float', default: 50 }) capacityKg: number;
  @Field(() => Float) @Column({ type: 'float', default: 0 }) fillLevel: number; // percent
  @Field() @Column({ default: 'OK' }) status: string; // OK | FULL
  @Field() @CreateDateColumn() createdAt: Date;
}

@ObjectType()
@Entity()
export class WasteLog {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id: string;
  @Field() @Column() wasteType: string;
  @Field(() => Float) @Column({ type: 'float' }) weightKg: number;
  @Field() @Column() correct: boolean;
  @Field(() => Int) @Column({ default: 0 }) pointsEarned: number;
  @Column() userId: string;
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
  @Column() binId: string;
  @Field(() => Bin, { nullable: true })
  @ManyToOne(() => Bin, { eager: true, onDelete: 'CASCADE' })
  bin: Bin;
  @Field() @CreateDateColumn() createdAt: Date;
}

@ObjectType()
@Entity()
export class PointTransaction {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Field() @Column() type: string; // EARN | REDEEM
  @Field(() => Int) @Column() points: number; // signed
  @Field() @Column() description: string;
  @Field({ nullable: true }) @Column({ nullable: true }) code: string;
  @Field() @CreateDateColumn() createdAt: Date;
}

@ObjectType()
@Entity()
export class Reward {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id: string;
  @Field() @Column() name: string;
  @Field() @Column() description: string;
  @Field(() => Int) @Column() cost: number;
  @Field(() => Int) @Column({ default: 10 }) stock: number;
}

@ObjectType()
@Entity()
export class Notification {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id: string;
  @Column() userId: string;
  @Field() @Column() message: string;
  @Field() @Column({ default: 'INFO' }) type: string; // INFO | SUCCESS | WARNING
  @Field() @Column({ default: false }) isRead: boolean;
  @Field() @CreateDateColumn() createdAt: Date;
}

@ObjectType()
@Entity()
export class Collection {
  @Field(() => ID) @PrimaryGeneratedColumn('uuid') id: string;
  @Field() @Column() household: string;
  @Field() @Column() wasteType: string;
  @Field(() => Float) @Column({ type: 'float' }) weightKg: number;
  @Field(() => Int) @Column({ default: 0 }) pointsEarned: number;
  @Field() @Column() collectedAt: string; // YYYY-MM-DD
  @Column() userId: string;
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
  @Column() binId: string;
  @Field(() => Bin, { nullable: true })
  @ManyToOne(() => Bin, { eager: true, onDelete: 'CASCADE' })
  bin: Bin;
  @Field() @CreateDateColumn() createdAt: Date;
}

export const ENTITIES = [User, Bin, WasteLog, PointTransaction, Reward, Notification, Collection];
