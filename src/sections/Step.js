class Step{
    constructor(keyword, statement, ln, scenarioId){
        this.keyword = keyword;
        this.statement = statement;
        this.lineNumber = ln;
        this.scenarioId = scenarioId;

        //this can be either dataTable, docString, or null
        this.arg = null;
    }
}

module.exports = Step;