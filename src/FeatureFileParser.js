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
                that.readLine(null);
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
        if(line){//when last line is not empty
            this.readLine(line.trim());
        }
        this.readLine(null);
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
        if(line == null || line.length !== 0){ // line would be null in case of EOF
            if(!this.oldLine) { //first non-blank line
                this.oldLine = line;
            }else{
                if( this.oldLine.indexOf("@") === 0){
                    this.recordTags(this.oldLine);
                }else if(this.readingDocString){
                    if(this.oldLine === '"""'){
                        this.stepDocString = this.stepDocString.substring(1); //remove first \n
                        this.processStepArgument();
                        this.processCurrentStep();
                        this.readingDocString = false;
                    }else{
                        this.stepDocString += "\n" + this.oldLine;
                    }
                }else{
                    if(line != null && line[0] === '#') return;
                    //nextLine points to next non-empty and non-commented line
                    //This is being used to determine 
                    //* if Examples rows are end
                    //* if next statement is dataTable ot docString
                    this.nextLine = line; 

                    this.sectionMatch = sectionRegex.exec(this.oldLine);
    
                    //Skip if tag doesn't match
                    if(this.sectionMatch && this.skip && this.sectionMatch[1] !== "Examples" && this.sectionMatch[1] !=="Scenarios" ){//start of a section
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
        
        if(this.sectionMatch){
            this.markSectionBegining(line);
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
                
                if(this.nextLine != null && (this.nextLine[0] === "|" || this.nextLine === '"""' )){
                    //hold
                }else{
                    this.processCurrentStep();
                }
            }else if(this.readingSteps){
                if(line[0] === "|"){//data table
                    this.stepDataTable.push( util.splitOnPipe(line));
                    if(this.nextLine == null || this.nextLine[0] !== "|"){
                        this.processStepArgument();
                        this.processCurrentStep();
                    }
                }else if(line === '"""' ){//docStrng
                    this.readingDocString = true;
                    this.stepDocString = "";
                }else{//A step with no matching keyword or start
                    throw  new Error("Unexpected step at linenumber " + this.oldLineNumber)
                }
            }else if(this.readingExamples && line[0] === "|"){
                if(this.examplesHeader.length === 0){
                    this.examplesHeader = util.splitExampleHeader(line);
                    this.examplesCount = 0;
                }else{
                    if(this.examplesCount === 0){
                        this.oldScenario = this.scenarioObj;
                    }else{
                        this.createScenario(this.oldScenario.keyword, this.oldScenario.secionName, this.oldScenario.statement);
                    }
                    this.examplesCount++;
                    this.processScenarioOutline(this.examplesHeader, util.splitOnPipe(line));
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

    markSectionBegining(line){
        const keyword = this.sectionMatch[1];
        let statement = this.sectionMatch[2];
        this.sectionMatch = null;//reset
        if(statement) statement = statement.trim();

        if(keyword.length > 10 && (keyword === "Scenario Outline" || keyword == "Scenario Template")){
            this.processLastSectionArea();
            this.keyword = "Scenario";
            this.scenario(this.keyword, statement, keyword, true);
        }else if( keyword === "Scenario" || keyword === "Example" ){
            this.processLastSectionArea();
            this.keyword = keyword;
            this.scenario(this.keyword, statement, keyword, false);
        }else if( keyword === "Scenarios" || keyword === "Examples" ){
            this.processLastSectionArea();
            this.keyword = "Scenario"; // To trigger `scenario` event for each row of Examples
            this.examples(this.keyword, statement);
        }else if( keyword === "Background"){
            this.processLastSectionArea();
            this.keyword = keyword;
            this.background(this.keyword, statement);
        }else if( keyword === "Rule"){
            this.processLastSectionArea();
            this.keyword = keyword;
            this.rule(this.keyword, statement);
        }else if( keyword === "Feature"){
            this.processLastSectionArea();
            this.keyword = keyword;
            this.feature(this.keyword, statement);
        }else{
            //when description has : after first word
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
        //when comes at first position
        this.itShouldComeAfterFeatureSection(keyword);
        if(this.tags.length > 0){
            //when tags come before
            throw  new Error("Rule section must not have tags, at linenumber " + this.oldLineNumber)
        }else {
            const rules = this.output.feature.rules;

            if(rules.length > 0 && rules[ rules.length - 1].scenarios.length === 0 && rules[ rules.length - 1].scenariosSkipped === 0 ){
                //when repeated
                throw  new Error("Repeated Rule section at linenumber " + this.oldLineNumber)
            }else if(rules.length > 0 && rules[0].statement === "__default" ){
                //when previous scenarios are not grouped in a rule
                throw  new Error("Unexpected Rule section at linenumber " + this.oldLineNumber)
            }else{
                const ruleSection = new Rule(statement, this.oldLineNumber);
                rules.push(ruleSection);
                this.currentSection = ruleSection;
                this.readingSteps = false;
            }
        }
    }

    background(keyword, statement){
        //when comes at first position
        this.itShouldComeAfterFeatureSection(keyword);
        if(this.tags.length > 0){
            //when tags come before
            throw  new Error("Background section must not have tags, at linenumber " + this.oldLineNumber)
        }else if(this.bgScenario || this.readingScenario){
            //when repeated
            //when come after any scenario (outline)
            throw  new Error("Unexpected Background section at linenumber " + this.oldLineNumber)
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

    createScenario(keyword, secionName, statement){
        const scenario = new Scenario( this.scenarioCount, keyword.toLowerCase(), secionName, statement, this.oldLineNumber); 
        scenario.tags = this.tags;
        this.scenarioObj = scenario;
        this.currentSection.scenarios.push(scenario);
    }
    beforeScenario(keyword, statement, secionName){
        this.steps = [];
        this.stepDataTable = [];
        this.readingScenario = true;
        this.bgScenario = false;
        this.readingExamples = false;
        this.readingSteps = false;
        if(this.shouldSkip()){
            this.currentSection.scenariosSkipped++;
            this.keyword = "";
            this.tags = []
            return;
        }else{
            this.scenarioCount++;
            if(this.output.feature.rules.length === 0){
                const ruleSection = new Rule("__default", -1);
                this.output.feature.rules.push(ruleSection);
                this.currentSection = ruleSection;
            }
            this.createScenario(keyword, secionName, statement);
            this.tags = [];
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
        let obj;
        if(this.keyword[0] === "B" || this.keyword[0] === "S"){
            obj = this.scenarioObj;
        }else{
            obj = this.currentSection;
        }
        if(obj.description === "") {
            obj.description = line;
        }else{
            obj.description += "\n" +line;
        }
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
                this.readingScenario = false;
                this.readingSteps = false;
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
        if(this.nextLine == null || this.nextLine[0] !== "|") {
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
        if(this.step.argument) {
            throw  new Error("Only data table or doc string is allowed for step at line number " + this.step.lineNumber)
        }else if(this.stepDocString.length > 0){
            this.step.argument = this.stepDocString;
        }else{
            this.step.argument = this.stepDataTable;
        }
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

    trigger(keyword, data){
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