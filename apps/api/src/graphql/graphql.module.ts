import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { UserResolver, TripResolver, PricingResolver } from './resolvers';
import { TripsModule } from '../trips/trips.module';
import { PricingModule } from '../pricing/pricing.module';
import { GeoModule } from '../geo/geo.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: () => ({
        autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
        playground: process.env.NODE_ENV !== 'production',
        introspection: process.env.NODE_ENV !== 'production',
        context: ({ req }) => ({ req }),
        // Custom auth checker — delegates to JwtAuthGuard
        installSubscriptionHandlers: true,
      }),
    }),
    AuthModule,
    TripsModule,
    PricingModule,
    GeoModule,
  ],
  providers: [UserResolver, TripResolver, PricingResolver],
})
export class GraphqlModule {}
