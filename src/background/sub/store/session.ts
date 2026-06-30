browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.rovid !== 'rovalra-setsession') {
        return false;
    }

    return handleAccess(browser.storage.session.set(message.keys));
});

browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.rovid !== 'rovalra-getsession') {
        return false;
    }

    return handleAccess(browser.storage.session.get(message.keys));
});

browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.rovid !== 'rovalra-rmsession') {
        return false;
    }

    return handleAccess(browser.storage.session.remove(message.keys));
});

async function handleAccess(fn: Promise<unknown>) {
    try {
        return await fn;
    } catch (e) {
        console.error(`Background/Sub/Store/Session/handleAccess: Unknown error type`, e);
        throw e;
    }
}