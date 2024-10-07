import type {SectionType, CurrentSection} from '../utils/Types';
import Logger from '../utils/Logger';

/**
 * Manages the state of the application.
 */
export class StateManager {
  private agentStatus: SectionType | 'idle' = 'idle';
  private currentSection: CurrentSection | null = null;
  private readonly logger = new Logger('StateManager');

  constructor() {
    this.logger.trace('StateManager initialized.');
  }

  public setAgentStatus(status: SectionType | 'idle'): void {
    this.logger.trace('Setting agent status.', {status});
    this.agentStatus = status;
  }

  public getAgentStatus(): SectionType | 'idle' {
    return this.agentStatus;
  }

  public setCurrentSection(section: CurrentSection | null): void {
    this.logger.trace('Setting current section.', {section});
    this.currentSection = section;
  }

  public getCurrentSection(): CurrentSection | null {
    return this.currentSection;
  }
}
