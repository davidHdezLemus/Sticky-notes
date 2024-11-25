import { INDEXDB_NAME, INDEXDB_VERSION, STORE_NAME } from "./constants.js";

// Singleton Pattern: One instance for the entire project
export class DatabaseManager {

  constructor(databaseName, databaseVersion) {
    this.databaseName = databaseName;
    this.databaseVersion = databaseVersion;
    this.db = null;
  }

  // Static method to ensure only one instance of the class is created
  static getInstance() {
    if (!this.instance) {
      this.instance = new DatabaseManager(INDEXDB_NAME, INDEXDB_VERSION);
    }
    return this.instance;
  }

  // Open the IndexedDB database
  open() {
    return new Promise((resolve, reject) => {
      // Open the database with the specified name and version
      let request = indexedDB.open(this.databaseName, this.databaseVersion);

      // Handle successful database opening
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      // Handle errors during database opening
      request.onerror = (event) => {
        reject(event.target.error);
      };

      // Handle database upgrades (if needed)
      request.onupgradeneeded = (event) => {
        let db = event.target.result;
        // Create an object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  // Add data to the object store
  createData(data) {
    if (!this.db) {
      throw new Error("The database is not open.");
    }

    return new Promise((resolve, reject) => {
      // Create a readwrite transaction
      let transaction = this.db.transaction([STORE_NAME], "readwrite");
      let objectStore = transaction.objectStore(STORE_NAME);
      // Add data to the object store
      let request = objectStore.add(data);
      // Handle successful data addition
      request.onsuccess = (event) => {
        resolve(event.target.result); // Return the generated ID
      };
      // Handle errors during data addition
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // Get data from the object store by ID
  readData(id) {
    if (!this.db) {
      throw new Error("The database is not open.");
    }

    return new Promise((resolve, reject) => {
      // Create a readonly transaction
      let transaction = this.db.transaction([STORE_NAME], "readonly");
      let objectStore = transaction.objectStore(STORE_NAME);
      // Get data by ID
      let request = objectStore.get(id);
      // Handle successful data retrieval
      request.onsuccess = (event) => {
        let data = event.target.result;
        if (data) {
          resolve(data);
        } else {
          reject(new Error("The object with id: " + id + ", was not found in the database."));
        }
      };
      // Handle errors during data retrieval
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // Get all data from the object store
  readAllData() {
    if (!this.db) {
      throw new Error("The database is not open.");
    }

    return new Promise((resolve, reject) => {
      // Create a readonly transaction
      let transaction = this.db.transaction([STORE_NAME], "readonly");
      let objectStore = transaction.objectStore(STORE_NAME);
      // Get all data from the object store
      let request = objectStore.getAll();
      // Handle successful data retrieval
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      // Handle errors during data retrieval
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // Update data in the object store
  updateData(id, newData) {
    if (!this.db) {
      throw new Error("The database is not open.");
    }

    return new Promise((resolve, reject) => {
      // Create a readwrite transaction
      let transaction = this.db.transaction([STORE_NAME], "readwrite");
      let objectStore = transaction.objectStore(STORE_NAME);
      // Get the existing data by ID
      let request = objectStore.get(id);

      request.onsuccess = (event) => {
        let data = event.target.result;
        if (data) {
          // Update the data with new values
          let updatedData = { ...data, ...newData };
          // Put the updated data back into the object store
          request = objectStore.put(updatedData);
          request.onsuccess = (event) => {
            resolve();
          }
          request.onerror = (event) => {
            reject(event.target.error);
          };
        } else {
          reject(new Error("The object with id: " + id + ", was not found in the database."));
        }
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  // Delete data from the object store by ID
  deleteData(id) {
    if (!this.db) {
      throw new Error("The database is not open.");
    }

    return new Promise((resolve, reject) => {
      // Create a readwrite transaction
      let transaction = this.db.transaction([STORE_NAME], "readwrite");
      let objectStore = transaction.objectStore(STORE_NAME);
      // Delete data by ID
      let request = objectStore.delete(id);
      // Handle successful data deletion
      request.onsuccess = (event) => {
        resolve();
      };
      // Handle errors during data deletion
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }
}
