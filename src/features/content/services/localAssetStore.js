const DATABASE_NAME = "sketchtale.content.assets.v1";
const STORE_NAME = "asset-blobs";
const memoryStore = new Map();
const objectUrls = new Map();

function namespaceFromSession() {
  try {
    const session = JSON.parse(localStorage.getItem("sketchtale.session.v1") || "null");
    return session?.userId || "anonymous";
  } catch {
    return "anonymous";
  }
}

function keyFor(namespace, assetId) {
  return `${namespace}:${assetId}`;
}

function openDatabase() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("namespace", "namespace", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Không thể mở kho asset local."));
  });
}

function transaction(database, mode, callback) {
  return new Promise((resolve, reject) => {
    const request = callback(database.transaction(STORE_NAME, mode).objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Không thể đọc kho asset local."));
  });
}

export function getLocalAssetNamespace() {
  return namespaceFromSession();
}

export async function putLocalAsset(assetId, blob, namespace = namespaceFromSession()) {
  if (!assetId || !blob) throw new Error("Asset local cần có ID và file.");
  const record = { key: keyFor(namespace, assetId), namespace, assetId, blob, updatedAt: Date.now() };
  const database = await openDatabase();
  if (!database) {
    memoryStore.set(record.key, record);
    return record;
  }
  await transaction(database, "readwrite", (store) => store.put(record));
  database.close();
  return record;
}

export async function getLocalAsset(assetId, namespace = namespaceFromSession()) {
  const key = keyFor(namespace, assetId);
  const database = await openDatabase();
  if (!database) return memoryStore.get(key) || null;
  const record = await transaction(database, "readonly", (store) => store.get(key));
  database.close();
  return record || null;
}

export async function removeLocalAsset(assetId, namespace = namespaceFromSession()) {
  const key = keyFor(namespace, assetId);
  releaseObjectUrl(key);
  const database = await openDatabase();
  if (!database) {
    memoryStore.delete(key);
    return;
  }
  await transaction(database, "readwrite", (store) => store.delete(key));
  database.close();
}

export async function clearLocalAssets(namespace = namespaceFromSession()) {
  const database = await openDatabase();
  if (!database) {
    [...memoryStore.keys()].filter((key) => key.startsWith(`${namespace}:`)).forEach((key) => memoryStore.delete(key));
    [...objectUrls.keys()].filter((key) => key.startsWith(`${namespace}:`)).forEach(releaseObjectUrl);
    return;
  }
  const records = await new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).index("namespace").getAll(namespace);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error("Không thể đọc kho asset local."));
  });
  for (const record of records) await transaction(database, "readwrite", (store) => store.delete(record.key));
  database.close();
  [...objectUrls.keys()].filter((key) => key.startsWith(`${namespace}:`)).forEach(releaseObjectUrl);
}

function releaseObjectUrl(key) {
  const url = objectUrls.get(key);
  if (url && typeof URL !== "undefined" && URL.revokeObjectURL) URL.revokeObjectURL(url);
  objectUrls.delete(key);
}

export async function localAssetUrl(assetId, namespace = namespaceFromSession()) {
  const record = await getLocalAsset(assetId, namespace);
  if (!record?.blob) return "";
  const key = keyFor(namespace, assetId);
  if (!objectUrls.has(key)) objectUrls.set(key, URL.createObjectURL(record.blob));
  return objectUrls.get(key);
}
