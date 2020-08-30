const Step = require("./sections/Step");
const Scenario = require("./sections/Scenario");

module.exports = function(template, examples, insProcessor){
    const scenarios = []
    for(let table_i=0; table_i<examples.length; table_i++){ //for each example row
        const examplesTable = examples[table_i].rows;
        for(let i=1; i<examplesTable.length; i++){ //for each example row
            let scenarioStatement = resolveWithExample(template.statement, examplesTable, i);
            const steps = Array(template.steps.length);

            for(let j=0; j< template.steps.length; j++){//for each step
                const step = new Step(template.steps[j].keyword
                    , resolveWithExample(template.steps[j].statement, examplesTable, i)
                    , template.steps[j].lineNumber
                    , template.steps[j].scenarioId);
                
                const arg = template.steps[j].arg;
                if(arg){
                    step.arg = {
                        type : arg.type,
                        lineNumber : arg.lineNumber
                    };
                    
                    let argType;
                    if(typeof arg.content === "string"){//doc string
                        step.arg.content = resolveWithExample(arg.content, examplesTable, i);
                        argType = "doc-string";
                    }else{//dataTable
                        step.arg.content = resolveDataTableWithExample(arg.content, examplesTable, i);
                        argType = "data-table";
                    }
                    if(arg.instruction && arg.instruction.length > 0) {
                        step.arg.instruction = template.steps[j].arg.instruction;
                        if(insProcessor[argType] && insProcessor[argType][arg.instruction]){
                            insProcessor[argType][arg.instruction](step.arg);
                        }
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


function resolveDataTableWithExample(dtable, exampleTable, rowIndex){
    for(let i=0; i<dtable.length; i++){
      for(let j=0; j<dtable[i].length; j++){
        dtable[i][j] = resolveWithExample(dtable[i][j], exampleTable, rowIndex);
      }
    }
    return dtable;
}

function resolveWithExample(str, exampleTable, rowIndex){
    const exampleHeaderRow = exampleTable[0];
    const exampleDataRow = exampleTable[rowIndex];
    for(let col=0; col<exampleDataRow.cells.length; col++){ // for each column in example row
        str = str.replace(exampleHeaderRow.regex[col], exampleDataRow.cells[col]);
    }
    return str;
}