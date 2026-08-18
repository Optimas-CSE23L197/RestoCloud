// constants/tableStatus.js
export const TABLE_STATUS = {
  OCCUPIED: "occupied",
  BILLED: "billed",
  RESERVED: "reserved",
  VACANT: "vacant",
};

export const STATUS_CONFIG = {
  [TABLE_STATUS.OCCUPIED]: {
    label: "Occupied",
    accent: "#DC2626", // red-600
    accentSoft: "#FEE2E2", // red-100
    badgeText: "#FFFFFF",
    textColor: "#DC2626",
  },
  [TABLE_STATUS.BILLED]: {
    label: "Billed",
    accent: "#374151", // gray-700
    accentSoft: "#F3F4F6",
    badgeText: "#FFFFFF",
    textColor: "#374151",
  },
  [TABLE_STATUS.RESERVED]: {
    label: "Reserved",
    accent: "#2563EB", // blue-600
    accentSoft: "#DBEAFE",
    badgeText: "#FFFFFF",
    textColor: "#2563EB",
  },
  [TABLE_STATUS.VACANT]: {
    label: "Vacant",
    accent: "#16A34A", // green-600
    accentSoft: "#DCFCE7",
    badgeText: "#FFFFFF",
    textColor: "#16A34A",
  },
};

export const getStatusConfig = (status) =>
  STATUS_CONFIG[status] ?? STATUS_CONFIG[TABLE_STATUS.VACANT];
