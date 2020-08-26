const FeatureFileParser = require('../src/FeatureFileParser');
const fs = require('fs');
const path = require('path');

describe("Rule", function () {

    it("should run with default rule and scenario", function() {
        const parser = new FeatureFileParser();

        const input = `@all
        Feature: Default Rule With Scenario
        
            @one
            Scenario: breaks string for " "
                When I pass "a b c" and " "
                #> instructions are not ignored
                #but comments are ignored
                Then I get ["a","b","c"]
        `;
        const expected = {
            "feature": {
                "keyword": "Feature",
                "description": "",
                "statement": "Default Rule With Scenario",
                "lineNumber": 2,
                "tags": [ "@all"],
                "rules": [{
                    "keyword": "Rule",
                    "statement": "__default",
                    "scenarios": [{
                        "keyword": "Scenario",
                        "statement": "breaks string for \" \"",
                        "description": "",
                        "lineNumber": 5,
                        "id": 1,
                        "steps": [{
                                "keyword": "When",
                                "statement": "I pass \"a b c\" and \" \"",
                                "lineNumber": 6,
                                "arg": null
                            },
                            {
                                "keyword": "Then",
                                "statement": "I get [\"a\",\"b\",\"c\"]",
                                "lineNumber": 9,
                                "arg": null,
                                "instruction": "instructions are not ignored"
                        }],
                        "tags": [ "@one" ]
                    }]
                }]
            }
        };
        
        const result = parser.parse(input) ;
        const actual = JSON.parse(JSON.stringify(result));
        expect(expected).toEqual(actual);
        //console.log(JSON.stringify(result,null,4));
        //console.log(JSON.stringify(expected,null,4));
    });
    
    it("should run with default rule and scenario outline", function() {
        const parser = new FeatureFileParser();

        const input = `@all
        Feature: Default Rule With Scenario
        
            @one
            Scenario Outline: breaks string
                When I pass "a b c" and " "
                #> instructions are not ignored
                #but comments are ignored
                Then I get ["a","b","c"]
        
                Examples:
                | string    | delimeter |
                | a,b,c     | ,                |

        `;
        const expected = {
            "feature": {
                "keyword": "Feature",
                "description": "",
                "statement": "Default Rule With Scenario",
                "lineNumber": 2,
                "tags": [ "@all" ],
                "rules": [ {
                    "keyword": "Rule",
                    "statement": "__default",
                    "scenarios": [{
                        "keyword": "Scenario Outline",
                        "statement": "breaks string",
                        "description": "",
                        "lineNumber": 5,
                        "id": 1,
                        "tags": [ "@one" ],
                        "expanded": [
                            {
                                "keyword": "Scenario Outline",
                                "statement": "breaks string",
                                "description": "",
                                "lineNumber": 5,
                                "id": 1,
                                "steps": [
                                    {
                                        "keyword": "When",
                                        "statement": "I pass \"a b c\" and \" \"",
                                        "lineNumber": 6,
                                        "arg": null
                                    },
                                    {
                                        "keyword": "Then",
                                        "statement": "I get [\"a\",\"b\",\"c\"]",
                                        "lineNumber": 9,
                                        "arg": null
                                    }
                                ],
                                "tags": [ "@one" ],
                                "examplesLineNumber": [
                                    13
                                ]
                            }
                        ],
                        examples: [{ 
                            "lineNumber": 11,
                            "rows":[
                                {
                                    "lineNumber": 12,
                                    "regex": [ {}, {} ],
                                    "cells": [ "string", "delimeter" ]
                                }, {
                                    "lineNumber": 13,
                                    "cells": [ "a,b,c", "," ]
                                }
                            ]
                        }]
                    }]
                }]
            }
        }
        ;
        
        const result = parser.parse(input) ;
        const actual = JSON.parse(JSON.stringify(result));
        expect(expected).toEqual(actual);
        //console.log(JSON.stringify(result,null,4));
        //console.log(JSON.stringify(expected,null,4));
    });

    it("should run with default rule, background and scenario", function() {
        const parser = new FeatureFileParser();

        const input = `@all
        Feature: Default Rule With Scenario
            
            Background:
                Given I do some setup

            @one
            Scenario: breaks string for " "
                When I pass "a b c" and " "
                #> instructions are not ignored
                #but comments are ignored
                Then I get ["a","b","c"]
        `;
        const expected = {
            "feature": {
                "keyword": "Feature",
                "description": "",
                "statement": "Default Rule With Scenario",
                "lineNumber": 2,
                "tags": [ "@all"],
                "rules": [{
                    "keyword": "Rule",
                    "statement": "__default",
                    "scenarios": [{
                        "keyword": "Scenario",
                        "statement": "breaks string for \" \"",
                        "description": "",
                        "lineNumber": 8,
                        "id": 1,
                        "steps": [{
                                "keyword": "When",
                                "statement": "I pass \"a b c\" and \" \"",
                                "lineNumber": 9,
                                "arg": null
                            },
                            {
                                "keyword": "Then",
                                "statement": "I get [\"a\",\"b\",\"c\"]",
                                "lineNumber": 12,
                                "arg": null,
                                "instruction": "instructions are not ignored"
                        }],
                        "tags": [ "@one" ]
                    }],
                    "hasBgSection": true,
                    "background": {
                        "keyword": "Background",
                        "statement": "",
                        "description": "",
                        "lineNumber": 4,
                        "id": -1,
                        "steps": [
                            {
                                "keyword": "Given",
                                "statement": "I do some setup",
                                "lineNumber": 5,
                                "arg": null
                            }
                        ]
                    }
                }]
            }
        };
        
        const result = parser.parse(input) ;
        const actual = JSON.parse(JSON.stringify(result));
        expect(expected).toEqual(actual);
        //console.log(JSON.stringify(result,null,4));
        //console.log(JSON.stringify(expected,null,4));
    });
    

});