import type {AvatarConfig} from './utils/Types';

// TODO: HOST VIDEOS ON AWS S3 OR OTHER STORAGE SERVICE AND UPDATE PATHS (100MB PLUS)

export const avatarsSDKData: Record<string, AvatarConfig> = {
  khalid: {
    listeningSections: [{end: 21.2, start: 11.21}], // 11:13 - 21:12
    speakingSections: [
      {end: 6.27, start: 0}, // 00:00 - 06:16
      {end: 11.21, start: 6.27}, // 06:16 - 11:13
    ],
    videoPath: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  layla: {
    listeningSections: [{end: 20.2, start: 12.12}], // 12:07 - 20:12
    speakingSections: [
      {end: 6.1, start: 0}, // 00:00 - 06:06
      {end: 12.12, start: 6.1}, // 06:06 - 12:07
    ],
    videoPath: 'avatar4Video',
  },
  leo: {
    listeningSections: [{end: 14.16, start: 9.08}], // 09:04 - 14:10
    speakingSections: [
      {end: 5.2, start: 0}, // 00:00 - 05:12
      {end: 9.08, start: 5.2}, // 05:12 - 09:04
    ],
    videoPath: 'avatar1Video',
  },
  sophia: {
    listeningSections: [{end: 14.16, start: 9.08}], // 09:04 - 14:10
    speakingSections: [
      {end: 5.2, start: 0}, // 00:00 - 05:12
      {end: 9.08, start: 5.2}, // 05:12 - 09:04
    ],
    videoPath: 'avatar2Video',
  },
};
