const Section = require('./Section');
class Rule extends Section {
    constructor(statement, lineNumber){
        super("rule",statement, lineNumber)
        this.scenarios = [];
    }
}

module.exports = Rule;