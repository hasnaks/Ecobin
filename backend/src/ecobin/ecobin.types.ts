import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class WasteClassification {
  @Field() item: string;
  @Field() found: boolean;
  @Field() wasteType: string;
  @Field() binColor: string;
  @Field() tip: string;
}

@ObjectType()
export class LeaderboardEntry {
  @Field(() => Int) rank: number;
  @Field() userId: string;
  @Field() name: string;
  @Field(() => Int) points: number;
  @Field(() => Float) totalWasteKg: number;
}

@ObjectType()
export class WasteTypeStat {
  @Field() wasteType: string;
  @Field(() => Float) kg: number;
}

@ObjectType()
export class ParticipationEntry {
  @Field() household: string;
  @Field(() => Int) collections: number;
  @Field(() => Float) totalKg: number;
  @Field(() => Int) totalPoints: number;
}

@ObjectType()
export class AdminStats {
  @Field(() => Int) users: number;
  @Field(() => Int) bins: number;
  @Field(() => Int) fullBins: number;
  @Field(() => Int) disposals: number;
  @Field(() => Float) totalWasteKg: number;
  @Field(() => Int) pointsIssued: number;
  @Field(() => Int) redemptions: number;
  @Field(() => [WasteTypeStat]) wasteByType: WasteTypeStat[];
}
