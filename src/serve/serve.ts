import {turtle} from "@khgame/turtle";
import {Api} from "./api";

import * as Koa from "koa";
import * as Mount from "koa-mount"
import * as Static from "koa-static"
import * as Path from "path";

const defaultConf = {
    "name": "hserve",
    "id": 0,
    "port": 3000,
    "setting": {
        "log_prod_console": "info" as "info"
    },
    "drivers": {},
    "rules": {}
};


export async function server(cmd: {dir?: string, port?: string, api?: string} = {}) {
    let {dir, port, api} = cmd;
    dir = dir || ".";
    let portNum = parseInt(port);
    portNum = portNum> 0 ? portNum : 3000;
    api = api || "static";

    turtle.conf = defaultConf;
    turtle.conf.port = portNum;
    turtle.runtime.updateEnvInfo();

    if (api.startsWith("/api") || api.startsWith("api")) {
        throw new Error(`alias ${api} cannot be start with api `)
    }

    const staticServe = new Koa();

    const path = Path.isAbsolute(dir) ? dir : Path.resolve(process.cwd(), dir);
    staticServe.use(Static(path));

    await turtle.startAll(
        new Api(
            1000,
            undefined,
            [
                Mount(api.startsWith("/") ? api : "/" + api,
                    staticServe
                )
            ])
    );
}
