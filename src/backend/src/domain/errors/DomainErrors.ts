export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CallServiceError extends Error {
  readonly code = 'ELEVENLABS_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'CallServiceError';
  }
}

export class TimeoutError extends Error {
  readonly code = 'TIMEOUT';
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
