import { Model } from 'mongoose';
export default class Collection {
    log: Model<any>;
    constructor(conn?: string);
    add(tag?: string, msg?: string, level?: string, cbMongo?: any): void;
    get(tag?: string, level?: string, timeFrom?: string, timeTo?: string, cbError?: any): Promise<{}>;
}
