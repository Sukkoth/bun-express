import morgan from 'morgan';
import Logger from '@libs/logger';
import { env } from '@libs/configs';

/**
 * Morgan middleware with custom format and logger
 *
 * This middleware logs incoming HTTP requests to the custom logger with the
 * `http` severity. The format of the log is a JSON object with the following
 * properties:
 *
 * - `method`: the HTTP method of the request
 * - `url`: the URL of the request
 * - `status`: the HTTP status code of the response
 * - `contentLength`: the content length of the response
 * - `responseTime`: the response time in milliseconds
 *
 * The format is specified using a custom function that returns a JSON string
 * representation of the log data.
 *
 * The logger is configured to write logs to the console.
 */

const morganMiddleware = morgan(
  function (tokens, req, res) {
    if (
      env.NODE_ENV !== 'production' &&
      tokens?.url(req, res) === '/graphql?Query'
    ) {
      return;
    }
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number.parseFloat(tokens.status(req, res) || 'NaN'),
      contentLength: tokens.res(req, res, 'content-length'),
      responseTime: Number.parseFloat(
        tokens['response-time'](req, res) || 'NaN',
      ),
    });
  },
  {
    stream: {
      // Configure Morgan to use our custom logger with the http severity
      write: (message) => {
        const data = JSON.parse(message as string);
        Logger.http(`incomingRequest`, data);
      },
    },
  },
);

export default morganMiddleware;
