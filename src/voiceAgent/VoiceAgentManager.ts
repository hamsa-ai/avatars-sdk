import {HamsaVoiceAgent} from '@hamsa-ai/voice-agents-sdk';
import type {AgentStartCallback, JobDetails, Params} from '../utils/Types';
import Logger from '../utils/Logger';
import type {LogLevelDesc} from 'loglevel';

/**
 * Manages interactions with the Hamsa Voice Agent.
 */
export class VoiceAgentManager {
  private voiceAgent: HamsaVoiceAgent | null = null;
  private agentStarted = false;
  private readonly logger: Logger;

  constructor(
    private readonly apiKey: string,
    logLevel: LogLevelDesc = 'info'
  ) {
    this.logger = new Logger('VoiceAgentManager', logLevel);
    this.logger.trace('VoiceAgentManager initialized.');
  }

  /**
   * Starts the voice agent.
   */
  public async startAgent(agentId: string, params: Params, onAgentStart?: AgentStartCallback): Promise<void> {
    this.logger.trace('Starting voice agent.', {agentId, params});

    if (this.agentStarted) {
      this.logger.warn('Agent is already started.');
      return;
    }

    if (!this.apiKey) {
      this.logger.error('API key is not provided.');
      return;
    }

    try {
      this.voiceAgent = new HamsaVoiceAgent(this.apiKey);

      await this.voiceAgent.start({agentId, params});
      this.agentStarted = true;
      this.logger.info('Voice agent started successfully.');

      if (onAgentStart) {
        onAgentStart();
      }
    } catch (error) {
      this.logger.error('Failed to start the voice agent.', {error});
      this.agentStarted = false;
    }
  }

  /**
   * Ends the voice agent session.
   */
  public async endAgent(): Promise<void> {
    this.logger.trace('Ending voice agent.');

    if (!this.agentStarted || !this.voiceAgent) {
      this.logger.warn('Voice agent is not started.');
      return;
    }

    try {
      this.voiceAgent.end();
      this.agentStarted = false;
      this.logger.info('Voice agent ended successfully.');
    } catch (error) {
      this.logger.error('Failed to end the voice agent.', {error});
    }
  }

  /**
   * Pauses the voice agent.
   */
  public pause(): void {
    this.logger.trace('Pausing voice agent.');
    if (this.voiceAgent) {
      this.voiceAgent.pause();
      this.logger.info('Voice agent paused.');
    } else {
      this.logger.warn('Voice agent is not available.');
    }
  }

  /**
   * Resumes the voice agent.
   */
  public resume(): void {
    this.logger.trace('Resuming voice agent.');
    if (this.voiceAgent) {
      this.voiceAgent.resume();
      this.logger.info('Voice agent resumed.');
    } else {
      this.logger.warn('Voice agent is not available.');
    }
  }

  /**
   * Subscribes to voice agent events.
   */
  public on(event: string, callback: (...args: any[]) => void): void {
    this.logger.trace('Subscribing to voice agent event.', {event});
    if (this.voiceAgent) {
      this.voiceAgent.on(event, callback);
    } else {
      this.logger.warn('Voice agent is not available.');
    }
  }

  /**
   * Unsubscribes from voice agent events.
   */
  public off(event: string, callback: (...args: any[]) => void): void {
    this.logger.trace('Unsubscribing from voice agent event.', {event});
    if (this.voiceAgent) {
      this.voiceAgent.off(event, callback);
    } else {
      this.logger.warn('Voice agent is not available.');
    }
  }

  /**
   * Sets the volume of the voice agent.
   * @param volume - Volume level between 0.0 and 1.0.
   */
  public setVolume(volume: number): void {
    this.logger.trace('Setting voice agent volume.', {volume});
    if (this.voiceAgent) {
      this.voiceAgent.setVolume(volume);
    } else {
      this.logger.warn('Voice agent is not available.');
    }
  }

  /**
   * Retrieves job details from the Hamsa Voice Agent.
   * @returns The job details object.
   */
  public async getJobDetails() {
    this.logger.trace('Fetching job details.');

    if (!this.voiceAgent) {
      this.logger.error('Cannot fetch job details: Voice agent is not started.');
      throw new Error('Voice agent is not started.');
    }

    try {
      const jobDetails: JobDetails = await this.voiceAgent.getJobDetails();
      this.logger.info('Job details retrieved successfully.', {jobDetails});
      return jobDetails;
    } catch (error: any) {
      this.logger.error('Failed to fetch job details.', {error: error.message || error});
      throw error;
    }
  }

  /**
   * Cleans up the voice agent resources.
   */
  public cleanup(): void {
    this.logger.trace('Cleaning up voice agent resources.');
    // Additional cleanup if necessary
  }
}
