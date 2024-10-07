import Logger from '../utils/Logger';
import type {LogLevelDesc} from 'loglevel';
import {EventEmitter} from 'events';

interface Section {
  start: number;
  end: number;
}

export class VideoManager extends EventEmitter {
  private readonly videoElement: HTMLVideoElement;
  private readonly logger: Logger;
  private currentSection: Section | null = null;
  private readonly onTimeUpdate: () => void;

  constructor(
    private readonly videoPath: string,
    private readonly containerId: string,
    private readonly playbackRate: number,
    logLevel: LogLevelDesc = 'info'
  ) {
    super(); // Initialize EventEmitter
    this.logger = new Logger('VideoManager', logLevel);
    this.logger.trace('VideoManager initialized.');

    const container = document.getElementById(this.containerId);
    // Empty the container
    if (container) {
      container.textContent = '';
    }

    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.src = this.videoPath;
    this.videoElement.playbackRate = this.playbackRate;
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    this.videoElement.loop = false; // Disable global looping
    this.videoElement.muted = true;

    if (container) {
      container.appendChild(this.videoElement);
      this.logger.trace('Video element appended to container.');
    } else {
      this.logger.error(`Container with ID "${this.containerId}" not found.`);
    }

    // Bind the onTimeUpdate handler
    this.onTimeUpdate = this.handleTimeUpdate.bind(this);
  }

  /**
   * Sets up the video by loading it and handling any necessary configurations.
   * @param signal AbortSignal to handle cancellation.
   */
  public async setupVideo(signal: AbortSignal): Promise<void> {
    this.logger.trace('Setting up video.');

    return new Promise((resolve, reject) => {
      const onLoaded = () => {
        this.logger.trace('Video loaded successfully.');
        resolve();
      };

      const onError = (error: any) => {
        this.logger.error('Error loading video.', error);
        reject(error);
      };

      this.videoElement.addEventListener('canplaythrough', onLoaded, {once: true});
      this.videoElement.addEventListener('error', onError, {once: true});

      // Handle abort
      signal.addEventListener('abort', () => {
        this.logger.warn('Video setup aborted.');
        this.videoElement.pause();
        reject(new DOMException('Video setup aborted.', 'AbortError'));
      });

      // Start loading the video
      this.videoElement.load();
      this.logger.trace('Video loading initiated.');
    });
  }

  /**
   * Prefetches the video by ensuring it's buffered and ready to play.
   */
  public async prefetchVideo(): Promise<void> {
    this.logger.trace('Prefetching video.');

    return new Promise((resolve, reject) => {
      const onCanPlayThrough = () => {
        this.logger.trace('Video prefetched successfully.');
        resolve();
      };

      const onError = (error: any) => {
        this.logger.error('Error prefetching video.', error);
        reject(error);
      };

      this.videoElement.addEventListener('canplaythrough', onCanPlayThrough, {once: true});
      this.videoElement.addEventListener('error', onError, {once: true});

      // Start prefetching
      this.videoElement.preload = 'auto';
      this.videoElement.load();
      this.logger.trace('Video prefetching initiated.');
    });
  }

  /**
   * Plays a specific section of the video.
   * @param section The section to play.
   */
  public playSection(section: Section): void {
    this.logger.trace('Playing section.', {section});
    this.currentSection = section;
    this.videoElement.currentTime = section.start;
    this.videoElement.play().catch(error => {
      this.logger.error('Error playing video section.', error);
    });

    // Remove previous listener if any
    this.videoElement.removeEventListener('timeupdate', this.onTimeUpdate);
    // Add new timeupdate listener
    this.videoElement.addEventListener('timeupdate', this.onTimeUpdate);
  }

  /**
   * Handles the timeupdate event to detect when a section ends.
   */
  private handleTimeUpdate(): void {
    if (!this.currentSection) {
      return;
    }

    if (this.videoElement.currentTime >= this.currentSection.end) {
      this.logger.trace('Section playback completed.');

      // Pause the video
      this.videoElement.pause();

      // Remove the timeupdate listener
      this.videoElement.removeEventListener('timeupdate', this.onTimeUpdate);

      // Emit the 'sectionEnded' event
      this.emit('sectionEnded');
    }
  }

  /**
   * Pauses the video playback.
   */
  public pause(): void {
    this.logger.trace('Pausing video.');
    this.videoElement.pause();
  }

  /**
   * Resumes the video playback.
   */
  public resume(): void {
    this.logger.trace('Resuming video.');
    this.videoElement.play().catch(error => {
      this.logger.error('Error resuming video.', error);
    });
  }

  /**
   * Cleans up the video resources.
   */
  public cleanup(): void {
    this.logger.trace('Cleaning up video resources.');
    const container = document.getElementById(this.containerId);
    this.logger.trace('Removing video element from container.', {containerId: this.containerId});
    if (container && this.videoElement.parentElement === container) {
      // Remove event listeners
      this.videoElement.removeEventListener('timeupdate', this.onTimeUpdate);
      container.textContent = '';
      this.logger.trace('Video element removed from container.');
    }
  }
}
