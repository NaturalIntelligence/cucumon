const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Events:", function () {

    it("should trigger scenario and steps repeatagely for each Scenario outline example and support special chars in value", async function(done) {
        const expectedEventSeq = [ 
            'feature',
            'scenario outline',
                'Given',
                'And',
            'scenario outline',
                'Given',
                'And',
            'scenario outline',
                'Given',
                'And',
            'data table, doc string and special chars',
                'Given',
                'When',
                'And',
                'And',
                'And',
                'And',
        ];

        let output = testContent( expectedEventSeq);
        //console.log(JSON.stringify(output.feature, null,4 ));
        expect(output.feature.rules.length).toBe(1)
        const rule = output.feature.rules[0]
        expect(rule.statement).toBe("__default")
        expect(rule.scenarios.length).toBe(4);
        
        //Scenario outline
        const example1 = rule.scenarios[0];
        const example2 = rule.scenarios[1];
        const example3 = rule.scenarios[2];

        //All examples whould have same id
        expect(example1.id).toBe(1);
        expect(example2.id).toBe(1);
        expect(example3.id).toBe(1);
        
        expect(example1.steps.length).toBe(2);
        expect(example2.steps.length).toBe(2);
        expect(example3.steps.length).toBe(2);

        //check if the data is correctly passed
        expect(example1.steps[1].statement).toBe('I can pass "" with spceial characters');
        expect(example2.steps[1].statement).toEqual('I can pass "new\\nline\\ttab\\b" with spceial characters');
        expect(example3.steps[1].statement).toBe('I can pass "left|right|" with spceial characters');

        //Scenario

        testStream( expectedEventSeq, {}, done);
    
    });

    it("should trigger scenario and steps repeatagely for each Scenario outline example and support special chars in value", async function(done) {
        const expectedEventSeq = [ 
            'feature',
            'data table, doc string and special chars',
                'Given',
                'When',
                'And',
                'And',
                'And',
                'And',
        ];

        let output = testContent( expectedEventSeq, {
            tagExpression: "@focus"
        });
        //console.log(JSON.stringify(output.feature, null,4 ));
        expect(output.feature.rules.length).toBe(1)
        const rule = output.feature.rules[0]
        expect(rule.statement).toBe("__default")
        expect(rule.scenarios.length).toBe(1);
        
        //Scenario
        expect(rule.scenarios[0].statement).toBe("data table, doc string and special chars");
        expect(rule.scenarios[0].steps.length).toBe(6);
        //should have data table
        let rows = rule.scenarios[0].steps[0].argument;
        expect(rows[0]).toEqual(["with","single","data table","line"]);

        rows = rule.scenarios[0].steps[1].argument;

        expect(rows[0][0]).toBe("");
        expect(rows[0][1]).toBe("empty");
        
        expect(rows[1][0]).toBe("new\\nline\\ttab\\b");
        expect(rows[1][1]).toBe("with backslash chars");
        
        expect(rows[2][0]).toBe("left|right|");
        expect(rows[2][1]).toBe("with pipe sign");

        const docStringArr = rule.scenarios[0].steps[2].argument.split("\n");
        //expect(docStringArr[0]).toBe("This text will be trimmed from starting and       end");
        expect(docStringArr[1]).toBe("| with pipe");
        expect(docStringArr[2]).toBe("# with hash");
        expect(docStringArr[3]).toBe("Feature: something");
        expect(docStringArr[4]).toBe('and """ are allowed in between "');
        
        expect(rule.scenarios[0].steps[3].statement).toBe('I can specify a step');
        expect(rule.scenarios[0].steps[4].statement).toBe('I can give "  " in quotes');
        expect(rule.scenarios[0].steps[5].statement).toBe('I can pass 😀 unicode');


        testStream( expectedEventSeq, { tagExpression: "@focus" }, done);
    
    });

});

function testStream(expectedEventSeq, options, done){
    const parser = new FeatureFileParser(options);
    const stepWords = [];

    registerEvents(stepWords,parser);

    parser.on("end", (result) => {
        //console.log(stepWords);
        expect(stepWords).toEqual(expectedEventSeq);
        done();
    });

    const filePath = path.join( __dirname, "./features/Inputs.feature");
    const inputStream = fs.createReadStream( filePath );
    parser.parseFile(inputStream) ;
    //console.log(JSON.stringify(parser.output,null,4));
}

function testContent(expectedEventSeq, options){
    const parser = new FeatureFileParser(options);
    const stepWords = [];

    registerEvents(stepWords,parser);

    const filePath = path.join( __dirname, "./features/Inputs.feature");
    const content = fs.readFileSync( filePath );
    const output = parser.parse(content.toString()) ;

    //console.log(stepWords);
    expect(stepWords).toEqual(expectedEventSeq);

    return output;
    //console.log(JSON.stringify(parser.output,null,4));
}

function registerEvents(eventsArr, parser){
    parser.on("feature", section => {
        eventsArr.push(section.keyword);
    })
    
    parser.on("background", section => {
        eventsArr.push(section.keyword);
    })
    
    parser.on("rule", section => {
        eventsArr.push(section.keyword);
    })

    parser.on("scenario", scenario => {
        eventsArr.push(scenario.statement);
    })
    
    parser.on("step", step => {
        eventsArr.push(step.keyword);
    })
}