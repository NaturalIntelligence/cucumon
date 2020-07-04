const FeatureFileParser = require('../src/FeatureFileParser');
var strToStream = require('string-to-stream')

describe("Description", function () {

    it("can appear with Rule section", async function(done) {
        const expectedEventSeq = [
            "feature",
            "background",
            "Given",
            "rule",
            "Scenario description",
                "When",
                "Then",
            "Scenario Outline description",
                "When",
                "Then",
            "Scenario Outline description",
                "When",
                "Then",
        ]

        const featureContent = `Feature: Description
        This is the multiline description
        which can have : in between
        #but: is not allowed
        
        Background: Background description

        can also have multiline description
        with : in between 1
        
        Given this feature file
        
        Rule: Rule description
        Given this is description
        This is the multiline description
        which can have : in between 1
        
        
            Scenario: Scenario description
            can also hav description
            with : in between 2
        
            When there is a description in scenario
            Then it should be parsed
            
            Scenario Outline: Scenario Outline description
            can also hav description
            with : in between 3
        
            When there is a <word> in 
            Then it should be parsed
        
            Examples:
            |word|
            |description|
            |description again|
            
        `;

        const output = testContent( featureContent, expectedEventSeq, {});
        //console.log(JSON.stringify(output.feature, null,4 ));
        
        expect(output.feature.description).toBe("This is the multiline description\nwhich can have : in between");
        expect(output.feature.background.description).toBe("can also have multiline description\nwith : in between 1");
        expect(output.feature.rules[0].description).toBe("Given this is description\nThis is the multiline description\nwhich can have : in between 1");
        expect(output.feature.rules[0].scenarios[0].description).toBe("can also hav description\nwith : in between 2");
        expect(output.feature.rules[0].scenarios[1].description).toBe("can also hav description\nwith : in between 3");
        testStream( strToStream(featureContent), expectedEventSeq, {}, done);
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