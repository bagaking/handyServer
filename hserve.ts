#!/usr/bin/env node

import * as Argv from 'yargs';
import Path from 'path';
import Koa = require('koa');
import Router = require('koa-router');
import bodyParser = require('koa-bodyparser');
import serveStatic = require('koa-static');
import cors = require('kcors');

import Collecting from './src/collecting';
import { indexingPath } from './src/indexing';
import { mockingPath } from './src/mocking';

const pkg = require(Path.resolve(__dirname, '../package.json'));

const argv = Argv
    .option('d', {
        alias: 'dir',
        demand: false,
        default: '.',
        describe: 'relative path to serve',
        type: 'string'
    })
    .option('m', {
        alias: 'mock',
        demand: false,
        default: null,
        describe: 'relative path to mock',
        type: 'string'
    })
    .option('p', {
        alias: 'port',
        demand: false,
        default: '3000',
        describe: 'port the service on',
        type: 'string'
    })
    .option('l', {
        alias: 'log',
        demand: false,
        default: false,
        describe: 'whether it should print log',
        type: 'boolean'
    })
    .option('i', {
        alias: 'index',
        demand: false,
        default: 'name',
        describe: 'provide get api /--index-- to provide index of folder. \nAvailable modes : [off], [name], [detail]\n',
        type: 'string'
    })
    .option('c', {
        alias: 'collect',
        demand: false,
        default: '',
        describe: 'mongoDb connection string for collecting logs',
        type: 'string'
    })
    .usage('Usage: hserve PATH [OPTIONS]')
    .example('hserve', 'serve current-folder, at the port 3000.')
    .example('hserve ..', 'serve parent-folder, at the port 3000.')
    .example('hserve /var/www/html -l', 'serve the folder "/var/www/html" with logs, at the port 3000.')
    .example('hserve /var/www -d my_blog -p 80', 'serve the folder "/var/www/my_blog", at the port 80.')
    .example('hserve /var/www -m mock', 'serve the folder "/var/www/" and mock the folder "/var/www/mock", at the 3000.')
    .example('hserve -c mongodb://localhost/logs', 'create logging server based on mongodb.')
    .help('h').alias('h', 'help')
    .version(pkg.version)
    .epilog('Copyright 2018')
    .argv;

const app = new Koa();
const router = new Router();

const port = Number(argv.port) > 0 ? Number(argv.port) : 3000;
const root: string | undefined = argv._[0] as string | undefined;
const rootPath: string = root ? (Path.isAbsolute(root) ? root : Path.join(process.cwd(), root)) : process.cwd();
const servePath = Path.join(rootPath, argv.dir as string);

app.use(cors());
app.use(bodyParser());

let totalRequests = 0;
const requestStats = new Map<string, number>();
const MAX_TRACKED_PATHS = 500;

app.use(async (ctx, next) => {
    const url = ctx.originalUrl;
    totalRequests += 1;

    if (!requestStats.has(url) && requestStats.size >= MAX_TRACKED_PATHS) {
        const firstKey = requestStats.keys().next();
        if (!firstKey.done) {
            requestStats.delete(firstKey.value);
        }
    }

    requestStats.set(url, (requestStats.get(url) || 0) + 1);

    if (totalRequests % 1000 === 1) {
        const sample = Array.from(requestStats.entries()).slice(0, 5);
        console.log('[hserve] request stats', { total: totalRequests, sample });
    }

    await next();
});

if (argv.log) {
    app.use(async (ctx, next) => {
        const start = Date.now();
        await next();
        const timeCost = Date.now() - start;
        console.log(`[hserve] ${ctx.method} ${ctx.status} ${ctx.originalUrl} (${timeCost}ms)`);
    });
}

app.use(serveStatic(servePath));

router.get('/--info--', (ctx) => {
    ctx.status = 200;
    ctx.body = pkg;
});

const indexMode = String(argv.index || '').toLowerCase();
router.get('/--index--', async (ctx) => {
    if (indexMode === 'off') {
        ctx.status = 404;
        ctx.body = { message: 'index service is disabled' };
        return;
    }

    ctx.body = await indexingPath(indexMode, servePath);
});

let mockPath: string | undefined;
let mockFiles: Map<string, any> | undefined;

