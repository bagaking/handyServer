import walk from 'walk';
import Path from 'path';

type IndexedFile = string | {
    route: string;
    file: object;
};

export function indexingPath(indexMode : string, targetPath : string) {
    let files: IndexedFile[] = [];
    return new Promise((resolve, reject) => {
        try {
            let walker = walk.walk(targetPath, {followLinks: false});
            walker.on('file', function (root, stat, next) {
                let route = root.replace(targetPath, "");
                let file = stat;
                if (indexMode === "name") {
                    files.push(Path.join(route, file.name));
                } else if (indexMode === "detail") {
                    files.push({route, file});
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
