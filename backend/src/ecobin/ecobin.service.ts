import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { Bin, Collection, Notification, PointTransaction, Reward, User, WasteLog } from '../entities';
import { disposalsTotal } from '../metrics';
import { classifyWaste, POINTS_PER_KG, WASTE_TYPES } from '../waste.util';
import { AdminStats, LeaderboardEntry, ParticipationEntry } from './ecobin.types';

const FULL_THRESHOLD = 85;

@Injectable()
export class EcobinService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Bin) private bins: Repository<Bin>,
    @InjectRepository(WasteLog) private logs: Repository<WasteLog>,
    @InjectRepository(PointTransaction) private txs: Repository<PointTransaction>,
    @InjectRepository(Reward) private rewards: Repository<Reward>,
    @InjectRepository(Notification) private notes: Repository<Notification>,
    @InjectRepository(Collection) private collections: Repository<Collection>,
  ) {}

  // ---------- seed demo data ----------
  async onModuleInit() {
    if ((await this.users.count()) === 0) {
      const hash = (p: string) => bcrypt.hashSync(p, 10);
      await this.users.save([
        { name: 'Admin', email: 'admin@ecobin.com', password: hash('admin123'), role: 'ADMIN' },
        { name: 'Demo User', email: 'demo@ecobin.com', password: hash('demo123'), role: 'USER', points: 120, totalWasteKg: 14.5 },
        { name: 'Aisha', email: 'aisha@ecobin.com', password: hash('demo123'), role: 'USER', points: 480, totalWasteKg: 52 },
        { name: 'Rahul', email: 'rahul@ecobin.com', password: hash('demo123'), role: 'USER', points: 310, totalWasteKg: 33.2 },
        { name: 'Meera', email: 'meera@ecobin.com', password: hash('demo123'), role: 'USER', points: 205, totalWasteKg: 21 },
      ] as any);
    }
    if ((await this.bins.count()) === 0) {
      const locs = ['Main Gate', 'Library', 'Canteen', 'Hostel Block A', 'Science Block', 'Sports Complex'];
      const areas = [
        'Ward 4 · Households',
        'Ward 4 · Shops',
        'Ward 5 · Households',
        'Ward 5 · Public Square',
        'Ward 6 · Households',
        'Ward 6 · Public Grounds',
      ];
      await this.bins.save(
        WASTE_TYPES.map((t, i) => ({
          name: `Bin-${String(i + 1).padStart(2, '0')}`,
          location: locs[i],
          household: areas[i],
          wasteType: t,
          capacityKg: 50,
          fillLevel: [20, 45, 62, 10, 30, 5][i],
          status: 'OK',
        })),
      );
    }
    if ((await this.rewards.count()) === 0) {
      await this.rewards.save([
        { name: 'Canteen Coffee Voucher', description: 'Free coffee at the campus canteen', cost: 50, stock: 25 },
        { name: 'Reusable Water Bottle', description: 'Steel bottle with the EcoBin logo', cost: 150, stock: 10 },
        { name: 'Eco Tote Bag', description: 'Organic cotton tote bag', cost: 100, stock: 15 },
        { name: 'Plant a Tree', description: 'We plant a tree in your name', cost: 250, stock: 50 },
        { name: 'Bookstore Discount 20%', description: '20% off at the campus bookstore', cost: 300, stock: 8 },
      ]);
    }
    if ((await this.collections.count()) === 0 && (await this.bins.count()) > 0) {
      const bins = await this.bins.find();
      const [aisha, rahul, meera] = await Promise.all(
        ['aisha@ecobin.com', 'rahul@ecobin.com', 'meera@ecobin.com'].map((email) =>
          this.users.findOne({ where: { email } }),
        ),
      );
      if (aisha && rahul && meera) {
        const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
        const demoRows = [
          { bin: bins[0], user: aisha, weightKg: 3.2, daysAgo: 2 },
          { bin: bins[2], user: rahul, weightKg: 5.5, daysAgo: 4 },
          { bin: bins[1], user: meera, weightKg: 2.1, daysAgo: 6 },
          { bin: bins[3], user: aisha, weightKg: 4.0, daysAgo: 9 },
        ].filter((r) => r.bin);
        await this.collections.save(
          demoRows.map((r) => ({
            household: r.bin.household || r.bin.location,
            wasteType: r.bin.wasteType,
            weightKg: r.weightKg,
            pointsEarned: Math.max(1, Math.round(r.weightKg * POINTS_PER_KG[r.bin.wasteType as keyof typeof POINTS_PER_KG])),
            collectedAt: day(r.daysAgo),
            userId: r.user.id,
            binId: r.bin.id,
          })),
        );
      }
    }
  }

  // ---------- helpers ----------
  async notify(userId: string, message: string, type = 'INFO') {
    await this.notes.save(this.notes.create({ userId, message, type }));
  }

  async notifyAdmins(message: string, type = 'WARNING') {
    const admins = await this.users.find({ where: { role: 'ADMIN' } });
    for (const a of admins) await this.notify(a.id, message, type);
  }

  // ---------- bins ----------
  listBins() {
    return this.bins.find({ order: { name: 'ASC' } });
  }

  async createBin(name: string, location: string, wasteType: string, capacityKg: number, household = '') {
    if (!name?.trim() || !location?.trim()) throw new BadRequestException('Name and location are required');
    if (!(WASTE_TYPES as readonly string[]).includes(wasteType)) throw new BadRequestException('Invalid waste type');
    if (!(capacityKg > 0)) throw new BadRequestException('Capacity must be positive');
    return this.bins.save(
      this.bins.create({ name: name.trim(), location: location.trim(), wasteType, capacityKg, household: household?.trim() || '' }),
    );
  }

  async updateBin(id: string, name: string, location: string, wasteType: string, capacityKg: number, household: string) {
    if (!name?.trim() || !location?.trim()) throw new BadRequestException('Name and location are required');
    if (!(WASTE_TYPES as readonly string[]).includes(wasteType)) throw new BadRequestException('Invalid waste type');
    if (!(capacityKg > 0)) throw new BadRequestException('Capacity must be positive');
    const bin = await this.bins.findOne({ where: { id } });
    if (!bin) throw new NotFoundException('Bin not found');
    bin.name = name.trim();
    bin.location = location.trim();
    bin.wasteType = wasteType;
    bin.capacityKg = capacityKg;
    bin.household = household?.trim() || '';
    return this.bins.save(bin);
  }

  async deleteBin(id: string) {
    const bin = await this.bins.findOne({ where: { id } });
    if (!bin) throw new NotFoundException('Bin not found');
    await this.collections.delete({ binId: id });
    await this.logs.delete({ binId: id });
    await this.bins.delete(id);
    return true;
  }

  async emptyBin(id: string) {
    const bin = await this.bins.findOne({ where: { id } });
    if (!bin) throw new NotFoundException('Bin not found');
    bin.fillLevel = 0;
    bin.status = 'OK';
    return this.bins.save(bin);
  }

  // ---------- waste disposal ----------
  classify(item: string) {
    return classifyWaste(item);
  }

  async dispose(user: User, binId: string, wasteType: string, weightKg: number) {
    if (!(WASTE_TYPES as readonly string[]).includes(wasteType)) throw new BadRequestException('Invalid waste type');
    if (!(weightKg > 0 && weightKg <= 25)) throw new BadRequestException('Weight must be between 0 and 25 kg');
    const bin = await this.bins.findOne({ where: { id: binId } });
    if (!bin) throw new NotFoundException('Bin not found');
    if (bin.status === 'FULL') throw new BadRequestException('This bin is full. Please use another bin.');

    const correct = bin.wasteType === wasteType;
    const points = correct ? Math.max(1, Math.round(weightKg * POINTS_PER_KG[wasteType as keyof typeof POINTS_PER_KG])) : 0;

    await this.applyFill(bin, weightKg);

    const log = await this.logs.save(
      this.logs.create({ userId: user.id, binId: bin.id, wasteType, weightKg, correct, pointsEarned: points }),
    );

    const fresh = await this.users.findOne({ where: { id: user.id } });
    fresh.totalWasteKg = Math.round((fresh.totalWasteKg + weightKg) * 100) / 100;
    fresh.points += points;
    await this.users.save(fresh);

    if (correct) {
      await this.txs.save(
        this.txs.create({ userId: user.id, type: 'EARN', points, description: `Disposed ${weightKg} kg ${wasteType} in ${bin.name}` }),
      );
      await this.notify(user.id, `Great job! You earned ${points} EcoPoints for ${weightKg} kg of ${wasteType}.`, 'SUCCESS');
    } else {
      await this.notify(
        user.id,
        `Wrong bin! ${wasteType} waste does not belong in ${bin.name} (${bin.wasteType}). No points awarded.`,
        'WARNING',
      );
    }
    disposalsTotal.inc({ waste_type: wasteType, correct: String(correct) });
    return this.logs.findOne({ where: { id: log.id }, relations: ['user'] });
  }

  private async applyFill(bin: Bin, weightKg: number) {
    const addPct = (weightKg / bin.capacityKg) * 100;
    if (bin.fillLevel + addPct > 100) throw new BadRequestException('Not enough space left in this bin');
    bin.fillLevel = Math.round((bin.fillLevel + addPct) * 10) / 10;
    if (bin.fillLevel >= FULL_THRESHOLD) {
      bin.status = 'FULL';
      await this.notifyAdmins(`${bin.name} (${bin.location}) is ${bin.fillLevel}% full and needs emptying.`);
    }
    await this.bins.save(bin);
  }

  myLogs(userId: string, limit = 50) {
    return this.logs.find({ where: { userId }, order: { createdAt: 'DESC' }, take: limit });
  }

  allLogs(limit = 50) {
    return this.logs.find({ order: { createdAt: 'DESC' }, take: limit, relations: ['user'] });
  }

  // ---------- points / rewards ----------
  myTransactions(userId: string) {
    return this.txs.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 100 });
  }

  listRewards() {
    return this.rewards.find({ order: { cost: 'ASC' } });
  }

  async redeem(user: User, rewardId: string) {
    const reward = await this.rewards.findOne({ where: { id: rewardId } });
    if (!reward) throw new NotFoundException('Reward not found');
    if (reward.stock <= 0) throw new BadRequestException('Reward out of stock');
    const fresh = await this.users.findOne({ where: { id: user.id } });
    if (fresh.points < reward.cost) throw new BadRequestException('Not enough EcoPoints');
    fresh.points -= reward.cost;
    reward.stock -= 1;
    await this.users.save(fresh);
    await this.rewards.save(reward);
    const code = 'ECO-' + randomBytes(3).toString('hex').toUpperCase();
    const tx = await this.txs.save(
      this.txs.create({ userId: user.id, type: 'REDEEM', points: -reward.cost, description: `Redeemed: ${reward.name}`, code }),
    );
    await this.notify(user.id, `You redeemed "${reward.name}". Your voucher code is ${code}.`, 'SUCCESS');
    return tx;
  }

  async createReward(name: string, description: string, cost: number, stock: number) {
    if (!name?.trim() || !(cost > 0) || !(stock >= 0)) throw new BadRequestException('Invalid reward details');
    return this.rewards.save(this.rewards.create({ name: name.trim(), description: description?.trim() || '', cost, stock }));
  }

  async updateReward(id: string, name: string, description: string, cost: number, stock: number) {
    if (!name?.trim() || !(cost > 0) || !(stock >= 0)) throw new BadRequestException('Invalid reward details');
    const reward = await this.rewards.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('Reward not found');
    reward.name = name.trim();
    reward.description = description?.trim() || '';
    reward.cost = cost;
    reward.stock = stock;
    return this.rewards.save(reward);
  }

  async deleteReward(id: string) {
    const res = await this.rewards.delete(id);
    return (res.affected ?? 0) > 0;
  }

  // ---------- leaderboard ----------
  async leaderboard(): Promise<LeaderboardEntry[]> {
    const top = await this.users.find({ where: { role: 'USER' }, order: { points: 'DESC' }, take: 10 });
    return top.map((u, i) => ({ rank: i + 1, userId: u.id, name: u.name, points: u.points, totalWasteKg: u.totalWasteKg }));
  }

  // ---------- notifications ----------
  myNotifications(userId: string) {
    return this.notes.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 50 });
  }

  unreadCount(userId: string) {
    return this.notes.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string) {
    await this.notes.update({ id, userId }, { isRead: true });
    return true;
  }

  async markAllRead(userId: string) {
    await this.notes.update({ userId, isRead: false }, { isRead: true });
    return true;
  }

  // ---------- admin: collections ----------
  async recordCollection(
    binId: string,
    userId: string,
    wasteType: string,
    weightKg: number,
    collectedAt: string,
    household: string,
  ) {
    if (!(WASTE_TYPES as readonly string[]).includes(wasteType)) throw new BadRequestException('Invalid waste type');
    if (!(weightKg > 0 && weightKg <= 250)) throw new BadRequestException('Weight must be between 0 and 250 kg');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(collectedAt || '')) throw new BadRequestException('Collection date is required');
    const bin = await this.bins.findOne({ where: { id: binId } });
    if (!bin) throw new NotFoundException('Bin not found');
    if (bin.status === 'FULL')
      throw new BadRequestException('This bin is full. Empty it before recording a collection.');
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const hh = household?.trim() || bin.household || bin.location;
    const points = Math.max(1, Math.round(weightKg * POINTS_PER_KG[wasteType as keyof typeof POINTS_PER_KG]));

    await this.applyFill(bin, weightKg);

    user.points += points;
    user.totalWasteKg = Math.round((user.totalWasteKg + weightKg) * 100) / 100;
    await this.users.save(user);

    await this.txs.save(
      this.txs.create({
        userId: user.id,
        type: 'EARN',
        points,
        description: `Collection: ${weightKg} kg ${wasteType} at ${bin.name} (${hh})`,
      }),
    );
    await this.notify(
      user.id,
      `You earned ${points} EcoPoints for ${weightKg} kg of ${wasteType} collected from ${hh}.`,
      'SUCCESS',
    );

    disposalsTotal.inc({ waste_type: wasteType, correct: 'true' });

    const saved = await this.collections.save(
      this.collections.create({
        household: hh,
        wasteType,
        weightKg,
        pointsEarned: points,
        collectedAt,
        userId: user.id,
        binId: bin.id,
      }),
    );
    return this.collections.findOne({ where: { id: saved.id }, relations: ['user'] });
  }

  listCollections(limit = 50) {
    return this.collections.find({ order: { createdAt: 'DESC' }, take: limit, relations: ['user'] });
  }

  async participation(): Promise<ParticipationEntry[]> {
    const rows = await this.collections
      .createQueryBuilder('c')
      .select('c.household', 'household')
      .addSelect('COUNT(1)', 'collections')
      .addSelect('COALESCE(SUM(c.weightKg),0)', 'kg')
      .addSelect('COALESCE(SUM(c.pointsEarned),0)', 'points')
      .groupBy('c.household')
      .orderBy('kg', 'DESC')
      .getRawMany();
    return rows.map((r) => ({
      household: r.household,
      collections: Number(r.collections) || 0,
      totalKg: Math.round(Number(r.kg) * 100) / 100,
      totalPoints: Number(r.points) || 0,
    }));
  }

  // ---------- admin ----------
  adminUsers() {
    return this.users.find({ order: { createdAt: 'DESC' } });
  }

  async updateUser(me: User, id: string, name: string, role: string, points: number) {
    if (!name?.trim()) throw new BadRequestException('Name is required');
    if (role !== 'USER' && role !== 'ADMIN') throw new BadRequestException('Invalid role');
    if (!(points >= 0)) throw new BadRequestException('Points must be zero or more');
    if (me.id === id && role !== 'ADMIN') throw new BadRequestException('You cannot remove your own admin role');
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.name = name.trim();
    user.role = role;
    user.points = points;
    return this.users.save(user);
  }

  async deleteUser(me: User, id: string) {
    if (me.id === id) throw new BadRequestException('You cannot delete your own account');
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.logs.delete({ userId: id });
    await this.txs.delete({ userId: id });
    await this.notes.delete({ userId: id });
    await this.collections.delete({ userId: id });
    await this.users.delete(id);
    return true;
  }

  async deleteWasteLog(id: string) {
    const res = await this.logs.delete(id);
    return (res.affected ?? 0) > 0;
  }

  async adminStats(): Promise<AdminStats> {
    const [users, bins, fullBins, disposals, redemptions] = await Promise.all([
      this.users.count({ where: { role: 'USER' } }),
      this.bins.count(),
      this.bins.count({ where: { status: 'FULL' } }),
      this.logs.count(),
      this.txs.count({ where: { type: 'REDEEM' } }),
    ]);
    const kg = await this.logs
      .createQueryBuilder('l')
      .select('l.wasteType', 'wasteType')
      .addSelect('SUM(l.weightKg)', 'kg')
      .groupBy('l.wasteType')
      .getRawMany();
    const earned = await this.txs
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.points),0)', 'sum')
      .where("t.type = 'EARN'")
      .getRawOne();
    const wasteByType = WASTE_TYPES.map((t) => ({
      wasteType: t,
      kg: Math.round((Number(kg.find((r) => r.wasteType === t)?.kg) || 0) * 100) / 100,
    }));
    return {
      users,
      bins,
      fullBins,
      disposals,
      redemptions,
      totalWasteKg: Math.round(wasteByType.reduce((s, w) => s + w.kg, 0) * 100) / 100,
      pointsIssued: Number(earned?.sum) || 0,
      wasteByType,
    };
  }
}
