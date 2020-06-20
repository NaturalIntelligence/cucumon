const Section = require('./Section');

class Scenario  extends Section {
    constructor(id, statement, lineNumber){
        super("scenario",statement, lineNumber)
        this.id = id;
        this.steps = [];
        this.tags = []; //owned tags and feature tags
    }
}

module.exports = Scenario;