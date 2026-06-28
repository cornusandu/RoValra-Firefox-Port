/// <reference types="chrome" />

import { sha256 } from "../../../Shared/Crypto/hash";
import { serialiseAPIResponse } from "../../../Shared/Net/SerialiseAPI";
import { getPlatform } from "../env/environmentDetails";

interface APIRequest extends RequestInit {
    method?: string,
    headers: Record<string, string>,
    [key: string]: unknown
};

browser.runtime.onMessage.addListener(async (message, sender) => {
    if (message.rovid === "rovalra-mkapi") {
        const args: APIRequest = message.data?.args ?? {};

        if (args.headers === undefined) args.headers = {};

        args.headers['X-Dev-Origin'] = String(sender.tab?.id);
        args.headers['X-Dev-Origin-TabID'] = await sha256(JSON.stringify( { extension: 'RoValra-Firefox', TabID: sender.tab?.id ?? -1 } ));
        args.headers['X-Dev-OS'] = (await getPlatform())?.printos ?? "(Undefined)";

        const response = await fetch(message.data?.target, args);

        return serialiseAPIResponse(response);
    }
});
