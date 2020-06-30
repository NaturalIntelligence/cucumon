const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Tags", function () {

    it("should process all scenarios when no tag expression is given or feature level tag matches", async function(done) {
        const expectedEventSeq = [ 
            'feature',
            'background',
                'Given',
            'rule',
            'scenario outline',
                'Given',
                'And',
            'scenario outline',
                'Given',
                'And',
            'focused tag',
                'Given',
                'When',
            'other tag',
                'Given',
                'When',
            'rule',
            'without tag',
                'Given',
                'When',
                'Then',
            'other tag 2',
                'Given',
                'When',
                'And' 
        ];

        let output = testContent( expectedEventSeq, {
            tagExpression: "@all"
        });
        expect(output.feature.rules[0].scenarios.length).toBe(4)
        expect(output.feature.rules[1].scenarios.length).toBe(2)
        expect(output.feature.rules.length).toBe(2)
        testStream( expectedEventSeq, {
            tagExpression: "@all"
        }, done);
        
        output = testContent( expectedEventSeq,  {
            tagExpression: ""
        });
        expect(output.feature.rules[0].scenarios.length).toBe(4)
        expect(output.feature.rules[1].scenarios.length).toBe(2)
        expect(output.feature.rules.length).toBe(2)
        testStream(expectedEventSeq, {
            tagExpression: ""
        }, done);
    });
    
    it("should skip all scenarios but not feature, rule, and background", async function(done) {
        const expectedEventSeq = [
            'feature',
            'background',
                'Given',
            'rule',
            'rule',
        ];

        const output = testContent( expectedEventSeq, {
            tagExpression: "not @all"
        });
        expect(output.feature.rules[0].scenarios.length).toBe(0);
        expect(output.feature.rules[1].scenarios.length).toBe(0);
        expect(output.feature.rules.length).toBe(2);

        testStream( expectedEventSeq, {
            tagExpression: "not @all"
        }, done);
    });
    
    it("should skip all scenarios but not feature, and rule backgorund steps are set to be clubbed with scenario steps", async function(done) {
        const expectedEventSeq = [
            'feature',
            'rule',
            'rule',
        ];

        const output = testContent(expectedEventSeq, {
            clubBgSteps: true,
            tagExpression: "not @all"
        });
        expect(output.feature.rules[0].scenarios.length).toBe(0);
        expect(output.feature.rules[1].scenarios.length).toBe(0);
        expect(output.feature.rules.length).toBe(2);
        testStream( expectedEventSeq, {
            clubBgSteps: true,
            tagExpression: "not @all", 
        }, done);
    });

    it("should process @focus scenario only", async function(done) {
        const expectedEventSeq = [
            'feature',
            'background',
                'Given',
            'rule',
            'focused tag',
                'Given',
                'When',
            'rule',
        ];

        const output = testContent( expectedEventSeq, {
            tagExpression: "@focus"
        });
        expect(output.feature.rules[0].scenarios.length).toBe(1)
        expect(output.feature.rules[1].scenarios.length).toBe(0)
        expect(output.feature.rules.length).toBe(2)
        testStream( expectedEventSeq, {
            tagExpression: "@focus"
        }, done);
    });

    it("should process @other scenarios only", async function(done) {
        const expectedEventSeq = [
            'feature',
            'background',
                'Given',
            'rule',
            'other tag',
                'Given',
                'When',
            'rule',
            'other tag 2',
                'Given',
                'When',
                'And',
        ];

        const output = testContent( expectedEventSeq, {
            tagExpression: "@other"
        });
        expect(output.feature.rules[0].scenarios.length).toBe(1)
        expect(output.feature.rules[1].scenarios.length).toBe(1)
        expect(output.feature.rules.length).toBe(2)
        testStream( expectedEventSeq, {
            tagExpression: "@other"
        }, done);
    });
    
    it("should process @all but not @other scenarios only", async function(done) {
        const expectedEventSeq = [
            'feature',
            'background',
                'Given',
            'rule',
            'scenario outline',
                'Given',
                'And',
            'scenario outline',
                'Given',
                'And',
            'focused tag',
                'Given',
                'When',
            'rule',
            'without tag',
                'Given',
                'When',
                'Then',
        ];

        const output = testContent( expectedEventSeq, {
            tagExpression: "@all but not @other"
        });
        expect(output.feature.rules[0].scenarios.length).toBe(3)
        expect(output.feature.rules[1].scenarios.length).toBe(1)
        expect(output.feature.rules.length).toBe(2)
        testStream( expectedEventSeq, {
            tagExpression: "@all but not @other"
        }, done);
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

    const filePath = path.join( __dirname, "./features/Tags.feature");
    const inputStream = fs.createReadStream( filePath );
    parser.parseFile(inputStream) ;
    //console.log(JSON.stringify(parser.output,null,4));
}

function testContent(expectedEventSeq, options){
    const parser = new FeatureFileParser(options);
    const stepWords = [];

    registerEvents(stepWords,parser);

    const filePath = path.join( __dirname, "./features/Tags.feature");
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