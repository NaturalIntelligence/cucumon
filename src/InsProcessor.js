const ParsingError = require("./ParsingError");

const supportedTypes = [ "DocString", "DataTable"];
let handlers = {};

function register(type, ins, fn){
    if(typeof fn !== 'function') throw new Error("Invalid instruction processor type");
    else if(supportedTypes.indexOf(type) !== -1) {
        if(handlers[type]){
            handlers[type][ins] = fn;
        }else{
            handlers[type] = {
                [ins]: fn
            };
        }
    }
    else throw new Error("Unsupported instruction type: " + type);
}

function process(argType, ins , step){
    const handler = handlers[argType];
    if(handler && handler[ins]){
        try{
            handler[ins](step.arg);
        }catch(err){
            let errMsg = "🤦 Error in processing instruction for step: \n'''" + step.statement + "''' at line number" + step.lineNumber + " \n";
            errMsg += err.message
            //err.stack = errMsg + err.stack;
            throw new ParsingError(errMsg, step.lineNumber);
        }
    }
}

module.exports = {
    register: register,
    process: process
}