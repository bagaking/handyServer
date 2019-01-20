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

    public log : Model<any>;

    constructor(conn : string = 'mongodb://localhost/logs'){
        mongoose.connect(conn, { useNewUrlParser: true });
        this.log = mongoose.model('log', LogSchema);
    }

    public add(tag : string = "", msg : string = "", level : string = 'log', cbMongo : any = null) {
        this.log.create({tag, msg, level}, cbMongo);
    }

    public async get(tag : string = '', level : string = '', cbError: any = null) {
        let query : any = {};
        if (tag !== '') {
            query.tag = tag;
        }
        if (level !== '') {
            query.level = level;
        }
        return await this.log.find(query).sort({ date: 1 }).error(cbError);
    }

}