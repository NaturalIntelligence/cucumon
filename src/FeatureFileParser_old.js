//'use strict';
// Call a callback with feature data like feature file name, feature detail, scenario detail, 

//1. On Scenario Outline, parser read the example and trigger scenario event number of times
//2. Filter crteria can also be set to exlude scenarios automatically
//   Eg. tag expression, 

const util = require("./util");
const Step = require("./sections/Step");
const Scenario = require("./sections/Scenario");
const extractorRegex = new RegExp("^[ \\t]*((Scenario Outline|Scenario|Example|Feature|Background|Rule)\\s*:|#|@\\w+)(.*)", "gm")
//const stepsRegexStr = "(Given|When|Then|And|But)\\s+";
const stepsRegex = new RegExp("^(Given|When|Then|And|But)\\s+(.*)")
//const sectionRegexStr = "(Scenario Outline|Scenario Template|Scenario|Example|Feature|Background|Rule|Examples)\\s*:";
const sectionRegex = new RegExp("^(Scenario Outline|Scenario Template|Scenario|Example|Feature|Background|Rule|Examples|Scenarios)\\s*:(.*)")
const identifierRegexStr = '("""||@\\w+|#|\\|)';
const keywordRegex = new RegExp("^("+stepsRegexStr+"|"+sectionRegexStr+")(.*)")

class FeatureParser{

    constructor(){
        this.events = {
            "feature" : [],
            "rule" : [],
            "scenario" : [], //example
            "example" : [], //example
            "step" : [],
            "background": []
        }
        this.clubBackgroundSteps = true;
        this.bgSteps = [];
        this.lineNumber = 0;
        this.columnNames = [];
        this.scenarioCount = 0;
        this.featureCount = 0;
        this.ruleCount = 0;
        this.stepCount = 0;
    }

    /**
     * 
     * @param {string} tagExpression Eg. @tag1 and @tag2
     */
    filterBy(tagExpression){
        
    }

    /**
     * 
     * @param {string} eventName : feature, scenario, step
     * @param {Function} fn 
     */
    on(eventName, fn){
        if (!eventName || Object.keys(this.events).indexOf(eventName.toLowerCase()) === -1){
            throw new Error("Supported events are " + Object.keys(this.events) );
        }else{
            eventName  = eventName.toLowerCase();
            if(eventName === "background"){
                this.clubBackgroundSteps = false;
            }
            this.events[eventName].push(fn);
        }
    }

    parseFile(filePath){
        const lineReader = require('readline').createInterface({
            input: require('fs').createReadStream(filePath)
        });
          
        lineReader.on('line', function (line) {
            processLine(line.toString().trim());
        });    
    }
    
    parse(fileContent){
        let line = "";
        for(let i=0; i<fileContent.length; i++){
            if(fileContent[i] === "\n"){
                processLine(line.trim());
                line = "";
            }else{
                line += fileContent[i];
            }
        }
    }


    processLine(line){
        this.lineNumber++;
        
        let match = sectionRegex.exec(line);
        if(match){//Scenario Outline|Scenario Template|Scenario|Example|Feature|Background|Rule|Examples|Scenarios
            match[1] = match[1].replace(" ", "");
            this.readingSteps = false;
            //this[match[1].toLowerCase()](match[2]);
            //this.lastKeyWord = this.keyword;
            this.completeLastSection();
            const keyword = match[1].toLowerCase(); 
            this.statement = match[2];
            this.startLineNumber = this.lineNumber;
            this.prepareFor(keyword, statement);
            this.keyword = keyword;
        }else{// not a rule, feature, examples
            match = stepsRegex.exec(line);
            if(match && !this.readingDocString){//Given|When|Then|And|But
                if(!this.readingSteps){
                    this.completeLastSection();
                    this.scenario();
                    this.readingSteps = true;
                }
                this.step(match[1], match[2]);
                this.completeCurrentStep(); //Will set data Table in argument if present and set it to blank again
            }else if(this.readingSteps){
                if(line.indexOf('"""') === 0){//doc string
                    if(this.readingDocString) {
                        this.readingDocString = false;
                        this.completeCurrentStep();//Will set doc String in argument
                    }else {
                        this.readingDocString = true;
                    }
                }else if(line.indexOf('@') === 0){//tag
                    this.completeCurrentStep();
                    this.tags(line);
                    
                }else if(line.indexOf('|') === 0){//data table
                    //this.readingDataTable = true;
                    this.dataTable(line);
                }else if(this.readingDocString){
                    this.docString(line);
                }else{
                    throw new Error("Unexpected statement at line " + this.lineNumber);
                }
            }else if(this.readingExamples){
                this.processExampleRow(line);
            }else{//scenario description
                //description
                //tag
                if(line.indexOf("@") === 0){
                    this.tags = line.split(/[ \t]+/);
                }else{
                    this.description(line)
                }
            }
        
        }
    }

