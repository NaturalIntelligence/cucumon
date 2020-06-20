class Section{
    constructor(keyword, statement, lineNumber){
        this.keyword = keyword;
        this.statement = statement;
        this.description = "";
        this.lineNumber = lineNumber;
    }
}

module.exports = Section;