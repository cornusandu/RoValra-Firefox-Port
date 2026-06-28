declare global {
    namespace browser.runtime {
        interface PlatformInfo {
            printos?: string;
        }
    }
}

let platform: undefined | browser.runtime.PlatformInfo = undefined;

export async function getPlatform() {
    if (platform !== undefined) return platform;
    platform = await browser.runtime.getPlatformInfo();

    if (platform === undefined) {
        return;
    }

    platform.printos = "Unknown";
    if (platform.os === "linux") platform.printos = `GNU/Linux`;
    if (platform.os === "android") platform.printos = "GNU/Linux (Android)";
    if (platform.os === "cros") platform.printos = "CROS";
    if (platform.os === "mac") platform.printos = "MacOS";
    if (platform.os === "openbsd") platform.printos = "BSD (OpenBSD)";
    if (platform.os === "win") platform.printos = "Windows NT";

    platform.printos = `${platform.arch} ${platform.printos}`

    return platform;
}
