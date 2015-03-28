'use strict';

/*
 * Wraps calls to an asynchronous storage API so that it can keep track of the list of keys set
 */

/**
 * @param {Object} Storage a wrapper to an asynchronous storage API
 * @property {function(key: String): Object} Storage.get
 * @property {function(key: String, value: Object)} Storage.set
 * @property {function(key: String)} Storage.remove
 * @param {function(Error)} callback called after finished setting up AsyncStorageWrapper
 */
function AsyncStorageWrapper(Storage, callback) {
  if (typeof(Storage) === 'undefined' || Storage === null) {
    throw new TypeError('Storage is either not defined or null');
  }

  if (typeof(Storage.get) !== 'function' || 
      typeof(Storage.set) !== 'function' || 
      typeof(Storage.remove) !== 'function') {

    throw new TypeError('Storage is not property defined (it needs to have get, set, and remove functions)');
  }

  var that = this;

  this.Storage = Storage;

  this.Storage.get('async-storage-keys').then(function(storageKeys) {
    if (typeof(storageKeys) === 'undefined' || storageKeys === null) {
      that.Storage.set('async-storage-keys', {}).then(function() {
        callback(null, {});
      });
    } else {
      callback(null, storageKeys);
    }
  }).catch(function(e) {
    callback(e);
  });
}

/**
 * Returns the value corresponding to the key in chrome storage
 * @param {string} key
 * @return {Promise(Object)} value corresponding to the key
 */
AsyncStorageWrapper.prototype.getItem = function(key) {
  return this.Storage.get(key);
};


/**
 * Sets the item in chome storage and if item is not already in the list of keys, adds it to the list 
 * @paaram {string} key the key of the item to set
 * @param {Object} value the value of the key
 */
AsyncStorageWrapper.prototype.setItem = function(key, value) {
  var that = this;

  return this.Storage.set(key, value).then(function() {
    return that.Storage.get('async-storage-keys');
  }).then(function(storageKeys) {
    // if key is not inside storage keys dictionary, then add it to the dictionary
    if (typeof(storageKeys[key]) === 'undefined' || storageKeys[key] !== true) {
      storageKeys[key] = true;
      return that.Storage.set('async-storage-keys', storageKeys);
    } else {
      return Promise.resolve();
    }
  }).catch(function(e) {
    console.log(e);
    throw e;
  });
};

/**
 * Removes the item in chrome storage and if item is in the list of keys it removes from the list
 * @param {string} key the key of the object to remove
 */
AsyncStorageWrapper.prototype.removeItem = function(key) {
  var that = this;

  return this.Storage.remove(key).then(function() {
    return that.Storage.get('async-storage-keys');
  }).then(function(storageKeys) {
    // if key is inside storage keys dictionary, then set the key to null
    if (typeof(storageKeys[key]) !== 'undefined' && storageKeys[key] !== null) {
      storageKeys[key] = null;
      return that.Storage.set('async-storage-keys', storageKeys);
    } else {
      return Promise.resolve();
    }
  }).catch(function(e) {
    console.log(e);
    throw e;
  });
};

export default AsyncStorageWrapper;
