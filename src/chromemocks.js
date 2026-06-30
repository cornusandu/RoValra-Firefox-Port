// TODO: Fix firefox blocking api requests to api.rovalra.com (move fetch() requests into background.js)

// MOCKS
const ISDEBUG = false;

console.info("Setting up chrome api mocks");

class ValidationError extends Error {};

function proxifyChrome(obj, path = []) {
    return new Proxy(obj, {
        get(target, prop) {
            if (prop in target) {
                const value = target[prop];
                return (typeof value === "object" && value !== null) ? proxifyChrome(value, [...path, prop]) : value;
            }

            if (prop === "then") return undefined;

            // unknown property -> return callable proxy
            const fullPath = [...path, prop].join(".");
            console.error(`Missing Chrome API: chrome.${fullPath}`, {
                path,
                prop,
                target
            });
            return undefined;
        },

        apply(target, thisArg, args) {
            const api = path.join(".");
            console.error(`COMPAT MISSING API: chrome.${api}`, args);
            return undefined;
        }
  });
}

function tocallback(promise, callback, mapResult = (x) => x) {
    if (typeof callback === "function") {
        promise.then(
            (result) => callback(mapResult(result)),
            (error) => {
                console.error("Chrome compat wrapper async error:", error);
                callback();
            }
        );
    } else {
        if (callback !== undefined) {
            err = new ValidationError("Chrome Mocks: tocallback(callback): Failed to meet expected type.")
            console.error(ValidationError, { 'type': typeof callback });
        }
    }
    return promise;
}

globalThis.chrome = proxifyChrome({
    runtime: {
        sendMessage: async function sendMessage(data, callback) {
            if (ISDEBUG)
                console.debug(`globalThis.chrome.runtime.sendMessage call with data=\`${data}\``);
            const response = await browser.runtime.sendMessage(data);
            if (typeof callback === "function") {
                callback(response);
            }
            return response;
        },
        /**
         * 
         * @param {string} path 
         * @returns {string}
         */
        getURL: function chromeGetUrl(path) {
            if (typeof path !== typeof "s") {
                console.warn(`globalThis.chrome.runtime.getURL recieved non-string path: \`${String(path)}\`. Converting manually to string.`);
                path = String(path);
            }

            return browser.runtime.getURL(path);
        },
        onMessage: {
            addListener: function onMessageAddListener(callback) {
                if (typeof callback !== "function") {
                    console.error("Invalid globalThis.chrome.onMessage.addListener callback", callback, new Error().stack);
                    return;
                }

                browser.runtime.onMessage.addListener((message, sender) => {
                    return new Promise((resolve) => {
                        const result = callback(message, sender, resolve);
                    
                        // Only resolve immediately if something was returned
                        if (result !== true && result !== undefined) {
                            resolve(result);
                        }
                        // else: wait for sendResponse (resolve) to be called
                    });
                });
            }
        },
        onInstalled: {
            addListener: function onInstallAddListener(callback) {
                const result = browser.runtime.onInstalled.addListener((reason) => {
                    let r = reason;
                    Object.assign(r, {
                        'temporary': false
                    });
                    callback(r);
                });
                return result;
            }
        },
        onStartup: {
            /**
             * @param {() => void} callback 
             */
            addListener: function onStartupAddListener(callback) {
                browser.runtime.onStartup.addListener(callback);
            }
        },
        /**
         * @returns {object}
         */
        getManifest: function getManifest() {
            return browser.runtime.getManifest();
        },
        get lastError() {
            return browser.runtime.lastError !== null ? browser.runtime.lastError : undefined;
        }
    },
    storage: {
        local: {
            set: async function set(data, cb) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.set call with data=\`${data}\``);
                return tocallback(browser.storage.local.set(data), cb, () => undefined);
            },
            get: async function get(keys, cb) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.get call with data=\`${keys}\``);
                return tocallback(browser.storage.local.get(keys), cb);
            },
            /**
             * @param {string | string[]} keys
             * @param {() => void} cb
             * @returns {Promise<void | null>}
             */
            remove: async function remove(keys, cb) {
                return tocallback(browser.storage.local.remove(keys), cb, () => undefined);
            },
            onChanged: {
                addListener: function addLocalChangedListener(listener) {
                    browser.storage.local.onChanged.addListener(listener);
                }
            }
        },
        session: {
            set: async function set(data, cb) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.set call with data=\`${data}\``);
                return tocallback(browser.storage.session.set(data), cb, () => undefined);
            },
            get: async function get(keys, cb) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.get call with data=\`${keys}\``);
                return tocallback(browser.storage.session.get(keys), cb);
            },
            /**
             * @param {string} accessLevel 
             * @returns {Promise<void | null>}
             */
            setAccessLevel: async function setAccessLevel(accessLevel, cb) {
                console.warn(`Firefox does not support browser.storage.<area>.setAccessLevel`);
                return;
                
                if (typeof browser.storage.session.setAccessLevel === "function" || browser.storage.session.setAccessLevel === undefined) {
                    if (!browser?.storage?.session?.setAccessLevel)
                        console.error(`browser?.storage?.session?.setAccessLevel = ${browser?.storage?.session?.setAccessLevel}`);
                    return tocallback(browser.storage.session.setAccessLevel(accessLevel.accessLevel), cb, () => undefined);
                } else {
                    console.debug("chromemocks.js: environment does not support storage.session.setAccessLevel");
                    return tocallback(new Promise((r) => r()), cb, () => undefined);
                }
            }
        },
        sync: {
            set: async function set(data, cb) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.set call with data=\`${data}\``);
                return tocallback(browser.storage.sync.set(data), cb, () => undefined);
            },
            get: async function get(keys, cb) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.get call with data=\`${keys}\``);
                return tocallback(browser.storage.sync.get(keys), cb);
            }
        },
        onChanged: {
            addListener: function addOnChangeListener(listener) {
                browser.storage.onChanged.addListener(listener);
            }
        }
    },
    permissions: {
        onAdded: {
            /**
             * @param {(Permissions) => void} callback 
             * @returns {void}
             */
            addListener: function addOnAddedListener(callback) {
                // full compatibility with chrome, see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions/onAdded
                return browser.permissions.onAdded.addListener(callback);
            }
        },
        onRemoved: {
            /**
             * @param {(Permissions) => void} callback 
             * @returns {void}
             */
            addListener: function addOnRemovedListener(callback) {
                // full compatibility with chrome, see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions/onRemoved
                return browser.permissions.onRemoved.addListener(callback);
            }
        },
        /**
         * @param {Permissions} permissions 
         * @returns 
         */
        contains: function permissionsContains(permissions, cb) {
            // full compatibility with chrome, see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/permissions/contains
            return tocallback(browser.permissions.contains(permissions), cb);
        }
    },
    declarativeNetRequest: {
        /**
         * @param {UpdateRuleOptions} options
         * @param {((...any) => void)?} cb
         * @returns {Promise<void>}
         */
        updateDynamicRules: function updateDynamicRules(options, cb) {
            return tocallback(browser.declarativeNetRequest.updateDynamicRules(options), cb);
        }
    },
    webRequest: browser.webRequest !== undefined ? {} : undefined,
    tabs: {
        query: function queryTabs(queryOptions, cb) {
            return tocallback(browser.tabs.query(queryOptions), cb);
        }
    }
});
