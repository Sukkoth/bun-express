import winston from 'winston';
import { env } from '@libs/configs';
import { asyncLocalStorage } from '@libs/context';
import { DateTime } from 'luxon';
import { AxiosError } from 'axios';
import path from 'path';

// Define log levels
const levels = {
  error: 0, // Critical failures
  warn: 1, // Potential issues
  http: 2, // HTTP request logs (middleware, API)
  info: 3, // App-level info (startup, status)
  debug: 4, // Low-level debug info
};

// Determine log level based on environment
const level = () =>
  ['development', 'test'].includes(env.NODE_ENV) ? 'debug' : 'info';

// Define color scheme for log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Apply colors to Winston
winston.addColors(colors);

const requestIdFormat = winston.format((info) => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    info.metaInfo = {
      ...(info.metaInfo || {}),
      requestId: store.requestId,
    };
  }
  return info;
});

const ipAddressFormat = winston.format((info) => {
  const store = asyncLocalStorage.getStore();
  if (store) {
    info.metaInfo = {
      ...(info.metaInfo || {}),
      ipAddress: store.ipAddress,
    };
  }
  return info;
});

const cleanErrorAxiosFormat = winston.format((info) => {
  if (info.error && info.error instanceof AxiosError) {
    const error = info.error;
    info.error = {
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.response?.status,
      method: error.config?.method,
      url: error.config?.url,
      params: error.config?.params,
      data: error.response?.data,
    };
  }
  return info;
});

const commonWinstonFormats = [
  winston.format.timestamp({
    format: () =>
      DateTime.now()
        .setZone('Africa/Addis_Ababa')
        .toFormat('yyyy-MM-dd HH:mm:ss.SSS'),
  }),
  requestIdFormat(),
  ipAddressFormat(),
  winston.format.errors({ stack: true }),
  cleanErrorAxiosFormat(),
];

// JSON log for production (no colors, structured)
const jsonFormat = winston.format.combine(
  ...commonWinstonFormats,
  winston.format.json(),
);

// Pretty log for development (colorized, readable)
const devFormat = winston.format.combine(
  ...commonWinstonFormats,
  winston.format.prettyPrint({ colorize: true }),
);

// Create and export the logger
const Logger = winston.createLogger({
  level: level(),
  levels,
  format: level() === 'debug' ? devFormat : jsonFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'app.log'),
      maxsize: 524288000, // 500MB
      maxFiles: 10,
      format: jsonFormat,
    }),
  ],
});

export default Logger;
