// log is used to monitor activity, track usage price etc.




const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var illog = new Schema({
    type:  {
        type : String,
        default: 'fileUpload' // fileUpload | preview | sign ....
    },

    type:  {
        type : Number,
        default: 0 
    },
    date : {
        type : Date, 
        default: Date.now
    },
    userId: String, //user's id must be string  
    objectId: String, //                       in future may be moved to other type of database 

    deletedOn: {
        type : Date, 
        default: null
    },
    deletedBy: String,

    data: {}
 
 
});

mongoose.model("illog", illog);


class MongooseLogAdapter {
    constructor() {
 
    }

    #AppConnection = {

    }

    #connect() {
        const globalOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true
        };
        
        url = url || config.mongoURLObjects;
        if (this.#AppConnection[url]) {
            return this.#AppConnection[url];
        } else {
            this.#AppConnection[url] = mongoose.createConnection(url, globalOptions);
            return this.#AppConnection[url];
        }
    }

    async log(dbConfig, data) {
        const db = this.#connect(dbConfig);
        const model = db.model("illog");
        return await model.create(data);
    }
    
    async getLog(dbConfig, query) {
        const db = this.#connect(dbConfig);
        const model = db.model("illog");
        return await model.find(query).exec();
    }
}


class ILLog {
    constructor() {
        this.adapter = new MongooseLogAdapter();89
    }

 

    log(project, data) {
        this.adapter.log(project, data);
    }
    
    getLog(project, data) {
        this.adapter.getLog(project, data);
    }
}

module.exports = new ILLog();