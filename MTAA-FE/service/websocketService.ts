// MTAA-FE/service/websocketService.ts
import { Socket, Manager } from 'socket.io-client';
import { transaction } from '../app/(transactions)/transaction';
import AsyncStorage from '@react-native-async-storage/async-storage';

class WebSocketService {
  private socket: Socket | null = null;
  private manager: Manager | null = null;
  private transactionsListeners: ((transactions: transaction[]) => void)[] = [];
  private connected: boolean = false;
  private serverUrl: string = 'http://192.168.0.102:8085'; // Make sure this is the correct IP address
  private token: string | null = null;

  // Set token
  public setToken(token: string | null) {
    this.token = token;
    console.log('Token set:', token ? token.substring(0, 10) + '...' : 'null');
  }

  // Connect to WebSocket
  public connect(): void {
    if (this.connected) {
      console.log('WebSocket is already connected');
      return;
    }

    console.log('Connecting to WebSocket server:', this.serverUrl);
    
    try {
      // In Socket.io v2, we create a Manager and then get a socket from it
      this.manager = new Manager(this.serverUrl, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        query: {
          token: this.token
        }
      });

      // Get socket instance from the manager
      this.socket = this.manager.socket('/');

      // Set auth headers for Socket.io v2
      if (this.token) {
        this.socket.io.opts.extraHeaders = {
          Authorization: `Bearer ${this.token}`
        };
      }

      this.socket.on('connect', () => {
        console.log('WebSocket connected, socket ID:', this.socket?.id);
        this.connected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        this.connected = false;
      });

      // Expecting the server to send transaction updates
      this.socket.on('transactions_update', (data: transaction[]) => {
        console.log('Received transactions via WebSocket:', data.length);
        // Store to cache for offline use
        AsyncStorage.setItem('cachedTransactions', JSON.stringify(data));
        
        // Notify all listeners about changes
        this.notifyTransactionsListeners(data);
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('WebSocket connection error:', error);
      });
      
      this.socket.on('error', (error: any) => {
        console.error('WebSocket error:', error);
      });
    } catch (e) {
      console.error('Error creating WebSocket connection:', e);
    }
  }

  // Disconnect from WebSocket
  public disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting from WebSocket server');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Subscribe to all transactions
  public subscribeToTransactions(): void {
    if (!this.socket || !this.connected) {
      console.log('WebSocket is not connected, connecting...');
      this.connect();
    }
    
    console.log('Subscribing to transactions');
    this.socket?.emit('subscribe_transactions');
  }

  // Add listener for transaction updates
  public addTransactionsListener(listener: (transactions: transaction[]) => void): void {
    console.log('Adding listener for transactions');
    this.transactionsListeners.push(listener);
  }

  // Remove listener
  public removeTransactionsListener(listener: (transactions: transaction[]) => void): void {
    console.log('Removing listener for transactions');
    this.transactionsListeners = this.transactionsListeners.filter(l => l !== listener);
  }

  // Notify all listeners
  private notifyTransactionsListeners(transactions: transaction[]): void {
    console.log('Notifying listeners:', this.transactionsListeners.length);
    this.transactionsListeners.forEach(listener => {
      listener(transactions);
    });
  }

  // Method for testing connection
  public isConnected(): boolean {
    return this.connected;
  }
}

// Singleton instance for the entire application
export const websocketService = new WebSocketService();