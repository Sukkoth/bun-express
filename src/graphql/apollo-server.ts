import { ApolloServer } from 'apollo-server-express';
import typeDefs from '@/graphql/schema/type-defs';
import resolvers from '@/graphql/schema/resolvers';
import { getUser } from '@middlewares/auth-middleware';
import { AppException } from '@libs/exceptions/app-exception';
import { ErrorCodes } from '@libs/exceptions/error-codes';

export const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers?.authorization?.split(' ')?.[1];
    const result = await getUser(token);

    if (!result.success) {
      if (result.errorCode === ErrorCodes.INTERNAL_SERVER_ERROR) {
        throw AppException.internalServerError({
          message: 'Something went wrong',
        });
      }
    }

    return { user: result.user, req };
  },
});
