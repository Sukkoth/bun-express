import { ApolloServer } from 'apollo-server-express';
import typeDefs from '@/graphql/schema/type-defs';
import resolvers from '@/graphql/schema/resolvers';

export const apolloServer = new ApolloServer({ typeDefs, resolvers });
