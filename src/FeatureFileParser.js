const util = require("./util.js");
const Feature = require("./sections/Feature");
const Rule = require("./sections/Rule");
const Scenario = require("./sections/Scenario");
const Background = require("./sections/Background");
const Step = require("./sections/Step");

const stepsRegex = new RegExp("^(Given|When|Then|And|But)\\s+(.*)")
const sectionRegex = new RegExp("\\s*(.+?):(.*)")

//const stepsKeyword = ["Given", "When", "Then", "And", "But"];

class FeatureParser{

    constructor(options){
        this.options = options || {};
        this.events = {
            "feature" : [],
            "rule" : [],
            "scenario" : [], //example
            "example" : [], //example
            "step" : [],
            "background": [],
            "end": [],
            "error": [],
        }
        //this.clubBackgroundSteps = true;
        this.bgScenario = false; //indicate of current scenario is the bg scenario
        this.bg = {
            steps: []
        };
        this.sectionCount =0;
        this.lineNumber = 0;
        this.oldLineNumber = 0;
        this.columnNames = [];
        this.scenarioCount = 0;
        this.featureCount = 0;
        this.ruleCount = 0;
        this.stepCount = 0;
        this.tags = [];
        this.steps = [];
        this.examplesHeader = [];
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
            this.events[eventName].push(fn);
        }
    }

    parseFile(inputStream){
        const lineReader = require('readline').createInterface({
            input: inputStream
        });
          
        const that = this;
        lineReader.on('line', function (line) {
            that.readLine(line.toString().trim());
        });    

        inputStream.on('end', function () {
            that.readLine(that.oldLine);
            that.trigger("end", that.output);
        });
    }

    parse(fileContent){
        let line = "";
        for(let i=0; i<fileContent.length; i++){
            if(fileContent[i] === "\n"){
                this.readLine(line.trim());
                line = "";
            }else{
                line += fileContent[i];
            }
        }
        line = line.trim();
        if(line){
            this.readLine(line.trim());
        }else{
            this.readLine(this.oldLine)
        }
        //this.trigger("end");
        return this.output;
    }

    /**
     * skip blank & commented lines. process old line
     * @param {string} line 
     */
    readLine(line){
        this.lineNumber++;
        if(line.length !== 0 && line[0] !== '#'){
            if(!this.oldLine) {
                this.oldLine = line;
            }else{
                this.nextLine = line;
                this.processLine(this.oldLine);
                this.oldLine = line;
            }
            this.oldLineNumber = this.lineNumber;
        }
    }

    processLine(line){
        
        //const temp = this.description;
        //this.description = "";
        if(this.readingDataTable && line[0] !== "|"){
            this.readingDataTable = false;
            this.processCurrentStep(true);
        }
        let match = sectionRegex.exec(line);
        if(match){
            this.processSection();
            this.keyword = match[1];
            let statement = match[2];
            if(statement) statement = statement.trim();

            if(this.keyword.length > 10 && (this.keyword === "Scenario Outline" || this.keyword == "Scenario Template")){
                this.keyword = "Scenario";
                this.scenario(this.keyword, statement, true);
            }else if( this.keyword === "Scenario" || this.keyword === "Example" ){
                this.scenario(this.keyword, statement, false);
            }else if( this.keyword === "Scenarios" || this.keyword === "Examples" ){
                this.keyword = "Scenario";
                this.examples(this.keyword, statement);
            }else if( this.keyword === "Background"){
                this.background(this.keyword, statement);
            }else if( this.keyword === "Rule"){
                this.rule(this.keyword, statement);
            }else if( this.keyword === "Feature"){
                this.feature(this.keyword, statement);
            }else{
                this.sectionCount--;
                this.addDescription(line);
            }
            this.sectionCount++;
        }else{
            if( line.indexOf("@") === 0){
                this.recordTags(line);
            }else if(this.readingScenario){
                let stepMatch = stepsRegex.exec(line);
                if(stepMatch){
                    if(this.readingExamples){
                        throw new Error("Unexpected step at linenumber " + this.oldLineNumber);
                    }
                    if(!this.readingSteps){
                        this.readingSteps = true;
                        this.processSection("Scenario");
                        this.keyword = "";
                    }
                    this.step = new Step(stepMatch[1], stepMatch[2].trim(), this.oldLineNumber, this.scenarioObj.id);
                    
                    if(this.nextLine[0] === "|" || this.nextLine === '"""' ){
                        //wait
                    }else{
                        this.processCurrentStep();
                    }
                }else if(this.readingSteps){
                    if(line[0] === "|"){//data table
                        this.readingDataTable = true;
                        this.stepDataTable.push( util.splitOn(line, "|"));
                    }else if(line === '"""' ){//docStrng
                        if(this.readingDocString){
                            this.processCurrentStep(true);
                            this.readingDocString = false;
                        }else{
                            this.readingDocString = true
                        }
                    }else if(this.readingDocString){
                        this.stepDocString += line;
                    }else{//A step with no matching keyword or start
                        throw new Error("Unexpected step at linenumber " + this.oldLineNumber);
                    }
                }else if(this.readingExamples && line[0] === "|"){
                    line = line.substring(1,line.length - 1);
                    if(this.examplesHeader.length === 0){
                        const temp = line.split("|");
                        for(let i = 0; i < temp.length;i++){
                            temp[i] = "<"+temp[i].trim() + ">";
                        }
                        this.examplesHeader = temp;
                    }else{
                        this.processScenarioOutline(this.examplesHeader, line.split("|"));
                    }
                }else if(this.steps.length === 0){
                    //description
                    //incomplete step "Given ", "Given"
                    this.addDescription(line);
                }else{
                    //This code should not be reachable
                    throw new Error("Unexpected text at linenumber " + this.oldLineNumber);
                }
            }else if(this.sectionCount === 0){//when some text before Feature: section
                throw new Error("Unexpected text at linenumber " + this.oldLineNumber);
            }else{
                //description
                this.addDescription(line);
            }
        }
    }

    feature(keyword, statement){
        if(this.sectionCount !== 0){
            //when repeated
            //when dont come at first position
            throw new Error("Unexpected " + keyword + " section at linenumber " + this.oldLineNumber);
        }else{
            this.sectionCount = 1;
            this.output = {
                feature: new Feature(statement, this.oldLineNumber)
            }
            this.currentSection = this.output.feature;
            this.currentSection.tags = this.tags;
        }
    }

    itShouldComeAfterFeatureSection(keyword){
        if(this.sectionCount === 0){
            //when comes before Feature section
            throw new Error(keyword + " at linenumber " + this.oldLineNumber + " before Feature section");
        }
    }

    rule(keyword, statement){
        this.itShouldComeAfterFeatureSection(keyword);
        if(this.tags.length > 0 || (this.output.feature.rules.length > 0 && this.output.feature.rules[0].statement === "__default" )){
            //when repeated
            //when previous scenarios are not grouped in a rule
            //when comes at first position
            //when tags come before
            throw new Error("Unexpected " + keyword + " at linenumber " + this.oldLineNumber);
        }else{
            const ruleSection = new Rule(statement, this.oldLineNumber);
            this.output.feature.rules.push(ruleSection);
            this.currentSection = ruleSection;
            this.readingSteps = false;
        }
    }

    background(keyword, statement){
        this.itShouldComeAfterFeatureSection(keyword);
        if(this.bgScenario || this.readingScenario || this.tags.length > 0){
            //when comes at first position
            //when repeated
            //when come after any scenario (outline)
            //when tags come before
            throw new Error("Unexpected " + keyword + " at linenumber " + this.oldLineNumber);
        }else{
            this.readingScenario = true; //to process steps
            this.bgScenario = true; //to validate steps
            //TODO: Background with no step
            if(this.options.clubBgSteps){
                this.scenarioObj = this.bg;
            }else{
                this.currentSection.background = new Background(statement, this.oldLineNumber);
                this.scenarioObj = this.currentSection.background;
            }
        }
    }

    scenario(keyword, statement, outline){
        this.itShouldComeAfterFeatureSection(keyword);
        if(this.scenarioObj && this.scenarioObj.steps.length === 0){
            throw new Error(keyword + " at linenumber " + this.oldLineNumber + " without steps");
        }else{
            this.outline = outline;
            this.beforeScenario(keyword, statement);
        }
    }

    beforeScenario(keyword, statement){
        if(this.output.feature.rules.length === 0){
            const ruleSection = new Rule("__default", -1);
            this.output.feature.rules.push(ruleSection);
            this.currentSection = ruleSection;
        }
        this.scenarioCount++;
        this.steps = [];
        this.stepDataTable = [];
        this.readingScenario = true;
        this.bgScenario = false;
        this.readingExamples = false;
        this.readingSteps = false;
        const scenario = new Scenario( this.scenarioCount, keyword.toLowerCase(), statement, this.oldLineNumber); 
        scenario.tags = this.tags;
        this.scenarioObj = scenario;
        this.currentSection.scenarios.push(scenario);

        this.tags = []
    }

    examples(keyword){
        if(this.tags.length > 0 || !this.outline || !this.readingSteps || this.bgScenario || this.steps.length === 0){
            //when tags come before
            //when not the part of scenario outline/template
            //when come just after scenario starts. No steps in between
            //when it is the part of Background section
            throw new Error("Unexpected " + keyword + " at linenumber " + this.oldLineNumber);            
        }else{
            this.readingExamples = true;
            this.readingSteps = false;
            this.examplesHeader = [];
        }
    }

    addDescription(line){
        if(!this.bgScenario)
            this.currentSection.description += "\n" +line;
    }

    recordTags(line){
        this.tags = line.split(/\s+/);
    }

    processSection(){
        if(this.keyword){
            if(this.keyword[0] === "F" || this.keyword[0] === "R"){
                this.trigger(this.keyword.toLowerCase(),this.currentSection);
            }else if(this.keyword[0] === "B"){
                if(!this.options.clubBgSteps) this.trigger(this.keyword.toLowerCase(),this.scenarioObj);
            }else if( this.keyword[this.keyword.length - 1] === "s"){//skip Examples and Scenarios
            }else{
                this.trigger(this.keyword.toLowerCase(), this.scenarioObj);
            }
        }
    }


    /**
     * 
     * @param {array} dataObjKeys 
     * @param {array} dataObj 
     */
    processScenarioOutline(dataObjKeys, dataObj){
        this.processSection("Scenario");
        for (var i = 0; i < this.bg.steps.length.length; i++){
            let step = Object.assign({}, this.bg.steps[i]);
            step.scenarioId = this.scenarioObj.id;
            this.scenarioObj.steps.push(step);
            this.trigger("step", step);
        }
        for (var i = 0; i < this.steps.length; i++){
            //clone step
            let step = Object.assign({}, this.steps[i])
            for (var j = 0; j < dataObjKeys.length; j++){
                step.statement = step.statement.replace(dataObjKeys[j], dataObj[j].trim() );
            }
            step.scenarioId = this.scenarioObj.id;
            this.scenarioObj.steps.push(step);
            this.trigger("step", step);
        }
        if(this.nextLine && this.nextLine[0] !== "|") this.keyword = "";
    }


    processCurrentStep(hasArguments){
        if(hasArguments){
            if(this.stepDocString.length > 0 && this.stepDataTable.length > 0) {
                throw new Error("Only data table or doc string is allowed for step at line number " + this.stel.lineNumber);
            }else if(this.stepDocString.length > 0){
                this.step.argument = this.stepDocString;
            }else{
                this.step.argument = this.stepDataTable;
            }
            this.stepDocString = "";
            this.stepDataTable = [];
        }

        if(this.outline){
            this.steps.push(this.step);
        }else{
            this.scenarioObj.steps.push(this.step);
            this.trigger('step', this.step);
        }
    }
    
    currentStep(){
        return this.steps[ this.steps.length - 1];
    }

    trigger(keyword, data){
        console.log(keyword, data);
        for(let i=0; i< this.events[keyword].length; i++){
            this.events[keyword][i](data);
        }
    }
    
}
module.exports = FeatureParser;