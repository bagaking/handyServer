import {JsonController, Get, UseBefore, UseAfter} from "routing-controllers";
import { turtle, genLogger, Logger } from "@khgame/turtle";


@JsonController("/")
export class Controller {

    public log: Logger = genLogger("api:app");

    constructor(
    ) {
    }

    @Get("health")
    public async health() {
        return JSON.stringify({
            runtime: turtle.runtime,
            node_env: process.env.NODE_ENV || "__UNDEFINED__(development)",
            runningRequest: turtle.api.runningRequest,
            version: process.env.npm_package_version,
        }, null, 4);
    }

}
