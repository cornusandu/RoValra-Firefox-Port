export namespace SerialisedAPI {
    export interface SerialisedResponse {
        body: ArrayBuffer,
        status: number,
        statusText: string,
        headers: [string, string][],
        url: string,
        redirected: boolean,
        type: ResponseType
    }
}

export async function serialiseAPIResponse(response: Response): Promise<SerialisedAPI.SerialisedResponse> {
    return {
        body: await response.arrayBuffer(),
        status: response.status,
        statusText: response.statusText,
        headers: [...response.headers.entries()],
        url: response.url,
        redirected: response.redirected,
        type: response.type,
    };
}

export function deserialiseAPIResponse(response: SerialisedAPI.SerialisedResponse): Response {
    const r = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    });

    Object.defineProperties(r, {
        url: {
            value: response.url,
        },
        redirected: {
            value: response.redirected,
        },
        type: {
            value: response.type,
        },
    });

    return r;
}
