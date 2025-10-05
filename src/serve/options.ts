import Path from "path";

export interface ServeCommandOptions {
    dir?: string;
    port?: string | number;
    api?: string;
}

export interface NormalizedServeOptions {
    dir: string;
    port: number;
    apiRoute: string;
}

export const DEFAULT_PORT = 3000;
export const DEFAULT_API_ROUTE = "/static";

export function normalizeServeOptions(
    cmd: ServeCommandOptions = {},
    cwd: string = process.cwd()
): NormalizedServeOptions {
    return {
        dir: normalizeStaticDir(cmd.dir, cwd),
        port: normalizePort(cmd.port),
        apiRoute: normalizeApiRoute(cmd.api),
    };
}

function normalizeStaticDir(dir: string | undefined, cwd: string): string {
    const staticDir = dir || ".";
    return Path.isAbsolute(staticDir)
        ? Path.normalize(staticDir)
        : Path.resolve(cwd, staticDir);
}

function normalizePort(port: string | number | undefined): number {
    const rawPort = String(port || "").trim();
    if (!rawPort || !/^\d+$/.test(rawPort)) {
        return DEFAULT_PORT;
    }

    const parsedPort = parseInt(rawPort, 10);
    return parsedPort > 0 && parsedPort <= 65535 ? parsedPort : DEFAULT_PORT;
}

function normalizeApiRoute(api: string | undefined): string {
    const rawRoute = (api || DEFAULT_API_ROUTE).trim();
    if (!rawRoute) {
        return DEFAULT_API_ROUTE;
    }
    if (rawRoute.indexOf("?") >= 0 || rawRoute.indexOf("#") >= 0) {
        throw new Error(`alias ${rawRoute} must be a route path without query or hash`);
    }

    const withoutBoundarySlashes = rawRoute.replace(/^\/+/, "").replace(/\/+$/, "");
    const route = withoutBoundarySlashes ? `/${withoutBoundarySlashes}` : "/";
    const routeName = route.charAt(0) === "/" ? route.slice(1) : route;

    if (routeName.indexOf("api") === 0) {
        throw new Error(`alias ${route} cannot start with /api`);
    }

    return route;
}
