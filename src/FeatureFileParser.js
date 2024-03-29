const ParsingError = require("./ParsingError");

const util = require("./util.js");
const Rule = require("./sections/Rule");
const Scenario = require("./sections/Scenario");
const ScenarioOutline = require("./sections/ScenarioOutline");
const Background = require("./sections/Background");
const Step = require("./sections/Step");
const defaultExpander = require("./ExamplesExpander");

const stepsRegex = new RegExp("^(Given|When|Then|And|But)\\s+(.*)")
const sectionRegex = new RegExp("\\s*(Scenario|Example|Scenario Outline|Scenario Template|Background|Rule)\\s*:(.*)")
const anySectionRegex = new RegExp("\\s*(.+?):(.*)")
const examplesRegex = new RegExp("^(Scenarios|Examples)\\s*:\\s*$")

//const stepsKeyword = ["Given", "When", "Then", "And", "But"];

class FeatureParser{

    constructor(options){
        this.options = Object.assign( { clubBgSteps: false }, options );
        this.outlineExpanders = [];
    }

    registerOutlineExpander(expander){
        this.outlineExpanders.push(expander);
    }

    _resetParameters(){
        this.lineNumber = 0;
        this.result = {};
        this.scenarioCount = 1;
        this.tags = [];
    }

    parse(fileContent){
        this._resetParameters();
        if(typeof fileContent !== 'string') throw new Error('Incompatible input type. String is expected.');
        this.lines = fileContent.split("\n");

        this.readFeatureSection();

        this.oldLine = this.lines[0];
        while(this.lineNumber<this.lines.length){
            const found = this.readBeginingOfASection(anySectionRegex);
            if(!found) break;
            this.readRuleAndBgSection();
            this.readScenarioOrScenarioOutline();
        }
        this.eofValidation();
        return this.result;
    }

    readFeatureSection(){
        let found = this.readBeginingOfASection(anySectionRegex);
        if(!found){
            throw new Error("Feature section is not found");
        }else if(this.section.keyword !== 'Feature'){
            throw new Error("Feature section was expected at line number " + this.lineNumber);
        }else{
            this.readDescription();
            this.result = {
                keyword: "Feature",
                description: this.section.description,
                statement: this.section.statement,
                lineNumber: this.section.lineNumber + 1,
                tags: this.tags,
                rules: []
            }
            this.tags = [];//tags are reset once consumed
        }
    }

    readRuleAndBgSection(){
        let rule;
        if(this.section.keyword === 'Rule'){
            if(this.result.rules.length > 0 && this.result.rules[0].statement === "__default"){
                throw new ParsingError("Unexpected Rule section at line number " + this.section.lineNumber, this.section.lineNumber);
            }
            this.validateTags();
            this.readDescription();
            rule = new Rule(this.section.statement, this.section.description, this.section.lineNumber + 1);
            const found = this.readBeginingOfASection();
            if(!found) throw new Error("Unexpected Rule section at the end of the file");
        }else if(this.result.rules.length === 0){
            rule = new Rule("__default");
        }else{
            //Scenario, Scenario Outline
            //Repeated background section
            return;
        }
        this.result.rules.push(rule);
        return this.readBackgroundSection();
    }

    validateTags(){
        if(this.tags.length > 0){
            throw  new ParsingError("Tags are not expected for "+ this.section.keyword +" section at line number " + this.section.lineNumber, this.section.lineNumber);
        }
    }

    readBackgroundSection(){
        if(this.section.keyword === 'Background'){
            this.validateTags();
            const rule = this.currentRule();
            rule.hasBgSection = true;
            this.readDescriptionForScenario();

            //if(this.options.clubBgSteps){
            rule.background = new Background(this.section.statement, this.section.description, this.section.lineNumber + 1);
            rule.background.steps = this.readSteps();
            const found = this.readBeginingOfASection();
            if(!found) throw new Error("Unexpected Background section at the end of the file");
        }
    }

    currentRule(){
        return this.result.rules[ this.result.rules.length - 1 ];
    }

    /**
     * ```
     * 
     * Example:
     @tag
     blank line
     #comment line
     Section: statement
     *
     */
    readBeginingOfASection(regex){
        //this.tags = [];
        this.section = {};
        for(;this.lineNumber < this.lines.length; this.lineNumber++){
            let line = this.lines[this.lineNumber].trim();
            if( line.length === 0  ) continue; //ignore empty lines
            else if( line[0] === '#' ) continue; //ignore comments
            else if( line[0] === '@'){
                this.tags = this.tags.concat(this.breakIntoTags(line));
            }else{
                let sRegex = sectionRegex;
                if(regex) sRegex = regex;
                const match = sRegex.exec(line);
                
                if(match){
                    this.section = {
                        keyword: match[1],
                        statement: match[2].trim(),
                        lineNumber: this.lineNumber
                    }
                    this.lineNumber++; //skip the current line as already read;
                    return true;
                }else{
                    throw new ParsingError("Unexpeted line at line number " + (this.lineNumber+1), this.lineNumber+1);
                }
            }
        }
        //EOF
        return false;
    }

