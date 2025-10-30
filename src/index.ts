import express from 'express';
import 'dotenv/config';
import helmet from 'helmet';
import cors from 'cors';
import morganMiddleware from '@middlewares/morgan-middleware';
import indexRouter from '@routes/index-router';
import authRouter from '@routes/auth-router';
import { errorHandler } from '@middlewares/error-middleware';
import { env } from '@libs/configs';
import { contextMiddleware } from '@middlewares/context-middleware';
import { notFoundMiddleware } from '@middlewares/not-found-middleware';
import cookieParser from 'cookie-parser';

import { apolloServer } from '@/graphql/apollo-server';

async function startServers() {
  const app = express();

  app.use(contextMiddleware);
  app.use(cookieParser());

  const port = env.APP_PORT;

  // Add JSON middleware to parse incoming requests
  app.use(express.json({ limit: '250kb' }));
  // Use Helmet to secure Express app by setting various HTTP headers
  app.use(helmet());
  // Enable CORS with various options
  app.use(cors());
  // Use Morgan middleware for logging requests
  app.use(morganMiddleware);
  // Use routes
  app.use('/', indexRouter);
  app.use('/auth', authRouter);

  // Start Apollo Server
  await apolloServer.start();

  // Attach Apollo Server to Express app
  apolloServer.applyMiddleware({ app });

  // attach middleware to respond to non existing routes
  app.use(notFoundMiddleware);

  // attach middleware to handle errors globally
  app.use(errorHandler);

  app.listen(port, () => {
    if (env.NODE_ENV === 'development') {
      console.log(`Server is running on http://localhost:${port}`);
    } else {
      console.log(`Server is running on ${env.BASE_URL}`);
    }
  });
}

startServers();
