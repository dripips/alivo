export interface IncomingMessage {
  channelType: 'TELEGRAM' | 'VK_MAX' | 'WEB';
  externalUserId: string;
  username?: string;
  text: string;
  callbackData?: string;
  metadata?: Record<string, any>;
}

export interface OutgoingMessage {
  externalUserId: string;
  text: string;
  buttons?: MessageButton[];
  parseMode?: 'HTML' | 'Markdown';
}

export interface MessageButton {
  label: string;
  callbackData: string;
}

export interface ChannelAdapter {
  readonly type: 'TELEGRAM' | 'VK_MAX' | 'WEB';

  sendMessage(msg: OutgoingMessage): Promise<void>;
  sendAlert(externalUserId: string, text: string): Promise<void>;

  onMessage(handler: (msg: IncomingMessage) => Promise<void>): void;
  onCallback(handler: (msg: IncomingMessage) => Promise<void>): void;

  start(): Promise<void>;
  stop(): Promise<void>;
}