    /**
     * 
     * @param {string} line 
     * @returns {boolean}
     */
    startingOfASection(line){
        if( line[0] === '@' || sectionRegex.test(line)) return true;
        return false;
    }

    startingOfAnySection(line){
        if( line[0] === '@' || anySectionRegex.test(line)) return true;
        return false;
    }

    readDescription(){
        let description = [];
        for(;this.lineNumber < this.lines.length; this.lineNumber++){
            let line = this.lines[this.lineNumber].trim();
            if( line[0] === '#' && line[1] === '>' ) this.instruction = line.substr(2).trim(); 
            else if(line[0] === '#') continue;
            else if( this.startingOfAnySection(line)) break;
            else description.push(line);
        }
        this.section.description = description.join("\n").trim();
    }

    readScenarioOrScenarioOutline(){
        const section = this.section.keyword;
        const scenarios = this.currentRule().scenarios;

        if(section === "Scenario" || section === "Example"){
            const scenario = this.readScenario();
            scenarios.push(scenario);
        }else if(section === "Scenario Outline" || section === "Scenario Template"){
            const template = this.readScenario();

            const scenarioOutline = new ScenarioOutline(template.id, template.keyword, template.statement, template.instruction,  template.lineNumber);
            scenarioOutline.description = template.description;
            scenarioOutline.tags = template.tags;
            this.currentRule().scenarios.push(scenarioOutline);

            if(template.steps.length === 0) throw new ParsingError("No step is found for " + section + " at line number " + scenario.lineNumber, scenario.lineNumber);
            
            const examples = this.readListOfExamples();
            scenarioOutline.examples = examples;

            let scenarios;
            for (let i = 0; i < this.outlineExpanders.length; i++) {
                try{
                    scenarios = this.outlineExpanders[i](template, examples);
                }catch(err){
                    const errMsg = "🤦 Error in processing Examples secton through custom expander for outline at line number " + scenarioOutline.lineNumber;
                    throw new ParsingError(errMsg, scenarioOutline.lineNumber);
                }
                if(!scenarios) continue;
            }

            if(!scenarios){
                scenarios = defaultExpander(template, examples);
            }
            scenarioOutline.steps = template.steps;
            scenarioOutline.expanded = scenarios;
            
        }else if(this.lineNumber === this.lines.length){
            throw new ParsingError("Unexpected section at the end of the file", this.section.lineNumber);
        }else{
            throw new ParsingError("Unexpected section at line number " + (this.section.lineNumber+1), this.section.lineNumber+1);
        }
    }

    readScenario(){
        this.readDescriptionForScenario();
        const scenario = new Scenario(this.scenarioCount++, this.section.keyword, this.section.statement, this.instruction, this.section.lineNumber+1);
        scenario.description = this.section.description;
        this.instruction = null;
        let steps=[];
        const rule = this.currentRule();
        if(rule.hasBgSection && this.options.clubBgSteps){
            steps = steps.concat(rule.background.steps);
        }
        steps = steps.concat(this.readSteps());
        scenario.steps = steps;
        scenario.tags = this.tags;
        this.tags = [];
        return scenario;
    }

    readDescriptionForScenario(){
        let description = [];
        for(;this.lineNumber < this.lines.length; this.lineNumber++){
            let line = this.lines[this.lineNumber].trim();
            if(line[0] === '#' && line[1] === '>') break;
            else if(line[0] === '#') continue;
            else if( stepsRegex.test(line)) break;
            else if( this.startingOfAnySection(line)) //A section without steps
                throw new ParsingError("Unexpected section at line number "+ (this.lineNumber+1), this.lineNumber+1)
            else description.push(line);
        }
        this.section.description = description.join("\n").trim();
    }

    readSteps(){//read until EOF or new section is found
        const steps = [];
        this.currentStep = {};
        for(;this.lineNumber < this.lines.length; this.lineNumber++){
            const line = this.lines[this.lineNumber].trim();
            const result = this.readAStep(line);
            if(result === true) continue;
            else if(result === false) break;
            else{
                steps.push(result);
            }
        }
        return steps;
    }

    readAStep(line){
        if(line.length > 0){
            if(line[0] === '#' && line[1] === '>') {
                this.instruction = line.substr(2).trim(); 
            }else if(line[0] === '#') return true;
            else if(line.startsWith('"""') || line.startsWith('```') ) {
                this.readDocString();
                this.instruction = "";
            }else if(line[0] === '|') {
                this.readDataTable();
                this.instruction = "";
            }else{
                const match = stepsRegex.exec(line);
                if(match){
                    this.currentStep = new Step(match[1],match[2],this.lineNumber+1);
                    if(this.instruction) this.currentStep.instruction = this.instruction;
                    this.instruction = "";
                    return this.currentStep;
                }else{
                    //Either next section or invalid step
                    return false;
                }
            } 
        }
        return true;
    }

