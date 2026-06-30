browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.rovid !== 'rovalra-setsession') {
        return false;
    }

    return handleAccess(message, sender);
});

browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.rovid !== 'rovalra-getsession') {
        return false;
    }

    return handleAccess(message, sender);
});

browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.rovid !== 'rovalra-rmsession') {
        return false;
    }

    return handleAccess(message, sender);
});

async function handleAccess(message: any, sender: browser.runtime.MessageSender) {
    try {
        // ...

        return void 0;
    } catch (e) {
        console.error(`Background/Sub/Store/Session/handleAccess: Unknown error type`, e);
        throw e;
    }
}