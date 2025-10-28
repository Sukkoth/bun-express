import express from 'express';
import 'dotenv/config';
import helmet from 'helmet';
import cors from 'cors';
import morganMiddleware from '@middlewares/morgan-middleware';
import indexRouter from '@routes/index-router';
import { errorHandler } from '@middlewares/error-middleware';
import { env } from '@libs/configs';
import { contextMiddleware } from '@middlewares/context-middleware';

const app = express();
app.use(contextMiddleware);

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

app.use(errorHandler);

// Start the server and export the server instance
const server = app.listen(port, () => {
  if (env.NODE_ENV === 'development') {
    console.log(`Server is running on http://localhost:${port}`);
  } else {
    console.log(`Server is running on ${env.BASE_URL}`);
  }
});

// Export both the app and the server for testing later
export { app, server };
