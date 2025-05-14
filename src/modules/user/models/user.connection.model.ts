import { ClientSession, Document, Model, Schema, model, Types } from 'mongoose';
import { logger } from '../../../config/logger';

import { EVENT_MINI_FIELDS_SELECT, EventDocument } from '../../event/models/event.model';
import { DINNER_MINI_FIELDS_SELECT, DinnerDocument } from '../../dinner/models/dinner.model';

export enum RelationType {
  DINNER = 'dinner',
  EVENT = 'event',
  PARTY = 'party',
}

export interface UserConnectionDocument extends Document {
  _id: Types.ObjectId;
  users: Types.ObjectId[];
  connectionId: string;
  dinners: Types.ObjectId[] | DinnerDocument[];
  events: Types.ObjectId[] | EventDocument[];
  createdAt: Date;
  updatedAt: Date;
}

interface UserConnectionModel extends Model<UserConnectionDocument> {
  addConnection: (
    userId: Types.ObjectId,
    type: RelationType,
    relationId: Types.ObjectId,
    otherUsers: Types.ObjectId[],
    session: ClientSession,
  ) => Promise<void>;
  removeConnection: (
    userId: Types.ObjectId,
    type: RelationType,
    relationId: Types.ObjectId,
    session: ClientSession,
  ) => Promise<void>;
  getConnection: (users: Types.ObjectId[]) => Promise<UserConnectionDocument | null>;
  getDetailedConnection: (users: Types.ObjectId[]) => Promise<UserConnectionDocument | null>;
  getConnectionStatuses: (user: Types.ObjectId, otherUsers: Types.ObjectId[]) => Promise<{ [key: string]: boolean }>;
}

const userConnectionSchema = new Schema<UserConnectionDocument>(
  {
    users: { type: [Schema.Types.ObjectId], ref: 'User', required: true },
    connectionId: { type: String, required: true },
    dinners: { type: [Schema.Types.ObjectId], ref: 'Dinner', required: false, default: [] },
    events: { type: [Schema.Types.ObjectId], ref: 'Event', required: false, default: [] },
  },
  { timestamps: true },
);

userConnectionSchema.index({ users: 1 });
userConnectionSchema.index({ connectionId: 1 }, { unique: true });

userConnectionSchema.statics = {
  addConnection: async function (
    userId: Types.ObjectId,
    type: RelationType,
    relationId: Types.ObjectId,
    otherUsers: Types.ObjectId[],
    session: ClientSession,
  ) {
    // This is to avoid adding the same user to the connection
    otherUsers = otherUsers.filter((user) => user.toString() !== userId.toString());

    if (otherUsers.length === 0) {
      return; // If otherUsers is empty, return
    }
    const bulkUpdates = [];
    const key = type === RelationType.DINNER ? 'dinners' : 'events';
    // Only add connections if otherUsers is not empty
    if (otherUsers.length) {
      bulkUpdates.push(
        ...otherUsers.map((otherUserId) => {
          const connectionId = generateUserConnectionId([userId, otherUserId]);
          const users = [userId, otherUserId].sort();
          return {
            updateOne: {
              filter: { connectionId },
              update: { $addToSet: { [key]: relationId }, $set: { users } },
              upsert: true,
            },
          };
        }),
      );
      await this.bulkWrite(bulkUpdates, { session });
    }
  },
  removeConnection: async function (
    userId: Types.ObjectId,
    type: RelationType,
    relationId: Types.ObjectId,
    session: ClientSession,
  ) {
    const key = type === RelationType.DINNER ? 'dinners' : 'events';
    const filter = {
      users: userId, // check if userId is in users array
      [key]: relationId,
    };

    const update = { $pull: { [key]: relationId } };

    const updated = await this.updateMany(filter, update, { session });
    logger.info(`Updated ${updated.nModified} connections`);

    // Remove empty connections
    const deleteFilter = { dinners: { $size: 0 }, events: { $size: 0 } };
    const deleted = await this.deleteMany(deleteFilter, { session });
    logger.info(`Deleted ${deleted.deletedCount} empty connections`);
  },
  getConnection: async function (users: Types.ObjectId[]) {
    const connectionId = generateUserConnectionId(users);
    return this.findOne({ connectionId });
  },
  getDetailedConnection: async function (users: Types.ObjectId[]) {
    const connectionId = generateUserConnectionId(users);
    const connection = await this.findOne({ connectionId })
      .populate('events', EVENT_MINI_FIELDS_SELECT)
      .populate('dinners', DINNER_MINI_FIELDS_SELECT);

    if (!connection) {
      return null;
    }

    return connection;
  },
  getConnectionStatuses: async function (
    user: Types.ObjectId,
    otherUsers: Types.ObjectId[],
  ): Promise<{ [key: string]: boolean }> {
    const connectionIds = otherUsers
      .filter((otherUser) => otherUser.toString() !== user.toString())
      .map((otherUser) => generateUserConnectionId([user, otherUser]));

    const connections: { user: Types.ObjectId }[] = await this.aggregate([
      { $match: { connectionId: { $in: connectionIds } } },
      { $project: { users: 1 } },
      { $unwind: '$users' },
      { $project: { user: '$users' } },
    ]);

    return otherUsers.reduce((acc, otherUser) => {
      const connection = connections.find((connection) => connection.user.toString() === otherUser.toString());
      return { ...acc, [otherUser.toString()]: connection !== undefined };
    }, {});
  },
};

export const generateUserConnectionId = (users: Types.ObjectId[]) => {
  return users.sort().join('_');
};

export const UserConnection = model<UserConnectionDocument, UserConnectionModel>(
  'UserConnection',
  userConnectionSchema,
  'userConnections',
);
