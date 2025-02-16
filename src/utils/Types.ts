import type log from 'loglevel';

/**
 * Represents the type of a video section.
 */
export type SectionType = 'speaking' | 'listening';

/**
 * Represents a video section with start and end times.
 */
export interface Section {
  start: number;
  end: number;
}

/**
 * Represents the current section being played.
 */
export interface CurrentSection {
  type: SectionType;
  index: number;
}

/**
 * Callback type for when the agent starts.
 */
export type AgentStartCallback = () => void;

/**
 * Generic parameters object.
 */
export type Params = Record<string, any>;

/**
 * Configuration for an avatar.
 */
export interface AvatarConfig {
  videoPath: string;
  speakingSections: Section[];
  listeningSections: Section[];
}

/**
 * Options for initializing the AvatarVideoManager.
 */
export interface AvatarVideoManagerOptions {
  apiKey: string;
  debugEnabled?: boolean;
  logLevel?: log.LogLevelDesc;
}

/**
 * Options for starting a call with the AvatarVideoManager.
 */
export interface AvatarVideoManagerStartCallOptions {
  containerId: string;
  avatarName: string;
  avatarId: string;
  params: Params;
  onAgentStart?: AgentStartCallback;
}
