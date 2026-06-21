import type { LoggerOptions } from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

export const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',

  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
}