    readDocString(){
        const docString = [];
        const startingLine = this.lines[this.lineNumber].trim();
        const startingLineNumber = this.lineNumber;
        for(this.lineNumber++;this.lineNumber < this.lines.length; this.lineNumber++){
            const line = this.lines[this.lineNumber].trim();
            if(line === startingLine ){
                break;
            }else{
                docString.push(line);
            }
        }
        if(this.currentStep.arg){
            throw new ParsingError("DocString is not expected at line number " + startingLineNumber, startingLineNumber)
        }
        this.currentStep.arg = {
            content: docString.join("\n"),
            lineNumber: startingLineNumber+1,
            type: "DocString"
        }
        if(this.instruction) {
            this.currentStep.arg.instruction = this.instruction;
        }
    }

    readDataTable(){
        const dataTable = [];
        const startingLineNumber = this.lineNumber;
        for(this.lineNumber;this.lineNumber < this.lines.length; this.lineNumber++){
            const line = this.lines[this.lineNumber].trim();
            if(line[0] === "#") continue;
            else if(line[0] === '|'){
                dataTable.push( util.splitOnPipe(line));
            }else{
                break;
            }
        }
        if(this.currentStep.arg){
            throw new ParsingError("DataTable is not expected at line number " + startingLineNumber, startingLineNumber)
        }else{
            this.lineNumber--;
        }
        this.currentStep.arg = {
            content: dataTable,
            lineNumber: startingLineNumber+1,
            type: "DataTable"
        }
        if(this.instruction) {
            this.currentStep.arg.instruction = this.instruction;
        }
    }

    readListOfExamples(){
        const listOfExamples = [];
        for(this.lineNumber;this.lineNumber < this.lines.length; this.lineNumber++){
            let line = this.lines[this.lineNumber];
            if(line) line = line.trim();

            if(line[0] === '#' && line[1] === '>') this.instruction = line;
            else if(line[0] === '@') {
                this.tags = this.tags.concat(this.breakIntoTags(line));
            }else if(line.length === 0 || line[0] === '#')continue;
            else if(line.match(examplesRegex)){
                const examplesTable = this.readExamples();
                if(this.instruction) examplesTable.instruction = this.instruction;
                examplesTable.tags = this.tags;
                this.tags = [];
                listOfExamples.push(examplesTable);
                this.instruction = "";
                this.lineNumber--;
            }else{
                break;
            }
        }
        if(listOfExamples.length === 0){
            throw new ParsingError("Scenario Outline Examples were expected at line number " + (this.lineNumber+1), this.lineNumber+1);
        }
        
        return listOfExamples;
    }
    readExamples(){
        const example = {
            lineNumber: this.lineNumber+1,
            rows: []
        }
        const startingLineNumber = this.lineNumber;
        for(this.lineNumber++;this.lineNumber < this.lines.length; this.lineNumber++){
            const line = this.lines[this.lineNumber].trim();
            if(line.length === 0 || line[0] === '#')continue;
            else if(line[0] === '|'){
                const row = {
                    lineNumber: this.lineNumber + 1
                }
                
                if(example.rows.length === 0 ){
                    //split Header Row
                    row.regex = util.splitExampleHeader(line);
                    row.cells = util.splitOnPipe(line);
                }else{
                    //split Data row
                    row.cells = util.splitOnPipe(line);
                    if(row.cells.length !== example.rows[0].cells.length)
                        throw new ParsingError("Cells count mismatch at line number " + (this.lineNumber+1), this.lineNumber+1)
                }
                example.rows.push(row);
            }else{
                break;
            }
        }
        if(example.rows.length <2){
            throw new ParsingError("Insufficient rows in Examples at line number " + (startingLineNumber+1), startingLineNumber+1)
        }else{
            return example;
        }
    }

    //TODO: separate it
    breakIntoTags(line){
        const commentIndex = line.indexOf(" #");
        if(commentIndex > -1){ //remove comment
            line = line.substr(0, commentIndex);
        }

        let tags=[];
        const tokens = line.split(/\s+/);
        for(let i=0; i<tokens.length; i++){
            if(tokens[i][0] !== "@") 
                throw new ParsingError("Tags are not allowed with white spaces at line number "+ (this.lineNumber+1), this.lineNumber);
            else tags = tags.concat(tokens[i].match(/@[^@]+/g));
        }
        return tags;
    }

    eofValidation(){
        if(this.tags.length > 0){
            throw new ParsingError("Unexpected line at line number " + (this.lineNumber+1), this.lineNumber+1)
        }
    }
}

module.exports = FeatureParser;