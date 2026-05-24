export type ServerStatus = 'PROVISIONING' | 'RUNNING' | 'STOPPED' | 'ERROR' | 'DELETED';
export type ServerType = 'VANILLA' | 'PAPER' | 'SPIGOT' | 'FABRIC' | 'FORGE';
export type Difficulty = 'PEACEFUL' | 'EASY' | 'NORMAL' | 'HARD';
export type GameMode = 'SURVIVAL' | 'CREATIVE' | 'ADVENTURE' | 'SPECTATOR';
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'VIEWER';

export interface Server {
  id: string;
  name: string;
  description?: string;
  type: ServerType;
  version: string;
  status: ServerStatus;
  port: number;
  allocatedMemory: number;
  allocatedCpu: number;
  onlinePlayers?: number;
  createdAt: string;
}

export interface ServerDetail extends Server {
  containerId?: string;
  hostPath?: string;
  rconPort?: number;
  updatedAt?: string;
  config: ServerConfig;
}

export interface ServerConfig {
  motd: string;
  difficulty: Difficulty;
  maxPlayers: number;
  gameMode: GameMode;
  pvpEnabled: boolean;
  onlineMode: boolean;
  allowFlight: boolean;
  hardcore: boolean;
  spawnProtection: number;
  whitelistEnabled: boolean;
  spawnMonsters: boolean;
  spawnAnimals: boolean;
}

export interface CreateServerRequest {
  name: string;
  description?: string;
  serverType: ServerType;
  version: string;
  allocatedMemory: number;
  allocatedCpu: number;
  port: number;
  config: {
    motd: string;
    maxPlayers: number;
    difficulty: Difficulty;
    pvpEnabled: boolean;
    onlineMode: boolean;
  };
}
