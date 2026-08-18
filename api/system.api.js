// api/system.api.js
import { callApi } from "./apiClient";

export const groupLogin = async (loginId, password) => {
  const result = await callApi({
    params: {
      type: "GRPLOGIN",
      loginid: loginId,
      psw: password,
    },
  });

  if (!result.success) return result;

  const row = Array.isArray(result.data) ? result.data[0] : null;

  if (!row || !row.hotelgrpcd) {
    return {
      success: false,
      error: "Invalid Login ID or Password",
    };
  }

  return {
    success: true,
    data: {
      hotelgrpcd: row.hotelgrpcd,
      usertype: row.usertype,
    },
  };
};

export const userLogin = async (loginId, password, hotelGroupCode) => {
  const result = await callApi({
    params: {
      type: "USERLOGIN",
      loginid: loginId,
      psw: password,
      hgrpcd: hotelGroupCode,
    },
  });

  if (!result.success) return result;

  if (!Array.isArray(result.data) || result.data.length === 0) {
    return {
      success: false,
      error: "Invalid Login ID or Password",
    };
  }

  return {
    success: true,
    data: result.data,
  };
};

export const getTableList = async (groupCode, restCode) => {
  return callApi({
    params: {
      type: "TABLES",
      hgrpcd: groupCode,
      restcd: restCode,
    },
  });
};

export const updateTableStatus = async (tableNo, status, groupCode) => {
  return callApi({
    params: {
      type: "UPDATESTATUS",
      tableno: tableNo,
      status: status,
      hgrpcd: groupCode,
    },
  });
};

export const getMenuWithRate = async (posCd) => {
  return callApi({
    params: {
      type: "MENUWITHRATE",
      poscd: posCd,
    },
  });
};

export const saveKOT = async ({
  poscd,
  tablcd,
  pax,
  waitercd,
  guestcd = "",
  menudtl = [],
}) => {
  const menudtlString = menudtl
    .map((item) => {
      const baryn = item.baryn || "N";
      const pegdtl = item.pegdtl || "";
      const infoforkot = item.infoforkot || "";
      return `${item.menucode},${item.qty},${item.rate},${baryn},${pegdtl},${infoforkot}`;
    })
    .join("||");

  return callApi({
    params: {
      type: "KOTADD",
      poscd,
      tablcd,
      pax,
      waitercd,
      guestcd,
      menudtl: menudtlString,
    },
  });
};

export const getDashboardTables = async (posCd, userCd) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "restdash.php",
    params: {
      type: "DASHBOARD",
      poscd: posCd,
      usercd: userCd,
    },
  });
};

export const getGuestDetails = async (
  mobileNo,
  guestName,
  dob,
  doa,
  hotelCd,
) => {
  return callApi({
    params: {
      type: "GETGUESTDET",
      mobileno: mobileNo,
      guestname: guestName,
      dob: dob,
      doa: doa,
      hotelcd: hotelCd || "",
    },
  });
};

export const getPOSList = async (hotelCode, userCd) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "poslist.php",
    params: {
      hotcd: hotelCode,
      poscd: "0",
      usercd: userCd,
    },
  });
};

export const createReservation = async (reservationData) => {
  return callApi({
    method: "POST",
    params: {
      type: "RESERVATION",
      ...reservationData,
    },
  });
};

export const generateBill = async (tableNo, groupCode) => {
  return callApi({
    params: {
      type: "BILL",
      tableno: tableNo,
      hgrpcd: groupCode,
    },
  });
};
