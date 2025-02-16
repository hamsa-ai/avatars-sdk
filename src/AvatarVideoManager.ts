import {VideoManager} from './video/VideoManager';
import {VoiceAgentManager} from './voiceAgent/VoiceAgentManager';
import {EventManager} from './events/EventManager';
import {StateManager} from './state/StateManager';
import type {AvatarConfig, AvatarVideoManagerOptions, AvatarVideoManagerStartCallOptions} from './utils/Types';
import Logger from './utils/Logger';
import {avatarsSDKData} from './avatarsData';
import {EventEmitter} from 'events';

/**
 * Interface representing the job details returned by the Hamsa API.
 */
interface JobDetails {
  message: string;
  previewUrl: string;
  data: {
    id: string;
    title: string;
    model: string;
    type: string;
    processingType: string;
    webhookUrl: string;
    totalCost: number;
    usageTime: string;
    fromLng: string;
    toLng: string;
    mediaUrl: string;
    jobResponse: Record<string, any>;
    fromScript: string;
    toScript: string;
    status: string;
    relevantJobId: string;
    agentDetails: string;
    apiKeyId: string;
    billingId: string;
    systemModelKey: string;
    voiceAgentId: string;
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Interface defining the events emitted by AvatarVideoManager.
 */
interface AvatarVideoManagerEvents {
  /**
   * Emitted when the loading state changes.
   * @param isLoading - `true` if loading has started, `false` if loading has ended.
   */
  onLoadingChange: (isLoading: boolean) => void;

  /**
   * Emitted when an error occurs.
   * @param error - The error that occurred.
   */
  onError: (error: Error) => void;

  /**
   * Emitted when the voice agent starts.
   */
  onAgentStart: () => void;

  /**
   * Emitted when the voice agent ends.
   */
  onAgentEnd: () => void;

  /**
   * Emitted when the remote audio stream is available.
   * @param stream - The remote MediaStream.
   */
  remoteAudioStreamAvailable: (stream: MediaStream) => void;

  /**
   * Emitted when the local audio stream is available.
   * @param stream - The local MediaStream.
   */
  localAudioStreamAvailable: (stream: MediaStream) => void;
}

/**
 * Extends the EventEmitter to include typed events.
 */
export declare interface AvatarVideoManager {
  /**
   * Registers a listener for a specific event.
   * @param event - The event name.
   * @param listener - The callback function.
   */
  on<U extends keyof AvatarVideoManagerEvents>(event: U, listener: AvatarVideoManagerEvents[U]): this;

  /**
   * Registers a one-time listener for a specific event.
   * @param event - The event name.
   * @param listener - The callback function.
   */
  once<U extends keyof AvatarVideoManagerEvents>(event: U, listener: AvatarVideoManagerEvents[U]): this;

  /**
   * Removes a specific listener for an event.
   * @param event - The event name.
   * @param listener - The callback function to remove.
   */
  off<U extends keyof AvatarVideoManagerEvents>(event: U, listener: AvatarVideoManagerEvents[U]): this;
}

/**
 * Main class that manages the avatar video and voice agent interactions.
 * Implements the Singleton pattern to ensure only one instance exists.
 */
export class AvatarVideoManager extends EventEmitter {
  /**
   * Static instance to hold the Singleton.
   */
  private static instance: AvatarVideoManager | null = null;

  /**
   * Managers and other dependencies.
   */
  private videoManager: VideoManager | null = null;
  private readonly voiceAgentManager: VoiceAgentManager;
  private eventManager: EventManager | null = null;
  private stateManager: StateManager | null = null;
  private readonly logger: Logger;
  private avatarConfig: AvatarConfig | null = null;
  private abortController: AbortController | null = null;

  /**
   * Flags to track initialization and cleanup states.
   */
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private isCallActive: boolean = false;
  private isCleaningUp: boolean = false;

  /**
   * Promise to track ongoing cleanup.
   */
  private cleanupPromise: Promise<void> | null = null;

  /**
   * Private variables to store media streams.
   */
  private remoteAudioStream: MediaStream | null = null;
  private localAudioStream: MediaStream | null = null;

  /**
   * Handler for remote audio stream.
   */
  private readonly handleRemoteAudioStream = (stream: MediaStream): void => {
    this.logger.trace('Handling remote audio stream.', {stream});
    this.remoteAudioStream = stream;
    this.emit('remoteAudioStreamAvailable', stream);
  };

  /**
   * Handler for local audio stream.
   */
  private readonly handleLocalAudioStream = (stream: MediaStream): void => {
    this.logger.trace('Handling local audio stream.', {stream});
    this.localAudioStream = stream;
    this.emit('localAudioStreamAvailable', stream);
  };

  /**
   * Private constructor to prevent direct instantiation.
   * @param options - Configuration options for AvatarVideoManager.
   */
  private constructor(private readonly options: AvatarVideoManagerOptions) {
    super();
    this.validateOptions(options);

    // Initialize logger with appropriate log level
    this.logger = new Logger('AvatarVideoManager', options.debugEnabled ? (options.logLevel ?? 'debug') : 'info');
    this.logger.trace('AvatarVideoManager initialized with API key and options.');

    // Initialize VoiceAgentManager with API key and log settings
    this.voiceAgentManager = new VoiceAgentManager(
      options.apiKey,
      options.debugEnabled ? (options.logLevel ?? 'debug') : 'info'
    );

    // Handle application shutdown to ensure resources are cleaned up
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        void this.endCall();
      });
    }
  }

  /**
   * Retrieves the Singleton instance of AvatarVideoManager.
   * Creates the instance if it doesn't exist.
   * @param options - Configuration options for AvatarVideoManager.
   * @returns The Singleton instance of AvatarVideoManager.
   */
  public static getInstance(options: AvatarVideoManagerOptions): AvatarVideoManager {
    if (this.instance === null) {
      this.instance = new AvatarVideoManager(options);
    } else {
      this.instance.logger.trace('AvatarVideoManager instance already exists.');
    }
    return this.instance;
  }

  /**
   * Resets the Singleton instance of AvatarVideoManager.
   * Cleans up resources before resetting.
   */
  public static async resetInstance(): Promise<void> {
    if (this.instance) {
      await this.instance.endCall();
      this.instance.cleanupListeners();
      this.instance = null;
    }
  }

  /**
   * Validates the configuration options.
   * @param options - Configuration options to validate.
   * @throws Will throw an error if validation fails.
   */
  private validateOptions(options: AvatarVideoManagerOptions): void {
    if (!options.apiKey) {
      throw new Error('API key is required for AvatarVideoManager.');
    }
    // Additional validations can be added here
  }

  /**
   * Initializes the AvatarVideoManager with the provided parameters and callbacks.
   * @param params - Parameters for starting the call.
   * @param callbacks - Optional callbacks for handling events.
   * @throws Will throw an error if initialization fails.
   */
  public async initialize(
    params: AvatarVideoManagerStartCallOptions,
    callbacks?: Partial<AvatarVideoManagerEvents>
  ): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized || this.isInitializing) {
      this.logger.warn(
        'AvatarVideoManager is already initialized or initializing. Ignoring duplicate initialize call.'
      );
      return;
    }

    // Register callbacks if provided
    if (callbacks) {
      // Remove existing listeners to prevent duplication
      this.removeAllListeners();
      if (callbacks.onLoadingChange) {
        this.on('onLoadingChange', callbacks.onLoadingChange);
      }
      if (callbacks.onError) {
        this.on('onError', callbacks.onError);
      }
      if (callbacks.onAgentStart) {
        this.once('onAgentStart', callbacks.onAgentStart);
      }
      if (callbacks.onAgentEnd) {
        this.once('onAgentEnd', callbacks.onAgentEnd);
      }
      if (callbacks.remoteAudioStreamAvailable) {
        this.on('remoteAudioStreamAvailable', callbacks.remoteAudioStreamAvailable);
      }
      if (callbacks.localAudioStreamAvailable) {
        this.on('localAudioStreamAvailable', callbacks.localAudioStreamAvailable);
      }
    }

    return this.startCall(params);
  }

  /**
   * Starts the avatar video manager and agent call.
   * Ensures that the manager is initialized only once.
   * Prevents multiple agents from being created.
   * If a cleanup is in progress, waits until it's done before starting.
   * @param params - Dynamic parameters for starting the call.
   */
  private async startCall(params: AvatarVideoManagerStartCallOptions): Promise<void> {
    this.logger.trace('startCall invoked.');

    if (this.isCallActive) {
      this.logger.warn('startCall was already invoked and is active. Ignoring duplicate call.');
      return;
    }

    this.isCallActive = true; // Set flag to indicate call is active

    // If a cleanup is in progress, wait for it to finish before proceeding
    if (this.isCleaningUp && this.cleanupPromise) {
      this.logger.trace('Cleanup is in progress. Waiting for it to complete before starting a new call.');
      await this.cleanupPromise;
    }

    // Check if already initialized or initializing
    if (this.isInitialized || this.isInitializing) {
      this.logger.warn('AvatarVideoManager is already initialized or initializing. Ignoring duplicate startCall.');
      this.isCallActive = false; // Reset flag
      return;
    }

    this.isInitializing = true;
    this.abortController = new AbortController();
    this.logger.trace('Starting avatar video manager call.');

    // Emit loading change event (loading started)
    this.emit('onLoadingChange', true);

    try {
      // Initialize StateManager
      this.stateManager = new StateManager();
      this.logger.trace('StateManager initialized.');

      // Load avatar configuration based on avatarName
      const avatarConfig = avatarsSDKData[params.avatarName.toLowerCase()];
      if (!avatarConfig) {
        throw new Error(`Avatar configuration for "${params.avatarName}" not found.`);
      }
      this.avatarConfig = avatarConfig;
      this.logger.trace(`AvatarConfig loaded: ${JSON.stringify(this.avatarConfig)}`);

      // Initialize VideoManager with avatar video path and container
      this.videoManager = new VideoManager(
        this.avatarConfig.videoPath,
        params.containerId,
        0.9, // playback rate
        this.options.debugEnabled ? (this.options.logLevel ?? 'debug') : 'info'
      );
      this.logger.trace('VideoManager initialized.');

      // Setup video
      await this.videoManager.setupVideo(this.abortController.signal);
      this.logger.info('Video setup completed.');

      // Prefetch video
      this.logger.info('Prefetching avatar video.');
      await this.videoManager.prefetchVideo();
      this.logger.info('Avatar video prefetched successfully.');

      // Start the voice agent without delay
      this.logger.info('Starting voice agent.');
      await this.voiceAgentManager.startAgent(params.avatarId, params.params, params.onAgentStart);
      this.logger.trace('VoiceAgentManager started.');

      // Update flags
      this.isInitialized = true;
      this.isCallActive = true;
      this.isInitializing = false;
      this.logger.trace('AvatarVideoManager initialization complete.');

      // Initialize EventManager to handle events between VideoManager and VoiceAgentManager
      this.eventManager = new EventManager(
        this.videoManager,
        this.voiceAgentManager,
        this.stateManager,
        this.avatarConfig,
        this.options.debugEnabled ? (this.options.logLevel ?? 'debug') : 'info'
      );
      this.logger.trace('EventManager initialized.');

      // Subscribe to EventManager events
      if (this.eventManager) {
        this.eventManager.subscribeToEvents();
        this.logger.trace('Subscribed to EventManager events.');
      } else {
        this.logger.error('EventManager not initialized.');
      }

      // Subscribe to media stream events
      this.subscribeToMediaStreams();

      // Emit loading change event (loading finished)
      this.emit('onLoadingChange', false);
      this.emit('onAgentStart');
    } catch (error) {
      this.logger.error('Error during AvatarVideoManager initialization:', {error});

      // Check if error is an AbortError
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        this.emit('onError', error);
      } else {
        this.logger.trace('Initialization aborted. Not emitting onError.');
      }

      // Reset flags
      this.isInitializing = false;
      this.isCallActive = false;

      // Emit loading change event (loading finished)
      this.emit('onLoadingChange', false);

      // Only call endCall if the error was not due to an abort
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        await this.endCall();
      }
    }
  }

  /**
   * Subscribes to media stream events from VoiceAgentManager.
   */
  private subscribeToMediaStreams(): void {
    this.logger.trace('Subscribing to media stream events from VoiceAgentManager.');

    if (!this.voiceAgentManager) {
      this.logger.error('VoiceAgentManager is not available.');
      return;
    }

    // Listen for remote audio stream
    this.voiceAgentManager.on('remoteAudioStreamAvailable', this.handleRemoteAudioStream);

    // Listen for local audio stream
    this.voiceAgentManager.on('localAudioStreamAvailable', this.handleLocalAudioStream);
  }

  /**
   * Ends the avatar video manager call.
   * Cleans up resources and resets the manager's state.
   * If called while a call is active, performs cleanup.
   * If called during initialization, aborts the process.
   */
  public async endCall(): Promise<void> {
    // If already cleaning up, return the existing cleanupPromise
    if (this.isCleaningUp && this.cleanupPromise) {
      this.logger.trace('endCall is already in progress. Returning existing cleanupPromise.');
      return this.cleanupPromise;
    }

    // If not initialized or initializing, log a warning and return
    if (!this.isInitialized && !this.isInitializing) {
      this.logger.warn('AvatarVideoManager is not initialized or already ended.');
      return;
    }

    this.isCleaningUp = true;

    // Create a cleanup promise to allow startCall to await it if needed
    this.cleanupPromise = (async () => {
      try {
        if (this.isInitializing) {
          this.logger.warn('AvatarVideoManager is initializing. Aborting initialization and cleaning up.');
          if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
          }
          this.isInitializing = false;
          this.isCallActive = false; // Reset flag
          // Emit loading end event in case it's still loading
          this.emit('onLoadingChange', false);
          return;
        }

        this.logger.trace('Ending avatar video manager call.');

        // Unsubscribe from media stream events
        this.voiceAgentManager.off('remoteAudioStreamAvailable', this.handleRemoteAudioStream);
        this.voiceAgentManager.off('localAudioStreamAvailable', this.handleLocalAudioStream);

        // Clean up EventManager
        if (this.eventManager) {
          this.eventManager.cleanup();
          this.eventManager = null;
          this.logger.trace('EventManager cleaned up.');
        }

        // Clean up VideoManager
        if (this.videoManager) {
          this.videoManager.cleanup();
          this.videoManager = null;
          this.logger.trace('VideoManager cleaned up.');
        }

        // End the VoiceAgentManager
        await this.voiceAgentManager.endAgent();
        this.logger.trace('VoiceAgentManager ended.');

        // Reset flags
        this.isInitialized = false;
        this.isCallActive = false; // Reset flag
        this.abortController = null;
        this.stateManager = null;
        this.avatarConfig = null;

        // Reset media streams
        this.remoteAudioStream = null;
        this.localAudioStream = null;

        this.logger.trace('AvatarVideoManager call ended and resources cleaned up.');
        this.emit('onAgentEnd');
      } catch (error) {
        this.logger.error('Error during AvatarVideoManager cleanup:', {error});

        // Check if error is an AbortError
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          this.emit('onError', error as Error);
        } else {
          this.logger.trace('Cleanup aborted. Not emitting onError.');
        }
      } finally {
        this.isCleaningUp = false;
        this.cleanupPromise = null;
      }
    })();

    // Wait for cleanup to finish
    await this.cleanupPromise;
  }

  /**
   * Retrieves the job details from the voice agent manager.
   * @returns {Promise<JobDetails>} The job details object.
   */
  public async getJobDetails(): Promise<JobDetails> {
    try {
      const jobDetails: JobDetails = await this.voiceAgentManager.getJobDetails();
      this.logger.info('Job details fetched successfully.', {jobDetails});
      return jobDetails;
    } catch (error: any) {
      this.logger.error('Failed to fetch job details after agent end.', {error: error.message || error});
      this.emit('onError', new Error(`Failed to fetch job details: ${error.message || error}`));
      throw error;
    }
  }

  /**
   * Sets the volume of the voice agent.
   * @param volume - The desired volume level (e.g., 0 to 1).
   */
  public setVolume(volume: number): void {
    this.logger.trace('Setting volume.', {volume});
    this.voiceAgentManager.setVolume(volume);
  }

  /**
   * Pauses the video playback and the voice agent.
   */
  public pause(): void {
    this.logger.trace('Pausing AvatarVideoManager.');
    if (this.stateManager) {
      this.stateManager.setAgentStatus('idle');
    }
    if (this.videoManager) {
      this.videoManager.pause();
    }
    this.voiceAgentManager.pause();
  }

  /**
   * Resumes the video playback and the voice agent.
   */
  public resume(): void {
    this.logger.trace('Resuming AvatarVideoManager.');
    if (this.stateManager) {
      this.stateManager.setAgentStatus('listening');
    }
    if (this.videoManager) {
      this.videoManager.resume();
    }
    this.voiceAgentManager.resume();
  }

  /**
   * Removes all event listeners to prevent memory leaks.
   */
  private cleanupListeners(): void {
    this.removeAllListeners();
  }

  /**
   * Retrieves the remote audio MediaStream.
   * @returns The remote MediaStream or null if not available.
   */
  public getRemoteAudioStream(): MediaStream | null {
    return this.remoteAudioStream;
  }

  /**
   * Retrieves the local audio MediaStream.
   * @returns The local MediaStream or null if not available.
   */
  public getLocalAudioStream(): MediaStream | null {
    return this.localAudioStream;
  }
}
