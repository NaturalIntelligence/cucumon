const FeatureFileParser = require('../src/FeatureFileParser');

describe("Scenario", function () {

    
    it("should throw error when scenario with no steps", function() {
        const parser = new FeatureFileParser();
        const featureContent = `Feature: Overdue tasks
            Example: First use of the day

            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
        `;
   
        expect( () => {
            parser.parse(featureContent)
        }).toThrowError("Example at linenumber 4 without steps")
        //console.log(JSON.stringify(parser.output,null,4));
    });

    it("should throw error when only scenario", function() {
        const parser = new FeatureFileParser();
        const featureContent = `
            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
        `;
   
        expect( () => {
            parser.parse(featureContent)
        }).toThrowError("Example at linenumber 2 before Feature section")
        //console.log(JSON.stringify(parser.output,null,4));
    });

    it("should throw error when only scenario without steps", function() {
        const parser = new FeatureFileParser();
        const featureContent = `
            Example: Already used today
        `;
   
        expect( () => {
            parser.parse(featureContent)
        }).toThrowError("Example at linenumber 2 before Feature section")
        //console.log(JSON.stringify(parser.output,null,4));
    });
    
    it("should throw error when scenario before feature section", function() {
        const parser = new FeatureFileParser();
        const featureContent = `Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks

            Feature: Overdue tasks
        `;
   
        expect( () => {
            parser.parse(featureContent)
        }).toThrowError("Example at linenumber 1 before Feature section")
        //console.log(JSON.stringify(parser.output,null,4));
    });
    
    it("should throw error when feature section is repeated", function() {
        const parser = new FeatureFileParser();
        const featureContent = `Feature: Overdue tasks
        
        Feature: Overdue tasks 2

        Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
        `;
   
        expect( () => {
            parser.parse(featureContent)
        }).toThrowError("Unexpected Feature section at linenumber 3")
        //console.log(JSON.stringify(parser.output,null,4));
    });
    
});