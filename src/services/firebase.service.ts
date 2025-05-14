import * as admin from 'firebase-admin';
import { firebaseConfig } from '../config/vars';
import { logger } from '../config/logger';

// Define a type for the Firebase messaging service
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FirebaseMessaging = any;

interface MessageResponse {
  messageId: string;
}

/**
 * Firebase service for notifications and Firestore
 */
class FirebaseService {
  private app: admin.app.App;

  constructor() {
    try {
      // Initialize Firebase app if not already initialized
      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
        });
        logger.info('Firebase initialized successfully');
      } else {
        this.app = admin.app();
      }
    } catch (error) {
      logger.error('Error initializing Firebase', error);
      throw error;
    }
  }

  /**
   * Get Firestore instance
   */
  public getFirestore(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  /**
   * Get Firebase Messaging instance
   */
  public getMessaging(): FirebaseMessaging {
    return this.app.messaging();
  }

  /**
   * Send push notification to a device
   * @param token Device token
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data
   * @returns Promise with messaging response
   */
  public async sendPushNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<MessageResponse> {
    try {
      const message = {
        token,
        notification: {
          title,
          body,
        },
        data,
      };

      const response = await this.getMessaging().send(message);
      logger.info('Push notification sent', {
        token,
        title,
        messageId: response,
      });

      return { messageId: response };
    } catch (error) {
      logger.error('Error sending push notification', error);
      throw error;
    }
  }

  /**
   * Send push notification to multiple devices
   * @param tokens Device tokens
   * @param title Notification title
   * @param body Notification body
   * @param data Additional data
   * @returns Promise with messaging response
   */
  public async sendMulticastPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    try {
      const message = {
        tokens,
        notification: {
          title,
          body,
        },
        data,
      };

      const response = await this.getMessaging().sendMulticast(message);
      logger.info('Multicast push notification sent', {
        tokens: tokens.length,
        success: response.successCount,
        failure: response.failureCount,
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      logger.error('Error sending multicast push notification', error);
      throw error;
    }
  }

  /**
   * Create a chat room in Firestore
   * @param roomData Chat room data
   * @returns Promise with room document reference
   */
  public async createChatRoom(roomData: {
    name: string;
    participants: string[];
    createdAt: Date;
    type: 'private' | 'group';
  }): Promise<admin.firestore.DocumentReference<admin.firestore.DocumentData>> {
    try {
      const roomRef = await this.getFirestore()
        .collection('chatRooms')
        .add({
          ...roomData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      logger.info(`Chat room created with ID: ${roomRef.id}`);
      return roomRef;
    } catch (error) {
      logger.error('Error creating chat room', error);
      throw error;
    }
  }

  /**
   * Send a message to a chat room
   * @param roomId Chat room ID
   * @param messageData Message data
   * @returns Promise with message document reference
   */
  public async sendChatMessage(
    roomId: string,
    messageData: {
      senderId: string;
      text: string;
      media?: {
        type: 'image' | 'video' | 'audio' | 'document';
        url: string;
      };
    },
  ): Promise<admin.firestore.DocumentReference<admin.firestore.DocumentData>> {
    try {
      const messageRef = await this.getFirestore()
        .collection('chatRooms')
        .doc(roomId)
        .collection('messages')
        .add({
          ...messageData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          readBy: [messageData.senderId],
        });

      // Update the room's lastMessage field
      await this.getFirestore()
        .collection('chatRooms')
        .doc(roomId)
        .update({
          lastMessage: {
            text: messageData.text,
            senderId: messageData.senderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
        });

      logger.info(`Chat message sent to room ${roomId}`);
      return messageRef;
    } catch (error) {
      logger.error(`Error sending chat message to room ${roomId}`, error);
      throw error;
    }
  }

  /**
   * Get chat messages from a room
   * @param roomId Chat room ID
   * @param limit Number of messages to retrieve
   * @param beforeId Get messages before this message ID
   * @returns Promise with messages data
   */
  public async getChatMessages(
    roomId: string,
    limit = 50,
    beforeId?: string,
  ): Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>> {
    try {
      let query = this.getFirestore()
        .collection('chatRooms')
        .doc(roomId)
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (beforeId) {
        const beforeDoc = await this.getFirestore()
          .collection('chatRooms')
          .doc(roomId)
          .collection('messages')
          .doc(beforeId)
          .get();

        if (beforeDoc.exists) {
          query = query.startAfter(beforeDoc);
        }
      }

      return await query.get();
    } catch (error) {
      logger.error(`Error getting chat messages from room ${roomId}`, error);
      throw error;
    }
  }
}

export default new FirebaseService();
