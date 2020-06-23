const Section = require('./Section');

class Background  extends Section {
    constructor(statement, lineNumber){
        super("background",statement, lineNumber)
        this.secionName = "Background";
        this.id = -1;
        this.steps = [];
    }
}

module.exports = Background;