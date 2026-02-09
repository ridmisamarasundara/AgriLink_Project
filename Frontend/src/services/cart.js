 import { apiGet, apiPost, apiDelete } from "./api";

export const addToCart = (productId, quantity) =>
  apiPost("/api/cart/add", { productId, quantity });

export const getMyCart = () => apiGet("/api/cart/mine");

export const removeCartItem = (id) => apiDelete(`/api/cart/${id}`);
