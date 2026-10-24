import { UseGuards } from '@nestjs/common';
import { Args, Float, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AdminGuard, CurrentUser, GqlAuthGuard } from '../auth/guards';
import { Bin, Collection, Notification, PointTransaction, Reward, User, WasteLog } from '../entities';
import { EcobinService } from './ecobin.service';
import { AdminStats, LeaderboardEntry, ParticipationEntry, WasteClassification } from './ecobin.types';

@Resolver()
@UseGuards(GqlAuthGuard)
export class EcobinResolver {
  constructor(private svc: EcobinService) {}

  // ----- user -----
  @Query(() => User)
  me(@CurrentUser() user: User) {
    return user;
  }

  // ----- bins -----
  @Query(() => [Bin])
  bins() {
    return this.svc.listBins();
  }

  // ----- waste -----
  @Query(() => WasteClassification)
  classifyWaste(@Args('item') item: string) {
    return this.svc.classify(item);
  }

  @Mutation(() => WasteLog)
  disposeWaste(
    @CurrentUser() user: User,
    @Args('binId', { type: () => ID }) binId: string,
    @Args('wasteType') wasteType: string,
    @Args('weightKg', { type: () => Float }) weightKg: number,
  ) {
    return this.svc.dispose(user, binId, wasteType, weightKg);
  }

  @Query(() => [WasteLog])
  myWasteLogs(@CurrentUser() user: User, @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number) {
    return this.svc.myLogs(user.id, limit);
  }

  // ----- points & rewards -----
  @Query(() => [PointTransaction])
  myTransactions(@CurrentUser() user: User) {
    return this.svc.myTransactions(user.id);
  }

  @Query(() => [Reward])
  rewards() {
    return this.svc.listRewards();
  }

  @Mutation(() => PointTransaction)
  redeemReward(@CurrentUser() user: User, @Args('rewardId', { type: () => ID }) rewardId: string) {
    return this.svc.redeem(user, rewardId);
  }

  @Query(() => [LeaderboardEntry])
  leaderboard() {
    return this.svc.leaderboard();
  }

  // ----- notifications -----
  @Query(() => [Notification])
  notifications(@CurrentUser() user: User) {
    return this.svc.myNotifications(user.id);
  }

  @Query(() => Int)
  unreadCount(@CurrentUser() user: User) {
    return this.svc.unreadCount(user.id);
  }

  @Mutation(() => Boolean)
  markNotificationRead(@CurrentUser() user: User, @Args('id', { type: () => ID }) id: string) {
    return this.svc.markRead(user.id, id);
  }

  @Mutation(() => Boolean)
  markAllNotificationsRead(@CurrentUser() user: User) {
    return this.svc.markAllRead(user.id);
  }

  // ----- admin -----
  @Query(() => AdminStats)
  @UseGuards(AdminGuard)
  adminStats() {
    return this.svc.adminStats();
  }

  @Query(() => [User])
  @UseGuards(AdminGuard)
  adminUsers() {
    return this.svc.adminUsers();
  }

  @Query(() => [WasteLog])
  @UseGuards(AdminGuard)
  adminWasteLogs(@Args('limit', { type: () => Int, defaultValue: 20 }) limit: number) {
    return this.svc.allLogs(limit);
  }

  @Mutation(() => Bin)
  @UseGuards(AdminGuard)
  createBin(
    @Args('name') name: string,
    @Args('location') location: string,
    @Args('wasteType') wasteType: string,
    @Args('capacityKg', { type: () => Float }) capacityKg: number,
    @Args('household', { defaultValue: '' }) household: string,
  ) {
    return this.svc.createBin(name, location, wasteType, capacityKg, household);
  }

  @Mutation(() => Bin)
  @UseGuards(AdminGuard)
  updateBin(
    @Args('id', { type: () => ID }) id: string,
    @Args('name') name: string,
    @Args('location') location: string,
    @Args('wasteType') wasteType: string,
    @Args('capacityKg', { type: () => Float }) capacityKg: number,
    @Args('household', { defaultValue: '' }) household: string,
  ) {
    return this.svc.updateBin(id, name, location, wasteType, capacityKg, household);
  }

  @Mutation(() => Boolean)
  @UseGuards(AdminGuard)
  deleteBin(@Args('id', { type: () => ID }) id: string) {
    return this.svc.deleteBin(id);
  }

  @Mutation(() => Bin)
  @UseGuards(AdminGuard)
  emptyBin(@Args('id', { type: () => ID }) id: string) {
    return this.svc.emptyBin(id);
  }

  // ----- admin: collections -----
  @Mutation(() => Collection)
  @UseGuards(AdminGuard)
  recordCollection(
    @Args('binId', { type: () => ID }) binId: string,
    @Args('userId', { type: () => ID }) userId: string,
    @Args('wasteType') wasteType: string,
    @Args('weightKg', { type: () => Float }) weightKg: number,
    @Args('collectedAt') collectedAt: string,
    @Args('household', { defaultValue: '' }) household: string,
  ) {
    return this.svc.recordCollection(binId, userId, wasteType, weightKg, collectedAt, household);
  }

  @Query(() => [Collection])
  @UseGuards(AdminGuard)
  collections(@Args('limit', { type: () => Int, defaultValue: 50 }) limit: number) {
    return this.svc.listCollections(limit);
  }

  @Query(() => [ParticipationEntry])
  @UseGuards(AdminGuard)
  householdParticipation() {
    return this.svc.participation();
  }

  @Mutation(() => Reward)
  @UseGuards(AdminGuard)
  createReward(
    @Args('name') name: string,
    @Args('description') description: string,
    @Args('cost', { type: () => Int }) cost: number,
    @Args('stock', { type: () => Int }) stock: number,
  ) {
    return this.svc.createReward(name, description, cost, stock);
  }

  @Mutation(() => Reward)
  @UseGuards(AdminGuard)
  updateReward(
    @Args('id', { type: () => ID }) id: string,
    @Args('name') name: string,
    @Args('description') description: string,
    @Args('cost', { type: () => Int }) cost: number,
    @Args('stock', { type: () => Int }) stock: number,
  ) {
    return this.svc.updateReward(id, name, description, cost, stock);
  }

  @Mutation(() => Boolean)
  @UseGuards(AdminGuard)
  deleteReward(@Args('id', { type: () => ID }) id: string) {
    return this.svc.deleteReward(id);
  }

  // ----- admin: users & waste records -----
  @Mutation(() => User)
  @UseGuards(AdminGuard)
  updateUser(
    @CurrentUser() me: User,
    @Args('id', { type: () => ID }) id: string,
    @Args('name') name: string,
    @Args('role') role: string,
    @Args('points', { type: () => Int }) points: number,
  ) {
    return this.svc.updateUser(me, id, name, role, points);
  }

  @Mutation(() => Boolean)
  @UseGuards(AdminGuard)
  deleteUser(@CurrentUser() me: User, @Args('id', { type: () => ID }) id: string) {
    return this.svc.deleteUser(me, id);
  }

  @Mutation(() => Boolean)
  @UseGuards(AdminGuard)
  deleteWasteLog(@Args('id', { type: () => ID }) id: string) {
    return this.svc.deleteWasteLog(id);
  }
}
