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
                parser.parse(featureContent)
            }).toThrowError("Example at linenumber 2 without steps")
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
                parser.parse(featureContent)
            }).toThrowError("Scenario Outline/Template without Examples at the end of the file")

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
                parser.parse(featureContent)
            }).toThrowError("Scenario Outline at linenumber 3 without steps")

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
            }).toThrowError("Unexpected Examples section at linenumber 5")

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
            }).toThrowError("Background at linenumber 3 without steps")
            //console.log(JSON.stringify(parser.output,null,4));
        });
        
        it("should throw error when background has not step with rule", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            Background: without steps

            Rule: sample rule

                Example: Already used today
                    Given I last used the app earlier today
                    When I use the app
                    Then I am not notified about overdue tasks
            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Background at linenumber 3 without steps")
            //console.log(JSON.stringify(parser.output,null,4));
        });
        
        it("should throw error when background has no steps and not scenario", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            Background: without steps

            Rule: sample rule

            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("No Scenario/Example found")
            //console.log(JSON.stringify(parser.output,null,4));
        });

        it("should throw error when background comes before Feature section", function() {
            const parser = new FeatureFileParser();
            const featureContent = `
            
            Background: without steps

            Feature: Overdue tasks

            Rule: sample rule

            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Background at linenumber 3 before Feature section")
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
            }).toThrowError("Background section must not have tags, at linenumber 4")
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
            }).toThrowError("Unexpected Background section at linenumber 9")
            //console.log(JSON.stringify(parser.output,null,4));
        });
    });
    
    describe("Rule", function () {

        xit("should throw error when Rule has some step", function() {
            const parser = new FeatureFileParser();
            const featureContent = `Feature: Overdue tasks
            
            Rule: without steps
                Given this is invalid 

            Example: Already used today
                Given I last used the app earlier today
                When I use the app
                Then I am not notified about overdue tasks
            `;

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Rule at linenumber 3 has steps")
            //console.log(JSON.stringify(parser.output,null,4));
        });
        
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
            }).toThrowError("Repeated Rule section at linenumber 5")
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
            }).toThrowError("Rule at linenumber 3 before Feature section")
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
            }).toThrowError("Rule section must not have tags, at linenumber 4")
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
            }).toThrowError("Unexpected Rule section at linenumber 9")
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
                parser.parse(featureContent)
            }).toThrowError("Unexpected Rule section at linenumber 9")
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

            expect( () => {
                parser.parse(featureContent)
            }).toThrowError("Only data table or doc string is allowed for step at line number 5")
            //console.log(JSON.stringify(parser.output,null,4));
        });
    });
});