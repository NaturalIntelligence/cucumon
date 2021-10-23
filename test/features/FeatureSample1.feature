@all
Feature: Repeated rule with Background

Give the desription here

with another line

#comments are ignored
Rule: some rule
#comments are ignored
with some description in rule section
having second line

    Background: to repeat the common operation with every scenario in rule 1
        Background can also have description
        #comments are ignored
        Given a string tokenizer

    @outline
    Scenario Outline: breaks string
        This is the desription
        for scenario outline
        When I pass "<string>" and delimeter: "<delimeter>"
        Then I get `["a","b","c"]`
        #comments are ignored
        Examples:
        | string    | delimeter |
        | a,b,c     | ,                |
        #comments are ignored
        #comments are ignored
        | abc       |                 |
        #comments are ignored

    @one
    Scenario: breaks string for " "
        When I pass "a b c" and " "
        #comments are ignored
        Then I get `["a","b","c"]`

Rule: some rule 2
#> comment
with description

    #> instruction ignored
    #> instruction before Scenario
    Scenario: breaks string for " "
        description for scenario
        #> instruction
        When I pass "a b c" and " "
        Then I get `["a","b","c"]`

    #> instruction ignored 2
    #> instruction before Scenario Outline
    Scenario Outline: breaks string when <delimeter>
        When I pass "<string>" and "<delimeter>"
        Then I get `["a","b","c"]`
        And for data table
        #> instruction 2
        |<string>|<delimeter>|
        |<string>|<delimeter>|
        And in docString
        """
        A string <string> separated by '<delimeter>' will result in ?
        A string <string> separated by '<delimeter>' will result in ?
        """

        Examples:
        | string    | delimeter |
        | a\\|b\\|c     | \\|   |
        | abc       |           |
