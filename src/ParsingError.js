class ParsingError extends Error {
    constructor(msg, lineNumber){
        super();
        this.message = msg;
        this.lineNumber = lineNumber;
    }

    toString(){
        return this.message;
    }
}

module.exports = ParsingError;