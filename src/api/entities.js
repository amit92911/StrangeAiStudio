import { makeEntity, STORAGE_KEYS } from './storage';

// Local storage backed entities
export const Project = makeEntity(STORAGE_KEYS.projects);
export const Chat = makeEntity(STORAGE_KEYS.chats);
export const Message = makeEntity(STORAGE_KEYS.messages);
export const Prompt = makeEntity(STORAGE_KEYS.prompts);

// Optional placeholders to keep imports compiling
export const Provider = {};
export const FileAsset = {};
export const ApiKey = {};
export const User = {};