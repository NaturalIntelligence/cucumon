# Documentation

Supported keywords

Sections
* Feature
* Background
* Rule
* Scenario or Example
* Scenario Outline or Scenario Template
    * Scenarios or Examples

All the above main sections can have description.

Steps
* Given
* When
* Then
* And
* But

A step can support data table and doc string

## Scenario Outline

This library triggers `scenario` event for each Scenario outline example. scenario id is the same for all the examples under the same scenario outline for identification purpose.

## Tags expression

Example file 

```feature
@all
Feature: Tags

Background:
    Given some setup
    
#@notAllowed
Rule: rule for tags

    @focus
    Scenario: focused tag
        Given a scenario of focused tag
    
    @other
    Scenario: other tag
        Given a scenario of other tag

Rule: rule 2 for tags

    #@without
    Scenario: without tag
        Given a scenario without tag

    @other
    Scenario: other tag 2
        Given a scenario
```

For `not @all`, whole feature file will be read but scenarios will be skipped. So the event sequence for the above feature file would be as follow;

```json
[ "feature", "background", "step", "rule", "rule" ]
```

If you set `clubBgSteps: true` then background steps will be clubbed to main scenarios. Hence, they'll be skipped too.


```json
[ "feature", "rule", "rule" ]
```

Rule object will have a property`scenariosSkipped` to keep the count of skipped scenarios due to given tag expression.