if (argv.mock) {
    mockPath = Path.join(rootPath, argv.mock as string);
    try {
        mockFiles = mockingPath(mockPath);
    } catch (error) {
        console.error('[hserve] failed to load mock files', error);
    }

    if (mockFiles && mockFiles.size > 0) {
        mockFiles.forEach((value, route) => {
            const normalizedRoute = route.split(Path.sep).filter(Boolean).join('/');
            const routeAll = Path.posix.join('/api', normalizedRoute);
            router.get(routeAll, (ctx) => {
                try {
                    delete require.cache[require.resolve(value)];
                    ctx.body = require(value);
                    ctx.type = 'application/json';
                } catch (error) {
                    ctx.status = 500;
                    ctx.body = { message: `mock load failed: ${error}` };
                }
            });
        });
    }
}

if (argv.collect) {
    const collecting = new Collecting(argv.collect as string);

    const addLog = (tag: string, msg: string, level: string) => new Promise<void>((resolve, reject) => {
        collecting.add(tag, msg, level, (error: any) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });

    router.get('/--collect--/add/:tag', async (ctx) => {
        try {
            const tag = ctx.params.tag;
            const msg = decodeURIComponent(String(ctx.query.msg || ''));
            const level = String(ctx.query.level || 'log');
            await addLog(tag, msg, level);
            ctx.status = 201;
            ctx.body = `${tag} : ${msg} are collected.`;
        } catch (error: any) {
            ctx.status = 500;
            ctx.body = error.stack || error.message || String(error);
        }
    });

    router.post('/--collect--/add/:tag', async (ctx) => {
        try {
            const tag = ctx.params.tag;
            const msg = decodeURIComponent(String((ctx.request.body as any)?.msg || ''));
            const level = String((ctx.request.body as any)?.level || 'log');
            await addLog(tag, msg, level);
            ctx.status = 201;
            ctx.body = `${tag} : ${msg} are collected.`;
        } catch (error: any) {
            ctx.status = 500;
            ctx.body = error.stack || error.message || String(error);
        }
    });

    router.get('/--collect--/get/:tag?', async (ctx) => {
        try {
            const tag = ctx.params.tag || '';
            const level = String(ctx.query.level || '');
            const timeFrom = String(ctx.query.time_from || '');
            const timeTo = String(ctx.query.time_to || '');
            const collections: any[] = await collecting.get(tag, level, timeFrom, timeTo, (error: any) => {
                throw error;
            }) || [];

            if (!collections.length) {
                ctx.status = 201;
                ctx.body = 'empty';
                return;
            }

            collections.forEach((item: any) => {
                if (item.date instanceof Date) {
                    item.dateISOStr = item.date.toISOString();
                }
            });

            ctx.status = 201;
            ctx.body = { collections };
        } catch (error: any) {
            ctx.status = 500;
            ctx.body = error.stack || error.message || String(error);
        }
    });
}

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(port, () => {
    console.log(`==== Service Preparing (ver:${pkg.version}) =====`);
    console.log('==>');
    console.log(`- Root path : ${rootPath}`);
    console.log('- Serve :');
    console.log(`    - path : ${servePath}`);
    console.log(`    - at : http://localhost:${port}/`);
    console.log(`    - info : http://localhost:${port}/--info--`);

    if (mockPath && mockFiles) {
        console.log('- Mock :');
        console.log(`    - path : ${mockPath}`);
        console.log(`    - at : http://localhost:${port}/api/`);
        mockFiles.forEach((_, route) => {
            const normalizedRoute = route.split(Path.sep).filter(Boolean).join('/');
            console.log(`       - ${normalizedRoute}`);
        });
    } else {
        console.log('- Mock : off');
    }

    console.log(`- Log : ${argv.log ? 'on' : 'off'}`);
    console.log(`- index : ${argv.index}`);
    console.log(`    - at : http://localhost:${port}/--index--`);
    console.log(`- collect : ${argv.collect ? 'on' : 'off'}`);
    if (argv.collect) {
        console.log(`    - mongo : ${argv.collect}`);
        console.log(`    - add : http://localhost:${port}/--collect--/add/:tag?msg=&level=`);
        console.log(`    - get : http://localhost:${port}/--collect--/get/:tag?level=`);
    }
    console.log('**** Service Running ******');
});

export * from './src/collecting';
export * from './src/indexing';
export * from './src/mocking';
