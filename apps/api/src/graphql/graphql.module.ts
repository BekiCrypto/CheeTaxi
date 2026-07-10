// GraphQL module — provides GraphQL gateway alongside REST API.
// To enable: install @nestjs/graphql @nestjs/apollo graphql apollo-server-express
// and uncomment the GraphQLModule.forRootAsync below.
//
// For now, this module is a placeholder that doesn't break the build.

import { Module } from '@nestjs/common';
import { TripsModule } from '../trips/trips.module';
import { PricingModule } from '../pricing/pricing.module';
import { AuthModule } from '../auth/auth.module';

// These resolvers are plain classes — wire them up when @nestjs/graphql is installed.
import { UserResolver, TripResolver, PricingResolver } from './resolvers';

@Module({
  imports: [AuthModule, TripsModule, PricingModule],
  providers: [UserResolver, TripResolver, PricingResolver],
})
export class GraphqlModule {}
