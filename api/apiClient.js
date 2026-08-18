// api/apiClient.js
import axios from "axios";
import { API_HOSTS, API_PASS, REQUEST_CONFIG } from "../config";

const apiClient = axios.create({
  baseURL: API_HOSTS.HOTEL_WS,
  timeout: REQUEST_CONFIG.timeoutMs,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      return Promise.reject(new Error("Request timeout. Please try again."));
    }
    if (!error.response) {
      return Promise.reject(
        new Error("Network error. Check your internet connection."),
      );
    }
    return Promise.reject(error);
  },
);

export async function callApi({
  params = {},
  method = "GET",
  endpoint = "restmobile.php",
  host = "HOTEL_WS",
} = {}) {
  const finalParams = {
    apipass: API_PASS,
    ...params,
  };

  const baseURL = API_HOSTS[host] || API_HOSTS.HOTEL_WS;
  const url = `${baseURL}/${endpoint}`.replace(/([^:]\/)\/+/g, "$1");

  try {
    let response;

    if (method === "GET") {
      response = await apiClient.get(url, { params: finalParams });
    } else if (method === "POST") {
      response = await apiClient.post(url, null, {
        params: finalParams,
      });
    } else {
      throw new Error(`Unsupported method: ${method}`);
    }

    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data || error.message || "An unknown error occurred",
      status: error.response?.status || 500,
    };
  }
}

export default apiClient;
