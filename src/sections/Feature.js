const Section = require('./Section');
class Feature extends Section {
    constructor(statement, lineNumber){
        super("feature", statement, lineNumber)
        this.background = null;
        this.rules = [];
        this.tags = [];
    }
}

module.exports = Feature;