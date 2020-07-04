const FeatureFileParser = require('../src/FeatureFileParser');
var strToStream = require('string-to-stream')
/*
Check for
* last step line
* last Examples row
* last Data Table row
* End of Doc String 
*/
const blankLine = `
            
`;
describe("EOL:", function () {

    describe("last step", function() {
        const expectedEventSeq = [
            "feature",
            "Scenario Outline description",
                "When",
                "Then",
        ]
        let featureContent = `Feature: Description
            Scenario: Scenario Outline description
                When there is a <word> in 
                Then it should be parsed`;
        
        it("non blank EOL", async function(done) {
            testContent( featureContent, expectedEventSeq, {});
            //console.log(JSON.stringify(output.feature, null,4 ));
            testStream( strToStream(featureContent), expectedEventSeq, {}, done);
        });
        it("blank EOL", async function(done) {
            featureContent +=blankLine;
                
            testContent( featureContent, expectedEventSeq, {});
            //console.log(JSON.stringify(output.feature, null,4 ));
            testStream( strToStream(featureContent), expectedEventSeq, {}, done);
        });
    });

    describe("last example row", function() {
        const expectedEventSeq = [
            "feature",
            "Scenario Outline description",
                "When",
                "Then",
        ]
        let featureContent = `Feature: Description
            Scenario Outline: Scenario Outline description
                When there is a <word> in 
                Then it should be parsed
        
                Examples:
                |word|
                |description|`;

        it("non blank EOL", async function(done) {
            testContent( featureContent, expectedEventSeq, {});
            //console.log(JSON.stringify(output.feature, null,4 ));
            testStream( strToStream(featureContent), expectedEventSeq, {}, done);
        });
        it("blank EOL", async function(done) {
            featureContent +=blankLine;
                
            testContent( featureContent, expectedEventSeq, {});
            //console.log(JSON.stringify(output.feature, null,4 ));
            testStream( strToStream(featureContent), expectedEventSeq, {}, done);
        });
    });

    describe("last step with doc string", function() {
        const expectedEventSeq = [
            "feature",
            "Scenario Outline description",
                "When",
                "Then",
        ]
        let featureContent = `Feature: Description
            Scenario: Scenario Outline description
                When there is a <word> in 
                Then it should be parsed with
                """
                doc string
                """`;

        it("non blank EOL", async function(done) {
            testContent( featureContent, expectedEventSeq, {});
            //console.log(JSON.stringify(output.feature, null,4 ));
            testStream( strToStream(featureContent), expectedEventSeq, {}, done);
        });
        it("blank EOL", async function(done) {
            featureContent +=blankLine;
                
            testContent( featureContent, expectedEventSeq, {});
            //console.log(JSON.stringify(output.feature, null,4 ));
            testStream( strToStream(featureContent), expectedEventSeq, {}, done);
        });
    });

    describe("last step with dataTable", function() {
        const expectedEventSeq = [
            "feature",
            "Scenario Outline description",
                "When",
                "Then",
        ]
        let featureContent = `Feature: Description
            Scenario: Scenario Outline description
                When there is a <word> in 
                Then it should be parsed with
                |data | table|`;

        it("non blank EOL", async function(done) {
            testContent( featureContent, expectedEventSeq, {});
            //console.log(JSON.stringify(output.feature, null,4 ));
            testStream( strToStream(featureContent), expectedEventSeq, {}, done);
        });
        it("blank EOL", async function(done) {
            featureContent +=blankLine;
                
            testContent( featureContent, expectedEventSeq, {});
            //console.log(JSON.stringify(output.feature, null,4 ));
            testStream( strToStream(featureContent), expectedEventSeq, {}, done);
        });
    });

});

function testStream(inputStream , expectedEventSeq, options, done){
    const parser = new FeatureFileParser(options);
    const stepWords = [];

    registerEvents(stepWords,parser);

    parser.on("end", (result) => {
        //console.log(stepWords);
        expect(stepWords).toEqual(expectedEventSeq);
        done();
    });

    parser.parseFile(inputStream) ;
    //console.log(JSON.stringify(parser.output,null,4));
}

function testContent(content, expectedEventSeq, options){
    const parser = new FeatureFileParser(options);
    const stepWords = [];

    registerEvents(stepWords,parser);

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