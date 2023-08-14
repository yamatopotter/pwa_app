const dbPromise = idb.open("post-store", 1, (db) => {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }

  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "id" });
  }
});

const writeData = (st, data) => {
  return dbPromise.then((db) => {
    const tx = db.transaction(st, "readwrite");
    const store = tx.objectStore(st);
    store.put(data);
    return tx.complete;
  });
};

const readAllData = (st) => {
  return dbPromise.then((db) => {
    const tx = db.transaction(st, "readonly");
    const store = tx.objectStore(st);
    return store.getAll();
  });
};

const clearAllData = (st) => {
  return dbPromise.then((db) => {
    const tx = db.transaction(st, "readwrite");
    const store = tx.objectStore(st);
    store.clear();
    return tx.complete;
  });
};

const deleteItemFromData = (st, id) => {
  dbPromise
    .then((db) => {
      const tx = db.transaction(st, "readwrite");
      const store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then(() => console.log("Item deleted."));
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length);

  for (let i =0; i<rawData.length; i++){
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};
