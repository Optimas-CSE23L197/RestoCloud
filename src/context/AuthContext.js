// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../config";
import * as SecureStore from "expo-secure-store";

const AuthContext = createContext(null);

const safe = (val) => (val === undefined || val === null ? "" : String(val));

export const AuthProvider = ({ children }) => {
  const [hotelGroupCode, setHotelGroupCode] = useState(null);
  const [userType, setUserType] = useState(null);
  const [restaurantList, setRestaurantList] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [userData, setUserData] = useState(null);
  const [hotelCd, setHotelCd] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [
          storedGroupCode,
          storedUserType,
          storedUserData,
          storedPosCode,
          storedHotelCd,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.HOTEL_GROUP_CODE),
          AsyncStorage.getItem(STORAGE_KEYS.USER_TYPE),
          AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
          AsyncStorage.getItem(STORAGE_KEYS.POS_CODE),
          AsyncStorage.getItem(STORAGE_KEYS.HOTEL_CODE),
        ]);

        if (storedGroupCode) setHotelGroupCode(storedGroupCode);
        if (storedUserType) setUserType(storedUserType);
        if (storedHotelCd) setHotelCd(storedHotelCd);

        if (storedUserData) {
          const parsed = JSON.parse(storedUserData);
          setUserData(parsed);
          setRestaurantList(parsed);

          const restored = storedPosCode
            ? parsed.find((r) => r.rcode === storedPosCode)
            : parsed[0];

          if (restored) {
            setSelectedRestaurant(restored);
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error("Failed to load auth data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadStoredData();
  }, []);

  const groupLogin = async (loginId, password, apiCall) => {
    try {
      const result = await apiCall(loginId, password);
      if (result.success && result.data?.hotelgrpcd) {
        const grpCode = result.data.hotelgrpcd;

        setHotelGroupCode(grpCode);
        await AsyncStorage.setItem(STORAGE_KEYS.HOTEL_GROUP_CODE, grpCode);
        await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_ID, loginId);

        await SecureStore.setItemAsync("COMPANY_LOGIN_ID", loginId);
        await SecureStore.setItemAsync("COMPANY_PASSWORD", password);

        return { success: true, data: result.data };
      }
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const userLogin = async (loginId, password, apiCall) => {
    try {
      if (!hotelGroupCode) {
        return {
          success: false,
          error: "No hotel group selected. Please login as company first.",
        };
      }

      const result = await apiCall(loginId, password, hotelGroupCode);
      if (
        !result.success ||
        !Array.isArray(result.data) ||
        result.data.length === 0
      ) {
        return { success: false, error: result.error || "Invalid credentials" };
      }

      const list = result.data;
      setRestaurantList(list);
      setUserData(list);
      setUserType(list[0]?.usertype || "W");

      // ✅ PRINT ALL DATA AT USER LOGIN TIME
      console.log("========== USER LOGIN DATA ==========");
      console.log("hotelGroupCode:", hotelGroupCode);
      console.log("userType:", list[0]?.usertype);
      console.log("restaurantList (full):", JSON.stringify(list, null, 2));
      console.log("=====================================");

      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(list));

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_CODE, safe(list[0]?.usercd)],
        [STORAGE_KEYS.USER_NAME, safe(list[0]?.usernm)],
      ]);

      if (list.length === 1) {
        await selectRestaurant(list[0]);
      } else {
        setIsLoggedIn(true);
      }

      return {
        success: true,
        data: list,
        needsRestaurantSelection: list.length > 1,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const selectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsLoggedIn(true);

    // ✅ Ensure poscd is properly extracted
    const poscd = restaurant.poscd || restaurant.rcode || "";
    const restaurantName = restaurant.Restaurantnm || "";
    const hotelcd = restaurant.hotelcd || "";
    const usercd = restaurant.usercd || "";
    const usernm = restaurant.usernm || "";

    // ✅ PRINT SELECTED RESTAURANT DATA
    console.log("========== SELECTED RESTAURANT ==========");
    console.log("Restaurant full object:", JSON.stringify(restaurant, null, 2));
    console.log("poscd:", poscd);
    console.log("rcode:", restaurant.rcode);
    console.log("hotelcd:", hotelcd);
    console.log("usercd:", usercd);
    console.log("usernm:", usernm);
    console.log("==========================================");

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.POS_CODE, safe(poscd)],
      [STORAGE_KEYS.RESTAURANT_NAME, safe(restaurantName)],
      [STORAGE_KEYS.HOTEL_CODE, safe(hotelcd)],
      [STORAGE_KEYS.USER_CODE, safe(usercd)],
      [STORAGE_KEYS.USER_NAME, safe(usernm)],
    ]);
  };

  const logout = async () => {
    setHotelGroupCode(null);
    setUserData(null);
    setUserType(null);
    setRestaurantList([]);
    setSelectedRestaurant(null);
    setHotelCd(null);
    setIsLoggedIn(false);

    await AsyncStorage.multiRemove([
      STORAGE_KEYS.HOTEL_GROUP_CODE,
      STORAGE_KEYS.USER_DATA,
      STORAGE_KEYS.USER_CODE,
      STORAGE_KEYS.USER_NAME,
      STORAGE_KEYS.RESTAURANT_NAME,
      STORAGE_KEYS.HOTEL_CODE,
    ]);

    await SecureStore.deleteItemAsync("COMPANY_LOGIN_ID");
    await SecureStore.deleteItemAsync("COMPANY_PASSWORD");
  };

  return (
    <AuthContext.Provider
      value={{
        hotelGroupCode,
        userType,
        restaurantList,
        selectedRestaurant,
        userData,
        hotelCd,
        isLoading,
        isLoggedIn,
        groupLogin,
        userLogin,
        selectRestaurant,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
