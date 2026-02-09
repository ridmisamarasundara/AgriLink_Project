 import { apiPost, apiGet, apiPut } from "./api";

export const placeOrderFromCart = async (cartItemIds) => {
  try {
    console.log("📤 placeOrderFromCart - cartItemIds:", cartItemIds);
    const response = await apiPost("/api/orders/place", { cartItemIds });
    console.log("✅ placeOrderFromCart - response:", response);
    return response;
  } catch (error) {
    console.error("❌ placeOrderFromCart - error:", error.message);
    throw error;
  }
};

export const getBuyerOrders = async () => {
  try {
    console.log("📥 getBuyerOrders - calling API...");
    const response = await apiGet("/api/orders/buyer/orders");
    console.log("✅ getBuyerOrders - response:", response);
    return response;
  } catch (error) {
    console.error("❌ getBuyerOrders - error:", error.message);
    throw error;
  }
};

export const getVendorOrders = async () => {
  try {
    console.log("📥 getVendorOrders - calling API...");
    const response = await apiGet("/api/orders/vendor/orders");
    console.log("✅ getVendorOrders - response:", response);
    return response;
  } catch (error) {
    console.error("❌ getVendorOrders - error:", error.message);
    throw error;
  }
};

export const confirmOrder = async (orderId) => {
  try {
    console.log("\n========================================");
    console.log("🔵 confirmOrder - START");
    console.log("========================================");
    console.log("Order ID:", orderId);
    
    if (!orderId) {
      throw new Error("Order ID is required");
    }
    
    console.log("📤 Calling PUT /api/orders/" + orderId + "/confirm");
    const response = await apiPut(`/api/orders/${orderId}/confirm`, {});
    
    console.log("✅ confirmOrder - SUCCESS");
    console.log("Response:", JSON.stringify(response, null, 2));
    console.log("========================================\n");
    
    return response;
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ confirmOrder - FAILED");
    console.error("Error:", error.message);
    console.error("========================================\n");
    throw error;
  }
};

export const rejectOrder = async (orderId) => {
  try {
    console.log("\n========================================");
    console.log("🔴 rejectOrder - START");
    console.log("========================================");
    console.log("Order ID:", orderId);
    
    if (!orderId) {
      throw new Error("Order ID is required");
    }
    
    console.log("📤 Calling PUT /api/orders/" + orderId + "/reject");
    const response = await apiPut(`/api/orders/${orderId}/reject`, {});
    
    console.log("✅ rejectOrder - SUCCESS");
    console.log("Response:", JSON.stringify(response, null, 2));
    console.log("========================================\n");
    
    return response;
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ rejectOrder - FAILED");
    console.error("Error:", error.message);
    console.error("========================================\n");
    throw error;
  }
};