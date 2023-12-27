/**
 * 打开/创建数据库
 * @param {object} dbName 数据库的名字
 * @param {string} storeName 仓库名称
 * @param {string} version 数据库的版本
 * @param {string} keyPath 主键键值，不传就自动创建主键
 * @param {Array} index 索引数组
 * @return {object} 该函数会返回一个数据库实例
 */
const openDB = function (dbName, version, storeName, keyPath, index) {
  return new Promise((resolve, reject) => {
    //  兼容浏览器
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { webkitIndexedDB, indexedDB, mozIndexedDB, msIndexedDB } = window;
    const indexDB = indexedDB || mozIndexedDB || webkitIndexedDB || msIndexedDB;
    let db = null;
    const request = indexDB.open(dbName, version);
    // 操作成功
    request.onsuccess = function (event) {
      db = event?.target?.result; // 数据库对象
      resolve({
        code: 0,
        success: true,
        data: db,
        msg: "数据库打开成功!",
      });
    };
    // 操作失败
    request.onerror = function () {
      resolve({
        code: -1,
        success: false,
        data: null,
        msg: "数据库打开失败!",
      });
    };
    // 创建表和索引
    request.onupgradeneeded = function (event) {
      // 数据库创建或升级的时候会触发
      db = event?.target?.result; // 数据库对象
      const storeOptions = {
        autoIncrement: true,
      };
      if (keyPath && keyPath !== "") {
        storeOptions.autoIncrement = false;
        storeOptions.keyPath = keyPath;
      }
      // 创建表
      if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, storeOptions);
        // 创建索引
        // indexName索引列名称
        // indexKey索引键值
        if (index && index.length > 0) {
          index.forEach((item) => {
            if (
              !item.indexName ||
              !item.indexKey ||
              item.options.unique === undefined
            ) {
              reject(
                "索引格式错误，请参照格式{indexName:'indexName',indexKey:'indexKey',{unique: false}}"
              );
            }
            store.createIndex(item.indexName, item.indexKey, item.options);
          });
        }
      }
    };
  });
};

/**
 * 新增数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {object} dataConfig 添加的数据集合
 **/
const addData = function (db, storeName, dataConfig) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("数据库不存在或没有初始化");
    }
    if (!dataConfig) {
      reject("value是必传项，参照格式{[keyPath]:'key',value:'value'}");
    }
    const req = db
      .transaction([storeName], "readwrite")
      .objectStore(storeName) // 仓库对象
      .add(dataConfig);
    // 操作成功
    req.onsuccess = function () {
      resolve({
        code: 0,
        success: true,
        data: null,
        msg: "数据写入成功!",
      });
    };
    // 操作失败
    req.onerror = function () {
      const data = {
        code: -1,
        success: false,
        data: null,
        msg: "数据写入失败!",
      };
      resolve(data);
    };
  });
};

/**
 * 更新数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {object} dataConfig 更新的数据集合
 */
const updateData = function (db, storeName, dataConfig) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("数据库不存在或没有初始化");
    }
    if (!dataConfig) {
      reject("更新的数据集合不能为空");
    }
    const req = db
      .transaction([storeName], "readwrite")
      .objectStore(storeName)
      .put(dataConfig);
    // 操作成功
    req.onsuccess = function () {
      resolve({
        code: 0,
        success: true,
        data: null,
        msg: "数据更新成功!",
      });
    };
    // 操作失败
    req.onerror = function () {
      const data = {
        code: -1,
        success: false,
        data: null,
        msg: "数据更新失败!",
      };
      resolve(data);
    };
  });
};

/**
 * 查询数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} key 数据主键
 **/
const getData = function (db, storeName, key) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("数据库不存在或没有初始化");
    }
    let objectStore = db.transaction(storeName).objectStore(storeName);
    if (key) {
      // 获取指定键值的数据
      let request = objectStore.get(key);
      request.onerror = function () {
        const data = {
          code: -1,
          success: false,
          data: null,
          msg: "数据获取失败!",
        };
        resolve(data);
      };
      request.onsuccess = function (event) {
        resolve({
          code: 0,
          success: true,
          data: event.target.result,
          msg: "数据获取成功!",
        });
      };
    } else {
      // 获取所有数据
      let request = objectStore.getAll();
      request.onerror = function () {
        const data = {
          code: -1,
          success: false,
          data: null,
          msg: "数据获取失败!",
        };
        resolve(data);
      };
      request.onsuccess = function (event) {
        resolve({
          code: 0,
          success: true,
          data: event.target.result,
          msg: "数据获取成功!",
        });
      };
    }
  });
};

/**
 * 删除数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} key 数据主键
 **/
const deleteData = function (db, storeName, key) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("数据库不存在或没有初始化");
    }
    const req = db
      .transaction([storeName], "readwrite")
      .objectStore(storeName) // 仓库对象
      .delete(key);
    // 操作成功
    req.onsuccess = function (e) {
      resolve({
        code: 0,
        success: true,
        data: e.target.result,
        msg: "数据删除成功!",
      });
    };
    // 操作失败
    req.onerror = function () {
      const data = {
        code: -1,
        success: false,
        data: null,
        msg: "数据删除失败!",
      };
      resolve(data);
    };
  });
};

/**
 * 使用游标查询数据
 * @param {object} db 数据库实例
 * @param {string} storeName 仓库名称
 * @param {string} indexKey 查询的索引的键值
 * @param {string} index 查询的索引值
 **/
const getIndexData = function (db, storeName, indexKey, index) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("数据库不存在或没有初始化");
    }
    const keyRange = IDBKeyRange.only(index);
    const req = db
      .transaction([storeName], "readonly")
      .objectStore(storeName) // 仓库对象
      .index(indexKey)
      .openCursor(keyRange, "next");
    // 操作成功
    req.onsuccess = function (e) {
      resolve({
        code: 0,
        success: true,
        data: e.target.result,
        msg: "数据查询成功!",
      });
    };
    // 操作失败
    req.onerror = function () {
      const data = {
        code: -1,
        success: false,
        data: null,
        msg: "数据查询失败!",
      };
      resolve(data);
    };
  });
};
