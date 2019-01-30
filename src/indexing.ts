import walk from 'walk';
import Path from 'path';

export function indexingPath(indexMode : string, targetPath : string) {
    let files: Array<string | object> = [];
    return new Promise((resolve, reject) => {
        try {
            let walker = walk.walk(targetPath, {followLinks: false});
            walker.on('file', function (root, stat, next) {
                let route = root.replace(targetPath, "");
                let file = stat;
                if (indexMode === "name") {
                    files.push(indexMode === "name" ? Path.join(route, file.name) : {route, file});
                }
                next();
            });
            walker.on("errors", function (root, nodeStatsArray, next) {
                next();
            });
            walker.on('end', function () {
                resolve(files);
            });
        } catch (e) {
            reject(e);
        }
    })


}