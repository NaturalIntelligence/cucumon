const Section = require('./Section');

class Background  extends Section {
    constructor(statement, description, lineNumber){
        super("Background",statement, lineNumber);
        this.id = -1;
        this.description = description;
        this.steps = [];
    }
}

module.exports = Background;