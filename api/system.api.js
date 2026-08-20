// api/system.api.js

import { callApi } from "./apiClient";

// ---------- AUTH ----------
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

// ---------- TABLE ----------
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

// ---------- MENU ----------
export const getMenuWithRate = async (posCd) => {
  return callApi({
    params: {
      type: "MENUWITHRATE",
      poscd: posCd,
    },
  });
};

// ---------- KOT ----------
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

// ---------- DASHBOARD ----------
export const getDashboardTables = async (posCd, userCd) => {
  const result = await callApi({
    host: "RESTCLOUD_WS",
    endpoint: "restdash.php",
    params: {
      type: "DASHBOARD",
      poscd: posCd,
      usercd: userCd,
    },
  });

  if (
    result.success &&
    typeof result.data === "string" &&
    result.data.includes("insert into")
  ) {
    console.warn("API returned SQL instead of JSON. Attempting to parse...");
    return {
      success: false,
      error: "API returned SQL instead of JSON. Please check backend API.",
      rawData: result.data,
    };
  }

  if (result.success && Array.isArray(result.data)) {
    return result;
  }

  return {
    success: false,
    error: "Invalid data format from API",
    rawData: result.data,
  };
};

// ---------- GUEST ----------
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
      hotelcd: hotelCd,
    },
  });
};

// ---------- POS ----------
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

// ---------- RESERVATION ----------
export const createReservation = async (reservationData) => {
  return callApi({
    method: "POST",
    params: {
      type: "RESERVATION",
      ...reservationData,
    },
  });
};

// ---------- BILL ----------
export const generateBill = async (tableNo, groupCode) => {
  return callApi({
    params: {
      type: "BILL",
      tableno: tableNo,
      hgrpcd: groupCode,
    },
  });
};

/**
 * Fetch previously ordered items for an occupied table
 * Used in: "Current Items" popup
 */
export const getCurrentItems = async (posCd, tableCd) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "showbillsdtl_t.php",
    params: {
      poscd: posCd,
      tablcd: tableCd,
    },
  });
};

/**
 * Save final bill (Make Bill action)
 * Used in: GenerateBillPopup
 */
export const saveBill = async ({
  poscd,
  tablcd,
  billnarr = "-",
  mobno = "0",
  fdiscper = 0,
  fdiscamt = 0,
  bdiscper = 0,
  bdiscamt = 0,
  cntbltype = "",
  discgiventocd = "",
  partybookintno = 0,
  partybookadvamt = 0,
  usercd,
  packchg = "",
  couponcd = "",
  couponno = "",
}) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "restbillsav_t.php",
    params: {
      poscd,
      tablcd,
      billnarr,
      mobno,
      fdiscper,
      fdiscamt,
      bdiscper,
      bdiscamt,
      cntbltype,
      discgiventocd,
      partybookintno,
      partybookadvamt,
      usercd,
      packchg,
      couponcd,
      couponno,
    },
  });
};

// ---------- RECEIVE PAYMENT (SETTLE BILL) ----------
export const receivePayment = async ({
  fbillcd, // Bill ID (from saveBill response)
  tipsamt = 0, // Tip amount
  amt1 = 0, // Amount paid (mode1)
  amt2 = 0, // Amount paid (mode2) - if split payment
  amt3 = 0, // Amount paid (mode3) - if split payment
  mode1 = "C", // Payment mode 1 (CASH, CARD, UPI, ZOMATO, etc.)
  mode2 = "", // Payment mode 2 (if split)
  mode3 = "", // Payment mode 3 (if split)
  tranno = "", // Transaction number (UPI/Card reference)
  cardbank = "", // Bank name (for cards)
  cardno = "", // Card last 4 digits
  acheadcd = "", // Account head code
  roomcd = "", // Room number (for Room Service)
}) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "rcptupdt.php",
    params: {
      fbillcd,
      tipsamt,
      amt1,
      amt2,
      amt3,
      mode1,
      mode2,
      mode3,
      tranno,
      cardbank,
      cardno,
      acheadcd,
      roomcd,
    },
  });
};

// ---------- BILL REGISTER (REPORT) ----------
export const getBillRegister = async (posCd, fromDt, toDt, rmServYn = "N") => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "restbillreg.php",
    params: {
      poscd: posCd,
      fromdt: fromDt,
      todt: toDt,
      rmservyn: rmServYn,
    },
  });
};

// ---------- PAYMENT SUMMARY (Mode of Pay vs Total Amount) ----------
export const getPayModeSummary = async (
  posCd,
  fromDt,
  toDt,
  rmServYn = "N",
) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "paymodesumm.php",
    params: {
      poscd: posCd,
      frdate: fromDt,
      todate: toDt,
      rmservyn: rmServYn,
    },
  });
};

// ---------- TABLE TRANSFER ----------
export const transferTable = async (fromTableCd, toTableCd) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "tabletrf.php",
    params: {
      ftablcd: fromTableCd,
      ttablcd: toTableCd,
    },
  });
};

// ---------- BILL CANCELLATION ----------
export const cancelBill = async ({
  fbillcd = "",
  bbillcd = "",
  usercd,
  usernm = "Admin",
  reason = "",
  fromeb = "",
}) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "billcancel.php",
    params: {
      apipass: "7765",
      fbillcd,
      bbillcd,
      usercd,
      usernm,
      reason,
      fromeb,
    },
  });
};

// ---------- PREVIOUS KOT LIST ----------
export const getPreviousKOTs = async (tableCd) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "prevkotlist.php",
    params: {
      tablcd: tableCd,
    },
  });
};

// ---------- KOT CANCELLATION ----------
export const cancelKOT = async ({
  kotcd,
  tblcd,
  cancreason = "",
  waitercd = "",
}) => {
  console.log("[API] cancelKOT called with:", {
    kotcd,
    tblcd,
    cancreason,
    waitercd,
  });
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "kotcanc.php",
    params: {
      kotcd,
      tblcd,
      cancreason,
      waitercd,
    },
  });
};

// ---------- KOT TRANSFER ----------
export const transferKOT = async ({ kotcode, ttablcd }) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "kottrf.php",
    params: {
      kotcode,
      ttablcd,
    },
  });
};

// ---------- KOT PRINT DETAILS ----------
export const getKOTPrintDetails = async (posCd, kotCd) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "showkotdet.php",
    params: {
      poscd: posCd,
      kotcd: kotCd,
    },
  });
};

// ---------- KOT MENU ITEM CANCELLATION ----------
export const cancelKOTItem = async ({
  code,
  cancreason = "",
  waitercd = "",
}) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "kotmenucanc.php",
    params: {
      code,
      cancreason,
      waitercd,
    },
  });
};

// ---------- BILL PRINT DETAILS ----------
export const getBillPrintDetails = async (posCd, fbillCd) => {
  return callApi({
    host: "RESTCLOUD_WS",
    endpoint: "restbilldatanew1.php",
    params: {
      poscd: posCd,
      fbillcd: fbillCd,
    },
  });
};
