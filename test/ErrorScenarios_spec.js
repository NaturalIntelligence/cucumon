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

    describe("Scenario", function () {
        
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

        it("should throw error when scenario before feature section", function() {
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
        
        it("should throw error when scenario before feature section", function() {
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
    });
});