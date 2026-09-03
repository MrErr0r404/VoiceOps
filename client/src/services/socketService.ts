import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private url: string;

  constructor() {
    // Check for VITE_SERVER_URL environment variable first, then fallback to localhost detection
    const envUrl = (import.meta as any).env?.VITE_SERVER_URL;
    if (envUrl) {
      this.url = envUrl;
    } else if (typeof window !== 'undefined' && window.location.origin.includes('localhost')) {
      this.url = 'http://localhost:5000';
    } else {
      this.url = '';
    }
  }

  connect() {
    if (!this.socket) {
      this.socket = io(this.url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        transports: ['websocket', 'polling']
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event: string, handler: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, handler);
    }
  }

  off(event: string, handler: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, handler);
    }
  }

  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}

export const socketService = new SocketService();
