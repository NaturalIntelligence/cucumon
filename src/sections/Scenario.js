const Section = require('./Section');

class Scenario  extends Section {
    constructor(id, keyword, statement, instruction, lineNumber){
        super(keyword, statement, lineNumber)
        this.id = id;
        this.steps = [];
        this.tags = []; //owned tags and feature tags
        if(instruction){
            this.instruction = instruction;
        }
    }
}

module.exports = Scenario;