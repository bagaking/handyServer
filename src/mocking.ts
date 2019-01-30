import fs from 'fs';
import Path from 'path';

const mockFiles = new Map<string, any>();
export function mockingPath(path: string, routeParent: string = '-') {
    // console.log("[mockFile] load", path);

    let fstat = fs.lstatSync(path);
    let filename: string = Path.parse(path).name;

    let route = routeParent !== '-' ? Path.join(routeParent, filename) : '';

    if (fstat.isDirectory()) {

        // console.log("dir", route, path);
        const files = fs.readdirSync(path).filter(file => !file.match(/\..*\.swp/));
        files.forEach(file => mockingPath(Path.join(path, file), route));
    } else if (fstat.isFile()) {
        let route = Path.join(routeParent, filename);
        console.log("file", route, path);
        mockFiles.set(route, path);
    }

    return mockFiles;
}