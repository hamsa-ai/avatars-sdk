import type {AvatarConfig} from './utils/Types';

export const avatarsSDKData: Record<string, AvatarConfig> = {
  john: {
    listeningSections: [{end: 45, start: 26}], // 00:26 - 00:45
    speakingSections: [{end: 26, start: 0}], // 00:00 - 00:26
    videoPath: 'https://hamsa-public.s3.eu-west-1.amazonaws.com/avatar/john.mp4',
  },
  khalid: {
    listeningSections: [{end: 43, start: 23}], // 00:23 - 00:43
    speakingSections: [{end: 23, start: 0}], // 00:00 - 00:23
    videoPath: 'https://hamsa-public.s3.eu-west-1.amazonaws.com/avatar/khalid.mp4',
  },
  layla: {
    listeningSections: [{end: 60, start: 39}], // 00:39 - 01:00
    speakingSections: [{end: 39, start: 0}], // 00:00 - 00:39
    videoPath: 'https://hamsa-public.s3.eu-west-1.amazonaws.com/avatar/layla.mp4',
  },
  natali: {
    listeningSections: [{end: 67, start: 39}], // 00:39 - 01:07
    speakingSections: [{end: 39, start: 0}], // 00:00 - 00:39
    videoPath: 'https://hamsa-public.s3.eu-west-1.amazonaws.com/avatar/natali.mp4',
  },
};
