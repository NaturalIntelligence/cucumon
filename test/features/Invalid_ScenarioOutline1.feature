Feature: Background

Background: to repeat the common operation with every scenario
    Given a string tokenizer

Rule: some rule
with description

    Scenario Outline: breaks string
        When I pass "<string>" and "<delimeter>"
        Then I get `["a","b","c"]`

        Examples:
        | string    | delimeter |
        | a,b,c     | ,                |
        | abc       |                 |

    Scenario Outline: breaks string for " "
        When I pass "a b c" and " "
        Then I get `["a","b","c"]`