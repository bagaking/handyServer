
import {ICmd} from "easy-commander";
import {server} from "./serve";

export const serve: ICmd = {
    desc: "serve",
    args: {
        port: {
            alias: "p",
            desc: "the -p option can set the port of hserve (default is 3000)",
            input: true
        },
        dir: {
            alias: "d",
            desc: "the -d option can set the static dir of hserve (default is $PWD)",
            input: true
        },
        api: {
            alias: "a",
            desc: "the -a option can set the http url of hserve (default is /static, cannot be /api)",
            input: true
        }
    },
    exec: async (cmd: { dir: string, port: number, api: string }) => {

        await server(cmd);
    }
};
