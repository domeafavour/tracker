# Trackeer

A lightweight, flexible TypeScript library for tracking events and actions in your applications.

## Features

- **Type-safe tracking**: Full TypeScript support with generics
- **Event lifecycle management**: Create, track, and submit events with timestamps
- **Customizable ID generation**: Use the built-in ID generator or provide your own
- **Flexible submission handling**: Define global or event-specific submission handlers
- **Zero dependencies**: Pure TypeScript implementation with no external dependencies

## Installation

### npm

```bash
npm install trackeer
```

### yarn

```bash
yarn add trackeer
```

### pnpm

```bash
pnpm add trackeer
```

## Usage

### Basic Usage

```typescript
import { Tracker } from 'trackeer';

// Define your tracking event types
type Events = {
  pageView: { url: string; referrer?: string };
  buttonClick: { id: string; text: string };
  formSubmit: { formId: string; values: Record<string, any> };
};

// Create a tracker instance
const tracker = new Tracker<Events>({
  // Optional: Custom ID generator
  generateId: () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  
  // Optional: On create callback
  onCreate: (record) => {
    console.log(`Event created: ${record.type} with ID ${record.id}`);
  },
  
  // Optional: Global submission handler
  onSubmit: (record) => {
    console.log(`Event submitted: ${record.type}`, record.data);
    // Send to your analytics service
    sendToAnalytics(record);
  }
});
```

### Synchronous Event Tracking

For immediate tracking of events that don't require duration measurement:

```typescript
// Track a page view immediately
tracker.create('pageView');
tracker.submit('pageView', {
  url: window.location.href,
  referrer: document.referrer
});

// Or more concisely, create and submit in one step
const pageViewRecord = tracker.create('pageView');
tracker.submit('pageView', {
  url: window.location.href,
  referrer: document.referrer
}, pageViewRecord);
```

### Asynchronous Event Tracking

For tracking events with duration or delayed submission:

```typescript
// Start tracking a form interaction
const formRecord = tracker.create('formSubmit');

// Later, when the form is submitted
function onFormSubmit(values) {
  // Submit the tracking data with the record ID
  tracker.submit('formSubmit', {
    formId: 'contact-form',
    values
  }, formRecord.id);
}
```

### Batch Submissions

Track multiple events of the same type and submit them all at once:

```typescript
// Create multiple button click events
tracker.create('buttonClick'); // ID is auto-generated
tracker.create('buttonClick');

// Submit all pending button click events at once
tracker.submit('buttonClick', {
  id: 'submit-button',
  text: 'Submit'
});
```

### Event-Specific Handlers

Define different handlers for different event types:

```typescript
const tracker = new Tracker<Events>({
  onSubmit: {
    pageView: (record) => {
      console.log('Page view:', record.data.url);
      sendPageViewToAnalytics(record);
    },
    buttonClick: (record) => {
      console.log('Button click:', record.data.text);
      sendButtonClickToAnalytics(record);
    },
    formSubmit: (record) => {
      console.log('Form submitted:', record.data.formId);
      sendFormSubmitToAnalytics(record);
    }
  }
});
```

### Usage with Web Frameworks

#### React

```tsx
import { useState, useEffect } from 'react';
import { Tracker } from 'trackeer';

function useTracker() {
  const [tracker] = useState(() => new Tracker<{
    pageView: { url: string; duration: number };
    buttonClick: { id: string; text: string };
  }>({
    onSubmit: (record) => {
      console.log('Event tracked:', record);
      // Send to analytics service
    }
  }));

  return tracker;
}

function App() {
  const tracker = useTracker();
  
  // Track page view duration
  useEffect(() => {
    const pageViewRecord = tracker.create('pageView');
    
    return () => {
      const duration = Date.now() - pageViewRecord.createdAt;
      tracker.submit('pageView', {
        url: window.location.pathname,
        duration
      }, pageViewRecord);
    };
  }, []);
  
  return (
    <button
      onClick={() => {
        // Track button click synchronously
        tracker.create('buttonClick');
        tracker.submit('buttonClick', {
          id: 'main-cta',
          text: 'Get Started'
        });
      }}
    >
      Get Started
    </button>
  );
}
```

#### Vue

```vue
<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import { Tracker } from 'trackeer';

// Create tracker instance
const tracker = new Tracker({
  onSubmit: (record) => {
    console.log('Event tracked:', record);
    // Send to analytics service
  }
});

// Track page view with duration
let pageViewRecord = null;

onMounted(() => {
  pageViewRecord = tracker.create('pageView');
});

onUnmounted(() => {
  if (pageViewRecord) {
    tracker.submit('pageView', {
      url: window.location.pathname,
      duration: Date.now() - pageViewRecord.createdAt
    }, pageViewRecord);
  }
});

// Button click handler with tracking
function handleButtonClick() {
  // Track the click
  const clickRecord = tracker.create('buttonClick');
  tracker.submit('buttonClick', {
    id: 'submit-form',
    text: 'Submit'
  }, clickRecord);
  
  // Perform the actual action
  submitForm();
}
</script>

<template>
  <button @click="handleButtonClick">Submit</button>
</template>
```

## API Reference

### Tracker Class

#### Constructor

```typescript
constructor(options: {
  generateId?: () => string;
  onCreate?: (record: TrackingInitialRecord<StringKeyOf<P>>) => void;
  onSubmit?: ((record: TrackingSubmitRecord<P>) => void) | TrackingSubmissionHandlers<P>;
})
```

#### Methods

| Method | Description |
|--------|-------------|
| `create<K extends StringKeyOf<P>>(type: K)` | Creates a new tracking record with an auto-generated ID. Returns the created record. |
| `getRecord<K extends StringKeyOf<P>>(type: K, id: string)` | Gets an existing record by type and ID. Returns the record or null if not found. |
| `submit<K extends StringKeyOf<P>>(type: K, data: P[K], idOrRecord?: string \| TrackingInitialRecord)` | Submits tracking data for a specific type. When idOrRecord is omitted, submits data for all records of that type. |

## License

MIT © [domeafavour](https://github.com/domeafavour)
