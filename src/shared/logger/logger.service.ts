import { Injectable, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService {
  constructor(private readonly configService: ConfigService) {}

  createLogger(context: string): Logger {
    const levelStr = this.configService.get<string>('LOG_LEVEL', 'log');
    const levels = levelStr.split(',') as unknown as LogLevel[];

    const logger = new Logger(context);

    logger.localInstance.setLogLevels?.(levels);
    return logger;
  }
}
