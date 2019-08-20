import {genLogger, turtle} from "@khgame/turtle";
import {Api} from "./api";

import { Controller } from "./controller"

const defaultConf = {
    "name": "hserve",
    "id": 0,
    "port": 3000,
    "setting": {
        "log_prod_console": "info" as "info"
    },
    "drivers": {
    },
    "rules": {
    }
};


export async function server () {
    turtle.conf = defaultConf;
    turtle.runtime.updateEnvInfo();
    // const logger = genLogger();
    // logger.info(`※※  hserve ※※`);
    await turtle.startAll(new Api());
}
