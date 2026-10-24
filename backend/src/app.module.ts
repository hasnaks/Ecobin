import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DATABASE_URL, DB_PATH } from './config';
import { ENTITIES } from './entities';
import { EcobinResolver } from './ecobin/ecobin.resolver';
import { EcobinService } from './ecobin/ecobin.service';
import { MetricsController } from './metrics.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      DATABASE_URL
        ? {
            type: 'postgres',
            url: DATABASE_URL,
            // Hosted providers (Neon etc.) require TLS; local Docker Postgres uses sslmode=disable.
            ssl: DATABASE_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
            entities: ENTITIES,
            synchronize: true,
          }
        : {
            type: 'better-sqlite3',
            database: DB_PATH,
            entities: ENTITIES,
            synchronize: true,
          },
    ),
    TypeOrmModule.forFeature(ENTITIES),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      context: ({ req }) => ({ req }),
    }),
    AuthModule,
  ],
  controllers: [MetricsController],
  providers: [EcobinService, EcobinResolver],
})
export class AppModule {}
