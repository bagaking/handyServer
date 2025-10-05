import { turtle } from "@khgame/turtle";
import { Api } from "./api";

import Koa from "koa";
import mount from "koa-mount";
import serveStatic from "koa-static";
import { normalizeServeOptions, ServeCommandOptions } from "./options";

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


export async function server(cmd: ServeCommandOptions = {}) {
    const options = normalizeServeOptions(cmd);

    turtle.conf = defaultConf;
    turtle.conf.port = options.port;
    turtle.runtime.updateEnvInfo();

    const staticServe = new Koa();

    staticServe.use(serveStatic(options.dir));

    await turtle.startAll(
        new Api(
            1000,
            undefined,
            [
                mount(options.apiRoute,
                    staticServe
                )
            ])
    );
}
