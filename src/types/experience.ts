export type TaskState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export type FeedbackTone = 'info' | 'success' | 'warning' | 'error' | 'validation';

export type InlineFeedbackMessage = {
  id?: string;
  message: string;
  tone?: FeedbackTone;
};
