const Step = require("./sections/Step");
const Scenario = require("./sections/Scenario");

module.exports = function(template, examples, insProcessor){
    const scenarios = []
    for(let table_i=0; table_i<examples.length; table_i++){ //for each example row
        const examplesTable = examples[table_i].rows;
        for(let i=1; i<examplesTable.length; i++){ //for each example row
            let scenarioStatement = resolveWithExample(template.statement, examplesTable[0], examplesTable[i]);
            const steps = Array(template.steps.length);

            for(let j=0; j< template.steps.length; j++){//for each step
                const step = new Step(template.steps[j].keyword
                    , resolveWithExample(template.steps[j].statement, examplesTable[0], examplesTable[i])
                    , template.steps[j].lineNumber
                    , template.steps[j].scenarioId);
                
                const arg = template.steps[j].arg;
                if(arg){
                    step.arg = {
                        type : arg.type,
                        lineNumber : arg.lineNumber
                    };
                    
                    let argType;
                    //TODO: change it to arg.type
                    if(arg.type === "DocString"){//doc string
                        step.arg.content = resolveWithExample(arg.content, examplesTable[0], examplesTable[i]);
                    }else{//dataTable
                        step.arg.content = resolveDataTableWithExample(arg.content, examplesTable[0], examplesTable[i]);
                    }
                    if(arg.instruction && arg.instruction.length > 0) {
                        step.arg.instruction = arg.instruction;
                        insProcessor.process(arg.type, arg.instruction, step);
                    }
                    
                }
                steps[j] = step;
            }
            //create new scenario
            const scenario = new Scenario(template.id, template.keyword, scenarioStatement, template.lineNumber);
            scenario.description = template.description;
            scenario.steps = steps;
            scenario.tags = template.tags;
            scenario.examplesLineNumber = [examplesTable[i].lineNumber];
            scenario.tags = examples[table_i].tags.concat(template.tags);
            if(template.instruction) scenario.instruction = template.instruction;

            scenarios.push(scenario);
        }
    }
    return scenarios;
}


function resolveDataTableWithExample(dtable, exampleHeaderRow, exampleDataRow){
    const newDT = Array(dtable.length);
    for(let row_i=0; row_i<dtable.length; row_i++){
      newDT[row_i] = Array(dtable[row_i].length);
      for(let cell_j=0; cell_j<dtable[row_i].length; cell_j++){
        newDT[row_i][cell_j] = resolveWithExample(dtable[row_i][cell_j], exampleHeaderRow, exampleDataRow);
      }
    }
    return newDT;
}

function resolveWithExample(str, exampleHeaderRow, exampleDataRow){
    for(let col=0; col<exampleDataRow.cells.length; col++){ // for each column in example row
        str = str.replace(exampleHeaderRow.regex[col], exampleDataRow.cells[col]);
    }
    return str;
}