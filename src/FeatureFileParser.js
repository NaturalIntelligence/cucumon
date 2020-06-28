const TagExpParser = require("bexp");

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
        this.options = Object.assign( {tagExpression: "" }, options );
        this._resetParameters();
    }

    _resetParameters(){
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
        this.tagExpParser = new TagExpParser(this.options.tagExpression);
        this.keyword = "";
        this.bgScenario = false; //indicate of current scenario is the bg scenario
        this.bg = new Background();
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
        this.stepDataTable = [];
        this.stepDocString = "";
        this.skip = "";
    }

    /**
     * 
     * @param {string} eventName : feature, scenario, step
     * @param {Function} fn 
     */
    on(eventName, fn){
        if (!eventName || Object.keys(this.events).indexOf(eventName.toLowerCase()) === -1){
            throw  new Error("Supported events are " + Object.keys(this.events) )
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
        const eofListner = function () {
            try{
                that.readLine(that.oldLine);
                that.eofValidation();
                that.trigger("end", that.output);
            }catch(e){
                that.trigger("error", e)
            }
        }

        const onLineRead =  function (line) {
            try{
                that.readLine(line.toString().trim());
            }catch(e){
                that.trigger("error", e)
                //Unregister Events
                lineReader.removeAllListeners("line");
                lineReader.close();
                inputStream.off("end", eofListner);
                inputStream.close();
            }
        };

        lineReader.on('line',onLineRead);    

        inputStream.on('error', function (err) {
            throw err
        });

        inputStream.on('end', eofListner);
    }


    parse(fileContent){
        if(typeof fileContent !== 'string') throw new Error('Incompatible input type. String is expected.');
        let line = "";
        for(let i=0; i<fileContent.length; i++){
            if(fileContent[i] === "\n"){
                this.readLine(line.trim())
                line = "";
            }else{
                line += fileContent[i];
            }
        }
        line = line.trim();
        if(line){
            this.readLine(line.trim());
            this.readLine(this.oldLine);
        }else{
            this.readLine(this.oldLine)
        }
        //this.trigger("end");
        this.eofValidation();
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

                if( this.oldLine.indexOf("@") === 0){
                    this.recordTags(this.oldLine);
                }else{
                    this.sectionMatch = sectionRegex.exec(this.oldLine);
    
                    //Skip if tag doesn't match
                    if(this.sectionMatch && this.skip){//start of a section
                        this.skip = "";
                        this.processLine(this.oldLine);
                    }else if(this.skip){ //skip current line to be processed
                    }else {
                        this.processLine(this.oldLine);
                    }
                }

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
            this.processStepArgument();
            this.processCurrentStep();
        }
        
        if(this.sectionMatch){
            this.markSectionBegining();
        }else if(this.readingScenario){
            let stepMatch = stepsRegex.exec(line);
            if(stepMatch){
                if(this.readingExamples){
                    throw new Error("Unexpected step at linenumber " + this.oldLineNumber)
                }
                if(!this.readingSteps && !this.outline) {
                    this.processLastSectionArea();//to trigger scenario/background event
                    this.processBgSteps();
                }
                this.keyword = ""; //Not to trigger section event again for each step
                this.readingSteps = true;
                this.step = new Step(stepMatch[1], stepMatch[2].trim(), this.oldLineNumber, this.scenarioObj.id);
                
                if(this.nextLine[0] === "|" || this.nextLine === '"""' ){
                    //hold
                }else{
                    this.processCurrentStep();
                }
            }else if(this.readingSteps){
                if(line[0] === "|"){//data table
                    this.readingDataTable = true;
                    this.stepDataTable.push( util.splitOn(line, "|"));
                }else if(line === '"""' ){//docStrng
                    if(this.readingDocString){
                        this.processStepArgument();
                        this.processCurrentStep();
                        this.readingDocString = false;
                    }else{
                        this.readingDocString = true
                    }
                }else if(this.readingDocString){
                    this.stepDocString += line;
                }else{//A step with no matching keyword or start
                    throw  new Error("Unexpected step at linenumber " + this.oldLineNumber)
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
                throw  new Error("Unexpected text at linenumber " + this.oldLineNumber)
            }
        }else if(this.sectionCount === 0){//when some text before Feature: section
            throw  new Error("Unexpected text at linenumber " + this.oldLineNumber)
        }else{
            //description
            this.addDescription(line);
        }
    }

    markSectionBegining(){
        this.processLastSectionArea();
        const keyword = this.sectionMatch[1];
        let statement = this.sectionMatch[2];
        this.sectionMatch = null;//reset
        if(statement) statement = statement.trim();
        this.keyword = keyword;

        if(keyword.length > 10 && (keyword === "Scenario Outline" || keyword == "Scenario Template")){
            this.keyword = "Scenario";
            this.scenario(this.keyword, statement, keyword, true);
        }else if( keyword === "Scenario" || keyword === "Example" ){
            this.scenario(this.keyword, statement, keyword, false);
        }else if( keyword === "Scenarios" || keyword === "Examples" ){
            this.keyword = "Scenario"; // To trigger `scenario` event for each row of Examples
            this.examples(this.keyword, statement);
        }else if( keyword === "Background"){
            this.background(this.keyword, statement);
        }else if( keyword === "Rule"){
            this.rule(this.keyword, statement);
        }else if( keyword === "Feature"){
            this.feature(this.keyword, statement);
        }else{
            this.addDescription(line);
            return;
        }
        this.sectionCount++;
    }

    feature(keyword, statement){
        if(this.sectionCount !== 0){
            //when repeated
            //when dont come at first position
            throw  new Error("Unexpected " + keyword + " section at linenumber " + this.oldLineNumber)
        }else{
            this.sectionCount = 1;
            this.output = {
                feature: new Feature(statement, this.oldLineNumber)
            }
            this.currentSection = this.output.feature;
            this.currentSection.tags = this.tags;
            this.tags = []; //reset
        }
    }

    itShouldComeAfterFeatureSection(keyword){
        if(this.sectionCount === 0){
            //when comes before Feature section
            throw  new Error(keyword + " at linenumber " + this.oldLineNumber + " before Feature section")
        }
    }

    rule(keyword, statement){
        this.itShouldComeAfterFeatureSection(keyword);
        if(this.tags.length > 0 || (this.output.feature.rules.length > 0 && this.output.feature.rules[0].statement === "__default" )){
            //when repeated
            //when previous scenarios are not grouped in a rule
            //when comes at first position
            //when tags come before
            throw  new Error("Unexpected " + keyword + " at linenumber " + this.oldLineNumber)
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
            throw  new Error("Unexpected " + keyword + " at linenumber " + this.oldLineNumber)
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

    scenario(keyword, statement, secionName, outlineFlag){
        this.itShouldComeAfterFeatureSection(keyword);
        if(this.scenarioObj && this.scenarioObj.steps.length === 0){
            throw  new Error(this.scenarioObj.secionName + " at linenumber " + this.scenarioObj.lineNumber + " without steps")
        }else{
            this.outline = outlineFlag;
            this.beforeScenario(keyword, statement, secionName);
        }
    }

    shouldSkip(){
        if(!this.tagExpParser.test( this.output.feature.tags.concat( this.tags))){
            this.skip = "current";
            return true;
        }
    }

    beforeScenario(keyword, statement, secionName){
        this.steps = [];
        this.stepDataTable = [];
        this.readingScenario = true;
        this.bgScenario = false;
        this.readingExamples = false;
        this.readingSteps = false;
        if(this.shouldSkip()){
            this.keyword = "";
            this.tags = []
            return;
        }else{
            this.scenarioCount++;
            const scenario = new Scenario( this.scenarioCount, keyword.toLowerCase(), secionName, statement, this.oldLineNumber); 
            scenario.tags = this.tags;
            this.scenarioObj = scenario;
            this.tags = [];
            if(this.output.feature.rules.length === 0){
                const ruleSection = new Rule("__default", -1);
                this.output.feature.rules.push(ruleSection);
                this.currentSection = ruleSection;
            }
            this.currentSection.scenarios.push(scenario);
        }

    }

    examples(keyword){
        if(this.tags.length > 0 || !this.outline || !this.readingSteps || this.bgScenario || this.steps.length === 0){
            //when tags come before
            //when not the part of scenario outline/template
            //when come just after scenario starts. No steps in between
            //when it is the part of Background section
            throw  new Error("Unexpected Examples section at linenumber " + this.oldLineNumber) 
        }else{
            this.readingExamples = true;
            this.readingSteps = false;
            this.examplesHeader = [];
        }
    }

    addDescription(line){
        //if(!this.bgScenario) Allow background to have description
            this.currentSection.description += "\n" +line;
    }

    recordTags(line){
        this.tags = this.tags.concat(line.split(/\s+/));
    }

    /**
     * To process Section name, statement and description
     */
    processLastSectionArea(){
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
     * This should be called for every row in examples
     * @param {array} dataObjKeys 
     * @param {array} dataObj 
     */
    processScenarioOutline(dataObjKeys, dataObj){
        this.processLastSectionArea(); //trigger `scenario` event
        this.processBgSteps();
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
        //this.keyword need to be reset so next section don't trigger event for last section
        if(this.nextLine && this.nextLine[0] !== "|") {
            this.outline = false;
            this.keyword = "";
        }
    }

    /**
     * Trigger `step` event for all the Background steps. 
     * And push the steps in current scenario
     * 
     * Background steps can't have data table, doc string or Examples' parameter
     */
    processBgSteps(){
        for (var i = 0; i < this.bg.steps.length; i++){
            let step = Object.assign({}, this.bg.steps[i]);
            step.scenarioId = this.scenarioObj.id;
            this.scenarioObj.steps.push(step);
            this.trigger("step", step);
        }
    }

    processStepArgument(){
        if(this.stepDocString.length > 0 && this.stepDataTable.length > 0) {
            throw  new Error("Only data table or doc string is allowed for step at line number " + this.stel.lineNumber)
        }else if(this.stepDocString.length > 0){
            this.step.argument = this.stepDocString;
        }else{
            this.step.argument = this.stepDataTable;
        }
        this.stepDocString = "";
        this.stepDataTable = [];
    }

    /**
     * Save step for further processing in case of Scenario outline
     * Otherwise process.
     * 
     * Called for each step of a scenario, scenario outline, background.
     */
    processCurrentStep(){
        if(this.outline){
            this.steps.push(this.step);
        }else{
            this.scenarioObj.steps.push(this.step);
            //don't trigger step event for background steps if bg steps are supposed to be clubbed
            if(!(this.bgScenario && this.options.clubBgSteps)){
                this.trigger('step', this.step);
            }
        }
    }
    
    currentStep(){
        return this.steps[ this.steps.length - 1];
    }

    trigger(keyword, data){
        //console.log(keyword, data);
        for(let i=0; i< this.events[keyword].length; i++){
            this.events[keyword][i](data);
        }
    }
    
    eofValidation(){
        if(this.scenarioCount === 0 && this.skip === ""){ // when no scenarios are found not when they are skipped due to tag expression
            throw  new Error( "No Scenario/Example found");
        }else if(this.outline){
            throw  new Error( "Scenario Outline/Template without Examples at the end of the file")
        }
    }
}
module.exports = FeatureParser;