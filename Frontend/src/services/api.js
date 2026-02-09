import { apiGet, apiPost } from "./api";

// open cart chat
export const openChatByProduct = async (productId, buyerId = null) =>
  apiPost("/api/chats/open-by-product", { productId, buyerId });

// msg icon
export const getMyThreads = async () =>
  apiGet("/api/chats/threads/mine");

// msg
export const getThreadMessages = async (threadId) =>
  apiGet(`/api/chats/threads/${threadId}/messages`);

// send msg
export const sendMessage = async (threadId, text) =>
  apiPost(`/api/chats/threads/${threadId}/messages`, { text });

// mark seen 
export const markThreadSeen = async (threadId) =>
  apiPost(`/api/chats/threads/${threadId}/seen`, {});
