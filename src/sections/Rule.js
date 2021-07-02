const Section = require('./Section');
class Rule extends Section {
    constructor(statement, description, lineNumber){
        super("Rule",statement, lineNumber);
        this.description=description;
        this.scenarios = [];
    }
}

module.exports = Rule;