# Hamsa Avatars SDK

The **Hamsa Avatars SDK** is a TypeScript library that provides an easy way to integrate avatar video playback with Hamsa Voice Agents in your web applications. It manages the synchronization between the avatar video and the voice agent’s state, providing a seamless and interactive user experience.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [Initialization](#initialization)
  - [Methods](#methods)
  - [Events](#events)
  - [Code Examples](#code-examples)
    - [React](#react)
    - [Vue.js](#vuejs)
    - [Angular](#angular)
    - [Svelte](#svelte)
    - [Vanilla JavaScript](#vanilla-javascript)
- [SDK Structure](#sdk-structure)
- [Available Commands](#available-commands)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Avatar Video Management**: Handles video playback, looping specific sections based on the voice agent’s state.
- **Voice Agent Integration**: Seamlessly integrates with the Hamsa Voice Agents Web SDK.
- **Event Handling**: Emits events to respond to voice agent states and update video playback accordingly.
- **State Management**: Utilizes a finite state machine to keep track of the current agent status and video playback state.
- **Logging**: Provides detailed logging for easier debugging and monitoring.
- **TypeScript Support**: Fully typed for better development experience and reliability.
- **Singleton Pattern**: Ensures only one instance of the manager runs, preventing conflicts in multi-component environments.
- **Reset Singleton Instance**: Allows resetting the Singleton instance for scenarios like testing or re-initialization.
- **Audio Stream Events**: Emits events for both remote and local audio streams, enhancing audio management capabilities.
- **Framework-Agnostic**: Easily integrates with major JavaScript frontend frameworks and Vanilla JS.

## Installation

Install the SDK via yarn:

```bash
yarn add @hamsa-ai/avatars-sdk
```

Or via npm:

```bash
npm install @hamsa-ai/avatars-sdk
```

## Usage

### Initialization

First, import the `AvatarVideoManager` from the SDK:

```typescript
import {AvatarVideoManager} from '@hamsa-ai/avatars-sdk';
```

Create a singleton instance of `AvatarVideoManager` with the required options and initialize it with your parameters and optional event callbacks:

```typescript
const avatarVideoManager = AvatarVideoManager.getInstance({
  voiceAgentId: 'your-voice-agent-id', // Your Hamsa Voice Agent ID
  debugEnabled: true, // Enable debug logging
  logLevel: 'trace', // Log level ('trace', 'debug', 'info', 'warn', 'error', 'silent')
});

// Define event callbacks (optional)
const callbacks = {
  onLoadingChange: (isLoading: boolean) => {
    if (isLoading) {
      console.log('Loading avatar and voice agent...');
      // Show loading spinner or indicator
    } else {
      console.log('Avatar and voice agent are ready.');
      // Hide loading spinner or indicator
    }
  },
  onError: (error: Error) => {
    console.error('An error occurred:', error.message);
    // Display error message to the user
  },
  onAgentStart: () => {
    console.log('Voice agent has started.');
    // Additional logic when the agent starts
  },
  onAgentEnd: () => {
    console.log('Voice agent has ended.');
    // Additional logic when the agent ends
  },
  remoteAudioStreamAvailable: (stream: MediaStream) => {
    console.log('Remote audio stream is available:', stream);
    // Handle remote audio stream (e.g., play audio)
  },
  localAudioStreamAvailable: (stream: MediaStream) => {
    console.log('Local audio stream is available:', stream);
    // Handle local audio stream (e.g., visualize audio)
  },
};

// Initialize the `AvatarVideoManager`
avatarVideoManager
  .initialize(
    {
      containerId: 'video-container', // The ID of the HTML element to host the video
      avatarName: 'defaultAvatar', // The name of the avatar configuration to use
      avatarId: 'your-avatar-id', // The ID of the avatar agent
      params: {
        user_name: 'John Doe', // Parameters to pass to the voice agent
        position: 'Developer',
      },
    },
    callbacks
  )
  .then(() => {
    console.log('Initialization successful.');
  })
  .catch(error => {
    console.error('Initialization failed:', error.message);
  });
```

### Methods

#### `initialize(params: AvatarVideoManagerStartCallOptions, callbacks?: Partial<AvatarVideoManagerEvents>): Promise<void>`

Initializes the avatar video manager and starts the agent call. It sets up video playback, subscribes to events, and starts the voice agent. Optional callbacks can be provided to handle events such as loading changes, errors, agent start, and agent end.

```typescript
await avatarVideoManager.initialize(
  {
    containerId: 'video-container',
    avatarName: 'defaultAvatar',
    avatarId: 'your-avatar-id',
    params: {
      user_name: 'John Doe',
      position: 'Developer',
    },
  },
  {
    onLoadingChange: isLoading => {
      /* Handle loading state */
    },
    onError: error => {
      /* Handle error */
    },
    onAgentStart: () => {
      /* Handle agent start */
    },
    onAgentEnd: () => {
      /* Handle agent end */
    },
    remoteAudioStreamAvailable: (stream: MediaStream) => {
      /* Handle remote audio stream */
    },
    localAudioStreamAvailable: (stream: MediaStream) => {
      /* Handle local audio stream */
    },
  }
);
```

#### `endCall(): Promise<void>`

Cleans up all resources, unsubscribes from events, and ends the voice agent session.

```typescript
await avatarVideoManager.endCall();
```

#### `pause(): void`

Pauses the video playback and the voice agent.

```typescript
avatarVideoManager.pause();
```

#### `resume(): void`

Resumes the video playback and the voice agent.

```typescript
avatarVideoManager.resume();
```

#### `setVolume(volume: number): void`

Sets the volume of the voice agent.

```typescript
avatarVideoManager.setVolume(0.5); // Volume range from 0 to 1
```

#### `resetInstance(): Promise<void>`

Resets the Singleton instance of `AvatarVideoManager`. This is useful for scenarios like testing or when you need to re-initialize the SDK with different configurations.

```typescript
await AvatarVideoManager.resetInstance();
```

#### `getRemoteAudioStream(): MediaStream | null`

Retrieves the remote audio `MediaStream`.

```typescript
const remoteStream = avatarVideoManager.getRemoteAudioStream();
if (remoteStream) {
  const audio = new Audio();
  audio.srcObject = remoteStream;
  audio.play();
}
```

#### `getLocalAudioStream(): MediaStream | null`

Retrieves the local audio `MediaStream`.

```typescript
const localStream = avatarVideoManager.getLocalAudioStream();
// Use the localStream as needed, e.g., for visualization
```

### Events

The `AvatarVideoManager` emits several events to help developers respond to different states and actions within the SDK.

- **`onLoadingChange`**: Emitted when the loading state changes.

  - **Payload**: `boolean` indicating if loading is in progress (`true`) or has completed (`false`).

  ```typescript
  avatarVideoManager.on('onLoadingChange', isLoading => {
    if (isLoading) {
      // Show loading indicator
    } else {
      // Hide loading indicator
    }
  });
  ```

- **`onError`**: Emitted when an error occurs.

  - **Payload**: `Error` object containing error details.

  ```typescript
  avatarVideoManager.on('onError', error => {
    console.error('An error occurred:', error.message);
    // Handle error (e.g., display message to user)
  });
  ```

- **`onAgentStart`**: Emitted when the voice agent starts.

  ```typescript
  avatarVideoManager.on('onAgentStart', () => {
    console.log('Voice agent has started.');
    // Additional logic when the agent starts
  });
  ```

- **`onAgentEnd`**: Emitted when the voice agent ends.

  ```typescript
  avatarVideoManager.on('onAgentEnd', () => {
    console.log('Voice agent has ended.');
    // Additional logic when the agent ends
  });
  ```

- **`remoteAudioStreamAvailable`**: Emitted when the remote audio `MediaStream` becomes available.

  - **Payload**: `MediaStream` object representing the remote audio stream.

  ```typescript
  avatarVideoManager.on('remoteAudioStreamAvailable', (stream: MediaStream) => {
    // Handle remote audio stream, e.g., play audio
    const audio = new Audio();
    audio.srcObject = stream;
    audio.play();
  });
  ```

- **`localAudioStreamAvailable`**: Emitted when the local audio `MediaStream` becomes available.

  - **Payload**: `MediaStream` object representing the local audio stream.

  ```typescript
  avatarVideoManager.on('localAudioStreamAvailable', (stream: MediaStream) => {
    // Handle local audio stream, e.g., visualize audio
    // Implementation here
  });
  ```

## Code Examples

### React

```typescript
import React, { useEffect } from "react";
import { AvatarVideoManager } from '@hamsa-ai/avatars-sdk';

const voiceAgentId = process.env.REACT_APP_HAMSA_VOICE_AGENT_ID as string;

const options = {
  voiceAgentId,
  debugEnabled: true,
  logLevel: "trace" as log.LogLevelDesc,
};

const avatarVideoManager = AvatarVideoManager.getInstance(options);

const LiveDemoPage: React.FC = () => {
  useEffect(() => {
    const selectedAvatar = {
      name: 'defaultAvatar',
      avatarId: 'avatar-123',
    };

    const user = {
      name: 'John Doe',
      jobRole: 'Developer',
    };

    const callbacks = {
      onLoadingChange: (isLoading: boolean) => {
        if (isLoading) {
          console.log('Loading avatar and voice agent...');
        } else {
          console.log('Avatar and voice agent are ready.');
        }
      },
      onError: (error: Error) => {
        console.error('An error occurred:', error.message);
      },
      onAgentStart: () => {
        console.log("Agent has started.");
      },
      onAgentEnd: () => {
        console.log("Agent has ended.");
      },
      remoteAudioStreamAvailable: (stream: MediaStream) => {
        console.log('Remote audio stream is available:', stream);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();
      },
      localAudioStreamAvailable: (stream: MediaStream) => {
        console.log('Local audio stream is available:', stream);
        // Example: Visualize local audio
        // Implementation here
      },
    };

    avatarVideoManager.initialize({
      containerId: 'video-container',
      avatarName: selectedAvatar.name,
      avatarId: selectedAvatar.avatarId,
      params: {
        user_name: user.name,
        position: user.jobRole,
      },
    }, callbacks)
    .then(() => {
      console.log('Initialization successful.');
    })
    .catch((error) => {
      console.error('Initialization failed:', error.message);
    });

    return () => {
      avatarVideoManager.endCall();
    };
  }, []);

  return (
    <div>
      <div id="video-container"></div>
    </div>
  );
};

export default LiveDemoPage;
```

### Vue.js

```html
<template>
  <div>
    <div id="video-container"></div>
  </div>
</template>

<script
  setup
  lang="ts"
>
  import {onMounted, onBeforeUnmount} from 'vue';
  import {AvatarVideoManager} from '@hamsa-ai/avatars-sdk';

  const voiceAgentId = import.meta.env.VITE_APP_HAMSA_VOICE_AGENT_ID as string;

  const options: AvatarVideoManagerOptions = {
    voiceAgentId,
    debugEnabled: true,
    logLevel: 'trace',
  };

  const avatarVideoManager = AvatarVideoManager.getInstance(options);

  const selectedAvatar = {
    name: 'defaultAvatar',
    avatarId: 'avatar-123',
  };

  const user = {
    name: 'John Doe',
    jobRole: 'Developer',
  };

  const callbacks = {
    onLoadingChange: (isLoading: boolean) => {
      if (isLoading) {
        console.log('Loading avatar and voice agent...');
      } else {
        console.log('Avatar and voice agent are ready.');
      }
    },
    onError: (error: Error) => {
      console.error('An error occurred:', error.message);
    },
    onAgentStart: () => {
      console.log('Agent has started.');
    },
    onAgentEnd: () => {
      console.log('Agent has ended.');
    },
    remoteAudioStreamAvailable: (stream: MediaStream) => {
      console.log('Remote audio stream is available:', stream);
      const audio = new Audio();
      audio.srcObject = stream;
      audio.play();
    },
    localAudioStreamAvailable: (stream: MediaStream) => {
      console.log('Local audio stream is available:', stream);
      // Example: Visualize local audio
      // Implementation here
    },
  };

  onMounted(() => {
    avatarVideoManager
      .initialize(
        {
          containerId: 'video-container',
          avatarName: selectedAvatar.name,
          avatarId: selectedAvatar.avatarId,
          params: {
            user_name: user.name,
            position: user.jobRole,
          },
        },
        callbacks
      )
      .then(() => {
        console.log('Initialization successful.');
      })
      .catch(error => {
        console.error('Initialization failed:', error.message);
      });
  });

  onBeforeUnmount(() => {
    avatarVideoManager.endCall();
  });
</script>
```

### Angular

```typescript
import {Component, OnInit, OnDestroy} from '@angular/core';
import {AvatarVideoManager} from '@hamsa-ai/avatars-sdk';

const voiceAgentId = 'YOUR_VOICE_AGENT_ID'; // Replace with your actual Voice Agent ID

@Component({
  selector: 'app-live-demo',
  template: `<div id="video-container"></div>`,
})
export class LiveDemoComponent implements OnInit, OnDestroy {
  private avatarVideoManager: AvatarVideoManager;

  constructor() {
    const options: AvatarVideoManagerOptions = {
      voiceAgentId,
      debugEnabled: true,
      logLevel: 'trace',
    };

    this.avatarVideoManager = AvatarVideoManager.getInstance(options);
  }

  ngOnInit(): void {
    const selectedAvatar = {
      name: 'defaultAvatar',
      avatarId: 'avatar-123',
    };

    const user = {
      name: 'John Doe',
      jobRole: 'Developer',
    };

    const callbacks = {
      onLoadingChange: (isLoading: boolean) => {
        if (isLoading) {
          console.log('Loading avatar and voice agent...');
        } else {
          console.log('Avatar and voice agent are ready.');
        }
      },
      onError: (error: Error) => {
        console.error('An error occurred:', error.message);
      },
      onAgentStart: () => {
        console.log('Agent has started.');
      },
      onAgentEnd: () => {
        console.log('Agent has ended.');
      },
      remoteAudioStreamAvailable: (stream: MediaStream) => {
        console.log('Remote audio stream is available:', stream);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();
      },
      localAudioStreamAvailable: (stream: MediaStream) => {
        console.log('Local audio stream is available:', stream);
        // Example: Visualize local audio
        // Implementation here
      },
    };

    this.avatarVideoManager
      .initialize(
        {
          containerId: 'video-container',
          avatarName: selectedAvatar.name,
          avatarId: selectedAvatar.avatarId,
          params: {
            user_name: user.name,
            position: user.jobRole,
          },
        },
        callbacks
      )
      .then(() => {
        console.log('Initialization successful.');
      })
      .catch(error => {
        console.error('Initialization failed:', error.message);
      });
  }

  ngOnDestroy(): void {
    this.avatarVideoManager.endCall();
  }

  setVolume(volume: number): void {
    this.avatarVideoManager.setVolume(volume);
  }

  pauseAgent(): void {
    this.avatarVideoManager.pause();
  }

  resumeAgent(): void {
    this.avatarVideoManager.resume();
  }
}
```

### Svelte

```html
<script lang="ts">
  import {onMount, onDestroy} from 'svelte';
  import {AvatarVideoManager} from '@hamsa-ai/avatars-sdk';

  const voiceAgentId = import.meta.env.VITE_APP_HAMSA_VOICE_AGENT_ID as string;

  const options: AvatarVideoManagerOptions = {
    voiceAgentId,
    debugEnabled: true,
    logLevel: 'trace',
  };

  const avatarVideoManager = AvatarVideoManager.getInstance(options);

  const selectedAvatar = {
    name: 'defaultAvatar',
    avatarId: 'avatar-123',
  };

  const user = {
    name: 'John Doe',
    jobRole: 'Developer',
  };

  const callbacks = {
    onLoadingChange: (isLoading: boolean) => {
      if (isLoading) {
        console.log('Loading avatar and voice agent...');
      } else {
        console.log('Avatar and voice agent are ready.');
      }
    },
    onError: (error: Error) => {
      console.error('An error occurred:', error.message);
    },
    onAgentStart: () => {
      console.log('Agent has started.');
    },
    onAgentEnd: () => {
      console.log('Agent has ended.');
    },
    remoteAudioStreamAvailable: (stream: MediaStream) => {
      console.log('Remote audio stream is available:', stream);
      const audio = new Audio();
      audio.srcObject = stream;
      audio.play();
    },
    localAudioStreamAvailable: (stream: MediaStream) => {
      console.log('Local audio stream is available:', stream);
      // Example: Visualize local audio
      // Implementation here
    },
  };

  onMount(() => {
    avatarVideoManager
      .initialize(
        {
          containerId: 'video-container',
          avatarName: selectedAvatar.name,
          avatarId: selectedAvatar.avatarId,
          params: {
            user_name: user.name,
            position: user.jobRole,
          },
        },
        callbacks
      )
      .then(() => {
        console.log('Initialization successful.');
      })
      .catch(error => {
        console.error('Initialization failed:', error.message);
      });
  });

  onDestroy(() => {
    avatarVideoManager.endCall();
  });
</script>

<div>
  <div id="video-container"></div>
</div>
```

### Vanilla JavaScript

```html
<!-- index.html -->

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Hamsa Avatars Live Demo</title>
  </head>
  <body>
    <div id="video-container"></div>

    <!-- Include the SDK -->
    <script type="module">
      import { AvatarVideoManager } from '@hamsa-ai/avatars-sdk';

      const options = {
        voiceAgentId: 'your-voice-agent-id',
        debugEnabled: true,
        logLevel: 'trace',
      };

      const avatarVideoManager = AvatarVideoManager.getInstance(options);

      const selectedAvatar = {
        name: 'defaultAvatar',
        avatarId: 'avatar-123',
      };

      const user = {
        name: 'John Doe',
        jobRole: 'Developer',
      };

      const callbacks = {
        onLoadingChange: isLoading => {
          if (isLoading) {
            console.log('Loading avatar and voice agent...');
          } else {
            console.log('Avatar and voice agent are ready.');
          }
        },
        onError: error => {
          console.error('An error occurred:', error.message);
        },
        onAgentStart: () => {
          console.log('Agent has started.');
        },
        onAgentEnd: () => {
          console.log('Agent has ended.');
        },
        remoteAudioStreamAvailable: (stream: MediaStream) => {
          console.log('Remote audio stream is available:', stream);
          const audio = new Audio();
          audio.srcObject = stream;
          audio.play();
        },
        localAudioStreamAvailable: (stream: MediaStream) => {
          console.log('Local audio stream is available:', stream);
          // Example: Visualize local audio
          // Implementation here
        },
      };

      avatarVideoManager
        .initialize(
          {
            containerId: 'video-container',
            avatarName: selectedAvatar.name,
            avatarId: selectedAvatar.avatarId,
            params: {
              user_name: user.name,
              position: user.jobRole,
            },
          },
          callbacks
        )
        .then(() => {
          console.log('Initialization successful.');
        })
        .catch(error => {
          console.error('Initialization failed:', error.message);
        });

      window.addEventListener('beforeunload', () => {
        avatarVideoManager.endCall();
      });
    </script>
  </body>
</html>
```

## SDK Structure

The SDK is organized into modular components to ensure scalability and maintainability. Below is a breakdown of the structure:

```plaintext
src/
├── index.ts                  # Entry point of the SDK
├── AvatarVideoManager.ts     # Main class that orchestrates all components
├── video/
│   └── VideoManager.ts       # Handles video-related functionality
├── voiceAgent/
│   └── VoiceAgentManager.ts  # Manages interactions with the Hamsa Voice Agent SDK
├── events/
│   └── EventManager.ts       # Coordinates events between video and voice agent
├── state/
│   └── StateManager.ts       # Manages the current state of the application
├── utils/
│   ├── Logger.ts             # Logging utility
│   └── Types.ts              # Type definitions and interfaces
├── avatarsData.ts            # Avatar configurations (video paths and sections)
```

### Components

- **AvatarVideoManager**: The main class that clients interact with.
- **VideoManager**: Handles video setup, playback, and section management.
- **VoiceAgentManager**: Manages the voice agent’s lifecycle and interactions.
- **EventManager**: Subscribes to voice agent events and updates the video playback accordingly.
- **StateManager**: Keeps track of the current agent status and the current video section being played.
- **Logger**: Provides a consistent logging mechanism across all modules.
- **Types**: Contains all the type definitions and interfaces used throughout the SDK.
- **avatarsData.ts**: Stores configurations for different avatars, including video paths and sections.

## Available Commands

The project includes several yarn scripts to help with development, testing, and building. Below is a list of available commands:

### Build and Development

- `yarn build`: Builds the SDK using Rollup. Outputs the bundled files to the `dist` directory.
- `yarn dev`: Runs Rollup in watch mode. Useful for development.
- `yarn start`: Alias for `yarn dev`.

### Linting and Formatting

- `yarn check`: Runs both format and lint checks.
- `yarn check:format`: Checks code formatting using Prettier.
- `yarn check:lint`: Lints the code using ESLint.
- `yarn fix`: Fixes formatting and linting issues.
- `yarn fix:format`: Fixes code formatting issues.
- `yarn fix:lint`: Fixes linting issues.

### Testing

- `yarn test`: Runs all tests, including type checking and unit tests with coverage.
- `yarn test:types`: Checks for TypeScript type errors.
- `yarn test:unit`: Runs unit tests using Vitest.
- `yarn test:unit:coverage`: Runs unit tests with coverage reporting.

### Documentation

- `yarn docs`: Generates documentation using TypeDoc.
- `yarn docs:build`: Builds the documentation.

### Cleaning

- `yarn clean`: Removes generated files (coverage reports, `dist` directory, and documentation).

### Release and Deployment

- `yarn dist`: Cleans, builds the project, and checks for type errors.
- `yarn release:major`: Generates a changelog, builds documentation, and bumps the version (major).
- `yarn release:minor`: Similar to above, but bumps the version (minor).
- `yarn release:patch`: Similar to above, but bumps the version (patch).
- `yarn release:revert`: Unpublishes the last version from npm.

## Contributing

We welcome contributions to the Hamsa Avatars SDK! Here’s how you can get started:

### Getting Started

1. **Fork the Repository**: Click the "Fork" button at the top of the repository page to create a copy of the repository under your GitHub account.

2. **Clone the Repository**: Clone your forked repository to your local machine.

   ```bash
   git clone https://github.com/hamsa-ai/@hamsa-ai/avatars-sdk.git
   ```

3. **Install Dependencies**: Navigate to the project directory and install the dependencies.

   ```bash
   cd @hamsa-ai/avatars-sdk
   yarn install
   ```

### Development Workflow

- **Create a Branch**: Create a new branch for your feature or bugfix.

```bash
git checkout -b feature/my-new-feature
```

- **Make Changes**: Implement your changes in the codebase.
- **Run Tests**: Ensure all tests pass.

```bash
yarn test
```

- **Build the Project**: Ensure there are no build errors.

```bash
yarn build
```

- **Start Development Mode**: Watch for changes during development.

```bash
yarn dev
```

- **Commit Changes**: Commit your changes with a meaningful message.

```bash
git add .
git commit -m "feat: Add new feature"
```

- **Push to GitHub**: Push your branch to your forked repository.

```bash
git push origin feature/my-new-feature
```

- **Create a Pull Request**: Go to the original repository and create a pull request from your branch.

### Code Style and Guidelines

- **Coding Standards**: Follow the existing coding style. The project uses ESLint and Prettier to enforce code quality and formatting.

- **Commit Messages**: Use [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages.

- **Testing**: Write unit tests for new features or bug fixes.

### Reporting Issues

If you encounter any issues or have suggestions, please open an issue on GitHub:

[GitHub Issues](https://github.com/hamsa-ai/@hamsa-ai/avatars-sdk/issues)

### Pull Request Process

1. Ensure your branch is up to date with the main branch.

   ```bash
   git checkout main
   git pull
   git checkout feature/my-new-feature
   git rebase main
   ```

2. Submit your pull request and fill out the provided template.
3. Wait for maintainers to review your PR. Be prepared to make changes if requested.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Thank you for using the Hamsa Avatars SDK! If you have any questions, please reach out at [info@tryhamsa.com](mailto:info@tryhamsa.com).
