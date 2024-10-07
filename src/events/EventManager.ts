import type {VideoManager} from '../video/VideoManager';
import type {VoiceAgentManager} from '../voiceAgent/VoiceAgentManager';
import type {StateManager} from '../state/StateManager';
import type {SectionType, AvatarConfig} from '../utils/Types';
import Logger from '../utils/Logger';
import type {LogLevelDesc} from 'loglevel';

/**
 * Manages events and coordinates between video and voice agent.
 */
export class EventManager {
  private readonly logger: Logger;

  // Bound event handlers for proper unsubscription
  private readonly speakingHandler: () => void;
  private readonly listeningHandler: () => void;
  private readonly callEndedHandler: () => void;
  private readonly callStartedHandler: () => void;
  private readonly errorHandler: (error: Error) => void;
  private readonly sectionEndedHandler: () => void;

  // Track the current section to facilitate looping
  private currentSection: {type: SectionType; index: number} | null = null;

  constructor(
    private readonly videoManager: VideoManager,
    private readonly voiceAgentManager: VoiceAgentManager,
    private readonly stateManager: StateManager,
    private readonly avatarConfig: AvatarConfig,
    logLevel: LogLevelDesc = 'info'
  ) {
    this.logger = new Logger('EventManager', logLevel);
    this.logger.trace('EventManager initialized.');

    // Bind event handlers
    this.speakingHandler = this.handleSpeaking.bind(this);
    this.listeningHandler = this.handleListening.bind(this);
    this.callEndedHandler = this.handleCallEnded.bind(this);
    this.callStartedHandler = this.handleCallStarted.bind(this);
    this.errorHandler = this.handleError.bind(this);
    this.sectionEndedHandler = this.handleSectionEnded.bind(this);
  }

  /**
   * Subscribes to voice agent and video manager events.
   */
  public subscribeToEvents(): void {
    this.logger.trace('Subscribing to voice agent and video manager events.');

    // Subscribe to voice agent events
    this.voiceAgentManager.on('speaking', this.speakingHandler);
    this.voiceAgentManager.on('listening', this.listeningHandler);
    this.voiceAgentManager.on('callEnded', this.callEndedHandler);
    this.voiceAgentManager.on('callStarted', this.callStartedHandler);
    this.voiceAgentManager.on('error', this.errorHandler);

    // Subscribe to video manager's sectionEnded event
    this.videoManager.on('sectionEnded', this.sectionEndedHandler);
  }

  /**
   * Handles events emitted by the voice agent.
   */
  private handleSpeaking(): void {
    this.logger.trace('Handling speaking event.');
    this.stateManager.setAgentStatus('speaking');
    this.selectAndPlaySection('speaking');
  }

  private handleListening(): void {
    this.logger.trace('Handling listening event.');
    this.stateManager.setAgentStatus('listening');
    this.selectAndPlaySection('listening');
  }

  private handleCallEnded(): void {
    this.logger.trace('Handling callEnded event.');
    this.stateManager.setAgentStatus('idle');
    this.videoManager.pause();
  }

  private handleCallStarted(): void {
    this.logger.trace('Handling callStarted event.');
    this.stateManager.setAgentStatus('listening');
    this.selectAndPlaySection('listening');
  }

  private handleError(error: Error): void {
    this.logger.error('Voice agent error occurred.', {error});
    this.stateManager.setAgentStatus('idle');
    this.videoManager.pause();
  }

  /**
   * Handles the end of a video section.
   * Decides whether to loop the same section or select a new one.
   */
  private handleSectionEnded(): void {
    this.logger.trace('Handling sectionEnded event from VideoManager.');

    if (!this.currentSection) {
      this.logger.warn('No current section is set. Cannot decide on looping.');
      return;
    }

    const {type, index} = this.currentSection;

    // Get current agent status
    const currentStatus = this.stateManager.getAgentStatus();

    this.logger.debug('Deciding whether to loop the current section.', {
      currentStatus,
      sectionType: type,
    });

    if (currentStatus === type) {
      // Agent is still in the same state; loop the same section
      this.logger.info(`Agent is still in ${type} state. Looping the same section.`);
      const section =
        type === 'speaking' ? this.avatarConfig.speakingSections[index] : this.avatarConfig.listeningSections[index];

      if (section) {
        this.videoManager.playSection(section);
        // No need to change currentSection since it's the same
      } else {
        this.logger.error(`Section at index ${index} for type ${type} not found. Pausing video.`);
        this.videoManager.pause();
      }
    } else {
      // Agent state has changed; select a new section based on new state
      this.logger.info(`Agent state changed from ${type} to ${currentStatus}. Selecting a new section.`);
      if (currentStatus === 'idle') {
        this.videoManager.pause();
      } else {
        this.selectAndPlaySection(currentStatus as SectionType);
      }
    }
  }

  /**
   * Selects a random section based on the agent's status and plays it.
   */
  private selectAndPlaySection(type: SectionType): void {
    this.logger.trace('Selecting and playing section.', {type});

    const sections = type === 'speaking' ? this.avatarConfig.speakingSections : this.avatarConfig.listeningSections;

    if (sections.length === 0) {
      this.logger.warn(`No ${type} sections available.`);
      this.videoManager.pause();
      return;
    }

    const randomIndex = Math.floor(Math.random() * sections.length);
    const section = sections[randomIndex];

    this.currentSection = {index: randomIndex, type};
    this.stateManager.setCurrentSection(this.currentSection);
    if (section) {
      this.videoManager.playSection(section);
    }
  }

  /**
   * Unsubscribes from voice agent and video manager events.
   */
  public cleanup(): void {
    this.logger.trace('Cleaning up event subscriptions.');

    // Unsubscribe from voice agent events
    this.voiceAgentManager.off('speaking', this.speakingHandler);
    this.voiceAgentManager.off('listening', this.listeningHandler);
    this.voiceAgentManager.off('callEnded', this.callEndedHandler);
    this.voiceAgentManager.off('callStarted', this.callStartedHandler);
    this.voiceAgentManager.off('error', this.errorHandler);

    // Unsubscribe from video manager's sectionEnded event
    this.videoManager.off('sectionEnded', this.sectionEndedHandler);
  }
}
