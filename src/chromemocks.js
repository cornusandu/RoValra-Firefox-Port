// MOCKS
const ISDEBUG = false;

console.info("Setting up chrome api mocks");

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
            console.error(`Proxy fallback GET: chrome.${fullPath}`, {
                path,
                prop,
                target
            });
            return proxifyChrome(function () {}, [...path, prop]);
        },

        apply(target, thisArg, args) {
            const api = path.join(".");
            console.error(`Missing Chrome API: chrome.${api}`, args);
            return undefined;
        }
  });
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
        }
    },
    storage: {
        local: {
            set: async function set(data) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.set call with data=\`${data}\``);
                await browser.storage.local.set(data);
            },
            get: async function get(keys) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.get call with data=\`${keys}\``);
                return await browser.storage.local.get(keys);
            },
            /**
             * @param {string | string[]} keys 
             * @returns {Promise<void | null>}
             */
            remove: async function remove(keys) {
                return await browser.storage.local.remove(keys);
            }
        },
        session: {
            set: async function set(data) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.set call with data=\`${data}\``);
                await browser.storage.session.set(data);
            },
            get: async function get(keys) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.get call with data=\`${keys}\``);
                return await browser.storage.session.get(keys);
            },
            /**
             * @param {string} accessLevel 
             * @returns {Promise<void | null>}
             */
            setAccessLevel: async function setAccessLevel(accessLevel) {
                return await browser.storage.session.setAccessLevel(accessLevel);
            }
        },
        sync: {
            set: async function set(data) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.set call with data=\`${data}\``);
                await browser.storage.sync.set(data);
            },
            get: async function get(keys) {
                if (ISDEBUG)
                    console.debug(`globalThis.storage.local.get call with data=\`${keys}\``);
                return await browser.storage.sync.get(keys);
            }
        },
        onChanged: {
            addListener: function addOnChangeListener(listener) {
                browser.storage.onChanged.addListener(listener);
            }
        }
    }
});
