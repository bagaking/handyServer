
import {ICmd} from "easy-commander";
import {server} from "./serve";

export const serve: ICmd = {
    desc: "serve",
    args: {

    },
    exec: async (cmd: any) => {
        await server();
    }
};
