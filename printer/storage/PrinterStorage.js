import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "printer_config_v1";

class PrinterStorage {
  async getAll() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return {
          kitchen: null,
          bar: null,
          cashier: null,
        };
      }

      return JSON.parse(raw);
    } catch (error) {
      console.error("[PrinterStorage] getAll:", error);

      return {
        kitchen: null,
        bar: null,
        cashier: null,
      };
    }
  }

  async saveAll(config) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    return config;
  }

  async getRole(role) {
    const config = await this.getAll();
    return config[role] || null;
  }

  async saveRole(role, printer) {
    const config = await this.getAll();

    config[role] = printer;

    await this.saveAll(config);

    return printer;
  }

  async removeRole(role) {
    const config = await this.getAll();

    config[role] = null;

    await this.saveAll(config);
  }

  async clear() {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export default new PrinterStorage();
