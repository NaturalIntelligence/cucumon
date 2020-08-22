# Cucumon
Gherkin like feature file parser with a dash of lemon.



<img align="center" src="assets/logo.png" alt="cucumon logo" />

## How to use

```bash
$ npm install cucumon
```

```js
const Cucumon = require("cucumon");

const options = {
    tagExpression : "", //@focus
    //clubBgSteps : true,
}
const cucumonSlice = new Cucumon(options);
const output = cucumonSlice.parse(featureFileAsString);
```

## Documentation

### Feature file format

Cucumon supports gherkin feature file format.

```feature
@tag @tag2
@tag3
Feature: statement

Description

Rule: some rule

    Background: statement
        Given some step
    
    Scenario: statment
        When some step

    Scenario Outline: statement <header>
        Then some step
        And data table
        #> {}
        |header|<header>|
        But doc string
        #> json
        """
        { header: "<header>" }
        """

        Examples:
        |header|
        |val|

Rule: Other sub feature

    Background: statement
        Given some step
    
    Example: statment
        When some step

    @taghere
    Scenario Template: statement <header>
        Then some step

        Scenarios:
        |header|
        |val|
```

Note the **instruction statment** `#> {}`. Instruction statments are special comments which can help parser to take some extra steps. Currently, they are supported with steps, docstring, and data table inputs.

### Result format

```js
{
    feature: {
        "keyword": "Feature",
        "description": "",
        "statement": "Special Characters",
        "lineNumber": 1,
        "tags": [],
        rules: [
            {
                "keyword": "Rule",
                "description": "",
                "statement": "some rule",
                "lineNumber": 2,
                "hasBgSection": true,
                "background": {
                    "keyword": "Background",
                    "statement": "one per rule",
                    "description": "Background can have description",
                    "lineNumber": 14,
                    "id": -1,
                    "steps": [
                        {
                            "keyword": "Given",
                            "statement": "a string tokenizer",
                            "lineNumber": 17,
                            "arg": null
                        }
                    ]
                },
                scenarios: [
                    {
                        "keyword": "Scenario Template",
                        "statement": "scenario outline",
                        "description": "",
                        "lineNumber": 3,
                        "id": 1,
                        "tags": [],
                        steps: [
                            {
                                "keyword": "Given",
                                "statement": "an example",
                                "lineNumber": 4,
                                "arg": null
                            }
                        ]

                    }
                ]
            }
        ]
    }
}
```

### Options

```js
new Cucumon({clubBgSteps: false});
```

You can set `clubBgSteps: true` to club background steps with scenario steps.

Check [sample](test/Inputs.json) parsed response for better idea;

* Read [documentation](./documentation.md) for more detail.
* Check [bexp](https://github.com/NaturalIntelligence/bexp/) to evaluate tag expression.
