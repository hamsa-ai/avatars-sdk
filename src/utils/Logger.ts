import type {LogLevelDesc} from 'loglevel';
import log from 'loglevel';

/**
 * Logger utility for consistent logging across modules.
 */
class Logger {
  private readonly logger: log.Logger;

  constructor(
    private readonly moduleName: string,
    level: LogLevelDesc = 'info'
  ) {
    this.logger = log.getLogger(moduleName);
    this.logger.setLevel(level);
  }

  public trace(message: string, data?: unknown): void {
    this.logger.trace(this.formatMessage(message), data);
  }

  public debug(message: string, data?: unknown): void {
    this.logger.debug(this.formatMessage(message), data);
  }

  public info(message: string, data?: unknown): void {
    this.logger.info(this.formatMessage(message), data);
  }

  public warn(message: string, data?: unknown): void {
    this.logger.warn(this.formatMessage(message), data);
  }

  public error(message: string, data?: unknown): void {
    this.logger.error(this.formatMessage(message), data);
  }

  private formatMessage(message: string): string {
    return `[${this.moduleName}] ${message}`;
  }

  public setLevel(level: LogLevelDesc): void {
    this.logger.setLevel(level);
  }
}

export default Logger;
