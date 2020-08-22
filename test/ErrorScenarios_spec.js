const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Error in ", function () {

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
                parser.parse(featureContent);
            }).toThrowError("Unexpected section at line number 4")
            //console.log(JSON.stringify(parser.output,null,4));
        });

        it("should throw error when only scenario but no feature section", function() {
            const parser = new FeatureFileParser();
            const featureContent = `
                Example: Already used today
                    Given I last used the app earlier today
                    When I use the app
                    Then I am not notified about overdue tasks
            `;
    
            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Feature section was expected at line number 2")
            //console.log(JSON.stringify(parser.output,null,4));
        });

        it("should throw error when only scenario without steps", function() {
            const parser = new FeatureFileParser();
            const featureContent = `
                Example: Already used today
            `;
    
            expect( () => {
                parser.parse(featureContent)
                }).toThrowError("Feature section was expected at line number 2")
            //console.log(JSON.stringify(parser.output,null,4));
        });
        
    });

    describe("Scenario Outline", function () {
        
        it("should throw error when scenario outline with no examples", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks

                Scenario Outline: breaks string for " "
                    When I pass "a b c" and " "
                    Then I get ["a","b","c"]
            `;
    
            expect( () => {
                parser.parse(featureContent);
            }).toThrowError("Examples section was expected but reached to EOL")

        });

        it("should throw error when scenario outline without steps and examples", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks

                Scenario Outline: breaks string for " "

                Example: Already used today
                    Given I last used the app earlier today
                    When I use the app
                    Then I am not notified about overdue tasks
            `;
    
            expect( () => {
                parser.parse(featureContent);
            }).toThrowError("Unexpected section at line number 5")

        });

        it("should throw error when scenario outline without steps and examples", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks

                Scenario Outline: breaks string for " "

                    Examples:
                    | heading |
                    | data      |

                Example: Already used today
                    Given I last used the app earlier today
                    When I use the app
                    Then I am not notified about overdue tasks
            `;
    
            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Unexpected section at line number 5")

        });
        
        it("should throw error when scenario outline examples has no data row", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks

                Scenario Outline: breaks string for " "
                    Given a step

                    Examples:
                    | heading |
            `;
    
            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Insufficient rows in Examples at line number 6")

        });
        
        it("should throw error when scenario outline with missing Examples", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks

                Scenario Outline: breaks string for " "
                    Given a step

                Scenario: unexpected
                    Given a step
            `;
    
            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Scenario Outline Examples were expected at line number 6")

        });
    });


    describe("Feature", function () {

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
            }).toThrowError("Feature section was expected at line number 1")
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
            }).toThrowError("Unexpected section at line number 3")
            //console.log(JSON.stringify(parser.output,null,4));
        });
    
    });

    describe("Background", function () {

        it("should throw error when background has no step", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            Background: without steps

            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Unexpected section at line number 5")
            //console.log(JSON.stringify(parser.output,null,4));
        });
        
        it("should throw error when background has not step with rule", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            Rule: sample rule

                Background: without steps
            
                Example: Already used today
                    Given I last used the app earlier today
                    When I use the app
                    Then I am not notified about overdue tasks
            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Unexpected section at line number 7")
            //console.log(JSON.stringify(parser.output,null,4));
        });
        
        it("should throw error when background has tag", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            @err
            Background: without steps
                Given I last used the app earlier today

            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Tags are not expected for Background section at linenumber 3")
            //console.log(JSON.stringify(parser.output,null,4));
        });

        it("should throw error when background comes after Scenario", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            @err
            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
            
            Background: without steps
                Given I last used the app earlier today

            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Unexpected section at line number 9")
            //console.log(JSON.stringify(parser.output,null,4));
        });

        it("should throw error when no section after background section", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks

            Background: in last
                Given this is correct

            #Example: Already used today

            `;

            expect( () => {
                parser.parse(featureContent);
            }).toThrowError("Unexpected Background section at the end of the file")
            //console.log(JSON.stringify(parser.output,null,4));
        });
    });
    
    describe("Rule", function () {
        
        it("should throw error when Rule is repeated", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            Rule: sample rule
        
            Rule: Other rule

                Example: Already used today
                    Given I last used the app earlier today
                    When I use the app
                    Then I am not notified about overdue tasks
            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Unexpected section at line number 5")
            //console.log(JSON.stringify(parser.output,null,4));
        });

        it("should throw error when Rule comes before Feature section", function() {
            const parser = new FeatureFileParser();
            const featureContent = `
            
            Rule: sample rule

            Feature: Overdue tasks

            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Feature section was expected at line number 3")
            //console.log(JSON.stringify(parser.output,null,4));
        });

        it("should throw error when Rule has tag", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            @err
            Rule: with tags

            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Tags are not expected for Rule section at linenumber 3")
            //console.log(JSON.stringify(parser.output,null,4));
        });

        it("should throw error when Rule come in last", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            @err
            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
            
            Rule: in last

            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Unexpected Rule section at line number 8")
            //console.log(JSON.stringify(parser.output,null,4));
        });
        
        it("should throw error when there is rule but some scenarios are without rules", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            @err
            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
            
            Rule: in last

            Example: Already used today
                Given I last used the app earlier today
                When I use the app

            `;

            expect( () => {
                parser.parse(featureContent);
            }).toThrowError("Unexpected Rule section at line number 8")
            //console.log(JSON.stringify(parser.output,null,4));
        });
        
        it("should throw error when no section after rule section", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks

            Rule: in last

            #Example: Already used today

            `;

            expect( () => {
                parser.parse(featureContent);
            }).toThrowError("Unexpected Rule section at the end of the file")
            //console.log(JSON.stringify(parser.output,null,4));
        });
    });

    describe("Inputs", function () {

        it("should throw error when scenario before feature section", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks

            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                | and | with | data table|
                """
                with doc string
                """
                Then I am not notified about overdue tasks
            `;

            try{
                parser.parse(featureContent)
            }catch(e){
                expect(e.message).toBe("DocString is not expected at line number 6");
                expect(e.lineNumber).toBe(6);
            }
            //console.log(JSON.stringify(parser.output,null,4));
        });
    });

    describe("Others", function () {

        it("should throw error when empty feature file content", function() {
            const parser = new FeatureFileParser();
            const featureContent = `
                `;
            try{
                parser.parse(featureContent)
            }catch(e){
                expect(e.message).toBe("Feature section is not found");
            }
            //console.log(JSON.stringify(parser.output,null,4));
        });
        
    });
});