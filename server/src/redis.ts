import redis = require("redis");
import { promisify } from "util";
import { User } from "./user";

import Database from "./database";

const cache = redis.createClient(
  parseInt(process.env.RedisPort),
  process.env.RedisHostname,
  {
    auth_pass: process.env.RedisKey,
    tls: { servername: process.env.RedisHostname },
  }
);

const getCache = promisify(cache.get).bind(cache);
const setCache = promisify(cache.set).bind(cache);

const Redis: Database = {
  async getActiveUsers() {
    return JSON.parse(await getCache(activeUsersKey)) || [];
  },
  async setActiveUsers(users: string[]) {
    return await setCache(activeUsersKey, JSON.stringify(users));
  },

  async getUserHeartbeat(userId: string): Promise<number> {
    return await getCache(heartbeatKeyForUser(userId));
  },

  async setUserHeartbeat(userId: string) {
    await setCache(heartbeatKeyForUser(userId), new Date().valueOf());
  },

  // TODO: This could theoretically use Redis lists
  async setUserAsActive(userId: string) {
    const activeUsers = await Redis.getActiveUsers();
    if (!activeUsers.includes(userId)) {
      activeUsers.push(userId);
      await Redis.setActiveUsers(activeUsers);
    }
  },

  // Room presence

  async roomOccupants(roomId: string) {
    const presenceKey = roomPresenceKey(roomId);
    return JSON.parse(await getCache(presenceKey)) || [];
  },

  async setRoomOccupants(roomId: string, occupants: string[]) {
    const presenceKey = roomPresenceKey(roomId);
    await setCache(presenceKey, JSON.stringify(occupants));
  },

  async setCurrentRoomForUser(userId: string, roomId: string) {
    await setCache(roomKeyForUser(userId), roomId);
  },

  async currentRoomForUser(userId: string) {
    return await getCache(roomKeyForUser(userId));
  },

  // User
  async getPublicUser(userId: string) {
    return JSON.parse(await getCache(profileKeyForUser(userId)));
  },

  async setUserProfile(userId: string, data: User) {
    return await setCache(profileKeyForUser(userId), JSON.stringify(data));
  },

  async getUsernameForUserId(userId: string) {
    return await getCache(usernameKeyForUser(userId));
  },

  async lastShoutedForUser(userId: string) {
    const date = await getCache(shoutKeyForUser(userId));
    if (date) {
      return new Date(JSON.parse(date));
    }
  },

  async userJustShouted(userId: string) {
    await setCache(shoutKeyForUser(userId), JSON.stringify(new Date()));
  },
};

const activeUsersKey = "activeUsersList";

function shoutKeyForUser(user: string): string {
  return `${user}Shout`;
}

function usernameKeyForUser(userId: string): string {
  return `${userId}Handle`;
}

function profileKeyForUser(userId: string): string {
  return `${userId}Profile`;
}

function heartbeatKeyForUser(user: string): string {
  return `${user}Heartbeat`;
}

export function roomPresenceKey(roomName: string): string {
  return `${roomName}Presence`;
}

export function roomKeyForUser(user: string): string {
  return `${user}Room`;
}

export function roomKey(name: string) {
  return `${name}RoomData`;
}

export default Redis;
