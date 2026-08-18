// config.js
export const API_HOSTS = {
  HOTEL_WS: "https://checkincloud.in/hotelws",
  RESTCLOUD_WS: "https://checkincloud.in/restocloudws",
};

export const API_PASS = "7765";

export const REQUEST_CONFIG = {
  timeoutMs: 15000,
  retries: 2,
  retryDetails: 800,
};

export const STORAGE_KEYS = {
  HOTEL_GROUP_CODE: "rc_hgrpcd",
  HOTEL_CODE: "rc_hotelcd",
  USER_CODE: "rc_usercd",
  USER_NAME: "rc_usernm",
  USER_TYPE: "rc_usertype", // 'W' | 'C'
  POS_CODE: "rc_poscd",
  RESTAURANT_NAME: "rc_restaurantnm",
  LOGIN_ID: "rc_loginid",
  USER_DATA: "rc_userdata",
};