    /**
     * Trigger scenario then step events as perf examples if any
     * Call background steps if set to be clubbed
     * reset flags
     * prepare meta with descriptions 
     */
    completeLastSection(){
        if(this.keyword){
            this[this.keyword.replace(" ", "")]();
        }
    }

    /**
     * Sets data table if present, as step argument.
     */
    completeCurrentStep(){
        if(this.dataTable){
            this.currentStep.argument = this.dataTable;
        }
    }

    /**
     * Setup initial config to process a section
     * @param {string} sectionName
     */
    prepareFor(sectionName){
        const lastKeyWord = this.keyword;
        if(sectionName === "examples" || sectionName === "scenarios"){
            this.validateTag();
            if(lastKeyWord !== "scenario template" || lastKeyWord !== "scenario outline") throw new Error("Scenarios/Examples are allowed with Scenario Outline/Template only.")
            else{
                this.readingSteps = false;
                this.readingExamples = true;
            }
        }else if(sectionName === "example" || sectionName === "scenario"){
            this.readingScenario = true;
        }
    }

    /**
     * Store section description
     * @param {string} statement 
     */
    description(statement){
        this.description += statement;
    }

    processExampleRow(row){
        if(this.columnNames.length === 0){
            this.columnNames = util.splitOn(row, "|");
        }else{
            //util.splitInObject(row, "|", columnsArr);
            const rowDataArr = util.splitOn(row, "|");
            this.processScenarioOutline(rowDataArr);
        }
    }

    processScenario(){
        for(let i = 0; i < this.steps; i++){
            const step = this.steps[i];
            this.trigger("step", step);
        }
    }
    
    /**
     * 
     * @param {array} rowData 
     */
    processScenarioOutline(rowData){
        for(let i = 0; i < this.steps; i++){
            const step = this.steps[i];
            for(let j = 0; j <this.columnNames; j++){
                step.statement = step.statement.replaceAll("<"+ this.columnNames[j] +">", rowData[j] );
            }
            this.trigger("step", step);
        }
    }

    /**
     * Just record the step
     * @param {string} keyword 
     * @param {string} statement 
     */
    processStep(keyword, statement){

    }

    //////////////////// Sections
    /// Sections methods are called when a particular section is completed.

    feature(){
        this.trigger('feature', { 
            description : this.description,
            lineNumber : this.startLineNumber
        });
    }

    rule(){
        this.trigger('rule', { 
            description : this.description,
            lineNumber : this.startLineNumber
        });
    }

    background(){
        this.readingBgSteps = false;
        this.meta.description = this.description;
        this.meta.lineNumber = this.startLineNumber;
    }

    validateTag(){
        if(this.tags.length > 0) throw new Error("Tags are allowed only before a Feature or Scenario.");
    }

    scenario(){
        //trigger events
        this.readingScenario = true
        this.scenarioObj = new Scenario(this.statement)
        this.tags = []; //reset
        
    }
    scenariooutline(){
        //do nothing
        //examples() will handle
    }
    //scenarios(){}
    examples(){
       this.readingExamples = false;
        this.columnNames = []
    }

    comment(){}

    //steps
    //next possible: scenario, step, examples

    description(){}
    docString(){}
    dataTable(){}
    given(){}
    when(){}
    then(){}
    and(){}
    but(){}

    exampleRow(){}


    trigger(keyword, data){
        for(let i=0; i< this.events[keyword].length; i++){
            this.events[keyword][i](data);
        }
    }
    
}

module.exports = FeatureParser;

