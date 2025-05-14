import winston from 'winston';
import fs from 'fs';

import { isDevelopment, logLevel } from './vars';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const stack = meta['stack'] ? meta['stack'] : '';
    delete meta['stack'];
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaString} \n${stack}`;
  }),
);

// Confirm log directory exists
if (!fs.existsSync('./logs')) {
  fs.mkdirSync('./logs', { recursive: true });
}

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: isDevelopment ? winston.format.combine(winston.format.colorize(), logFormat) : logFormat,
    }),
    // File transport for production
    ...(!isDevelopment
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});
