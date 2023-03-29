type StorageType = "localStorage" | "sessionStorage";

const getStorage = (type: StorageType) => type === "localStorage" ? localStorage : sessionStorage;

class Storage {
  get(key: string, type: StorageType = "localStorage") {
    const storage = getStorage(type)
    return JSON.parse(storage.getItem(key) || "null");
  }

  set(key: string, val: any, type: StorageType = "localStorage") {
    const storage = getStorage(type)
    try {
      const strVal = JSON.stringify(val);
      storage.setItem(key, strVal);
    } catch (e) {
      console.error(`${key} 无法被字符串化`);
    }
  }

  remove(key: string, type: StorageType = "localStorage") {
    const storage = getStorage(type)
    storage.removeItem(key);
  }
}

export default new Storage();
