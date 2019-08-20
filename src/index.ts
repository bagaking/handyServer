#!/usr/bin/env node

import {cmdMaker} from "easy-commander";
import {serve} from "./serve";

cmdMaker.append({serve}).start({
    version: process.env.npm_package_version,
    cbFallback: () => serve.exec()
});

