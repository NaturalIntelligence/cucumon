const Section = require('./Section');

class Scenario  extends Section {
    constructor(id, keyword, secionName, statement, lineNumber){
        super(keyword, statement, lineNumber)
        this.secionName = secionName;
        this.id = id;
        this.steps = [];
        this.tags = []; //owned tags and feature tags
    }
}

module.exports = Scenario;