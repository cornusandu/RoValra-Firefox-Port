/// <reference types="chrome" />

import { sha256 } from "../../../Shared/Crypto/hash";
import { serialiseAPIResponse } from "../../../Shared/Net/SerialiseAPI";
import { getPlatform } from "../env/environmentDetails";

interface APIRequest extends RequestInit {
    method?: string,
    headers: Record<string, string>,
    [key: string]: unknown
};

browser.runtime.onMessage.addListener((message, sender) => {
    if (message?.rovid !== 'rovalra-mkapi') {
        return false;
    }

    return handleApiRequest(message, sender);
});

async function handleApiRequest(message: any, sender: browser.runtime.MessageSender) {
    try {
        const response = await fetch(
            message.data.target,
            message.data.args ?? {},
        );

        return await serialiseAPIResponse(response);
    } catch (e) {
        console.error(`Background/Sub/Net/MkApi/handleApiRequest: Unknown error type`, e);
        throw e;
    }
}
