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
    const parser = new FeatureFileParser();
    describe("last step", function() {

        let featureContent = `Feature: Description
            Scenario: Scenario Outline description
                When there is a <word> in 
                Then it should be parsed`;
        
        const expected = {
            "feature": {
                "keyword": "Feature",
                "description": "",
                "statement": "Description",
                "lineNumber": 1,
                "tags": [],
                "rules": [{
                    "keyword": "Rule",
                    "statement": "__default",
                    "scenarios": [{
                        "keyword": "Scenario",
                        "statement": "Scenario Outline description",
                        "description": "",
                        "lineNumber": 2,
                        "id": 1,
                        "steps": [
                            {
                                "keyword": "When",
                                "statement": "there is a <word> in",
                                "lineNumber": 3,
                                "arg": null
                            },
                            {
                                "keyword": "Then",
                                "statement": "it should be parsed",
                                "lineNumber": 4,
                                "arg": null
                            }
                        ],
                        "tags": []
                    }]
                }]
            }
        };
        

        it("non blank EOL", function() {
            const result = parser.parse(featureContent);
            const actual = JSON.parse(JSON.stringify(result));
            //console.log(JSON.stringify(result,null,4));
            expect(expected).toEqual(actual);
        });
        it("blank EOL", function() {
            featureContent +=blankLine;
                
            const result = parser.parse(featureContent);
            const actual = JSON.parse(JSON.stringify(result));
            expect(expected).toEqual(actual);
        });
    });

    describe("last row", function() {

        // let featureContent = `Feature: Description
        //     Scenario Outline: Scenario Outline description
        //         When there is a <word> in 
        //         Then it should be parsed
        
        //         Examples:
        //         |word|
        //         |description|`;

        // let featureContent = `Feature: Description
        //     Scenario: Scenario Outline description
        //         When there is a <word> in 
        //         Then it should be parsed with
        //         """
        //         doc string
        //         """`;

        let featureContent = `Feature: Description
            Scenario: Scenario Outline description
                When there is a <word> in 
                Then it should be parsed with
                |data | table|`;

        it("non blank EOL", function() {
            const result = parser.parse(featureContent);
            const actual = JSON.parse(JSON.stringify(result));
            //console.log(JSON.stringify(result,null,4));
            //expect(expected).toEqual(actual);
        });

    });

});
