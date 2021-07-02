const Section = require('./Section');

class ScenarioOutline  extends Section {
    constructor(id, keyword, statement, lineNumber){
        super(keyword, statement, lineNumber)
        this.id = id;
        this.expanded = [];
        this.tags = []; //owned tags and feature tags
        this.examples = [];
    }
}

module.exports = ScenarioOutline;