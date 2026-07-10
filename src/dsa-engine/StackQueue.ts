export interface UndoAction {
  id: string;
  type: 'DELETE_POST' | 'DOWNVOTE' | 'JOIN_GROUP' | 'NAVIGATE' | 'UPLOAD_FILE';
  description: string;
  timestamp: string;
  payload?: any;
}

export class UndoStack<T> {
  private stack: T[] = [];
  private readonly maxCapacity: number = 50;

  constructor(maxCapacity: number = 50) {
    this.maxCapacity = maxCapacity;
  }

  public push(item: T): void {
    if (this.stack.length >= this.maxCapacity) {
      this.stack.shift(); // Evict oldest
    }
    this.stack.push(item);
  }

  public pop(): T | undefined {
    return this.stack.pop();
  }

  public peek(): T | undefined {
    return this.stack[this.stack.length - 1];
  }

  public get size(): number {
    return this.stack.length;
  }

  public getItems(): T[] {
    return [...this.stack].reverse();
  }
}

export interface BackgroundTask {
  id: string;
  title: string;
  type: 'INDEX_PDF' | 'TRANSCODE_VOICE' | 'COMPRESS_IMAGE' | 'BROADCAST_NOTIFICATION' | 'SEND_OTP';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED';
  progress: number;
  timeComplexity: string;
}

export class TaskQueue<T> {
  private queue: T[] = [];

  constructor() {}

  public enqueue(item: T): void {
    this.queue.push(item);
  }

  public dequeue(): T | undefined {
    return this.queue.shift();
  }

  public peek(): T | undefined {
    return this.queue[0];
  }

  public get size(): number {
    return this.queue.length;
  }

  public getItems(): T[] {
    return [...this.queue];
  }
}

export const globalUndoStack = new UndoStack<UndoAction>();
export const globalNotificationQueue = new TaskQueue<BackgroundTask>();
