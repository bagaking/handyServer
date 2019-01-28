import mongoose, {Model} from 'mongoose'

var LogSchema = new mongoose.Schema({
    tag: String,
    level: String,
    date: {
        type: Date,
        default: Date.now
    },
    msg: {
        type: String,
        default: '_'
    }
});

export default class Collection {

    public log: Model<any>;

    constructor(conn: string = 'mongodb://localhost/logs') {
        mongoose.connect(conn, {useNewUrlParser: true});
        this.log = mongoose.model('log', LogSchema);
    }

    public add(tag: string = "", msg: string = "", level: string = 'log', cbMongo: any = null) {
        let query = {tag, msg, level};
        console.log("collection set", query);
        this.log.create(query, cbMongo);
    }

    public async get(tag: string = '', level: string = '', timeFrom: string = '', timeTo: string = '', cbError: any = null) {
        let query: any = {};
        if (tag !== '') {
            query.tag = tag;
        }
        if (level !== '') {
            query.level = level;
        }
        if (timeFrom !== '' && timeTo !== '') {
            query.date = {};
            if (timeFrom !== '') {
                query.date["$gte"] = new Date(timeFrom);

            }
            if (timeTo !== '') {
                query.date["$lt"] = new Date(timeTo);
            }
        }


        console.log("collection get", query);
        let ret = await this.log.find(query).sort({date: 1}).catch(cbError);
        return ret;
    }

}