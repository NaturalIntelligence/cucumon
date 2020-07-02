Feature: Special Characters

    Scenario Template: scenario outline
        Given an example 
        And I can pass "<data>" with spceial characters

        Examples:
        | data  |
        #empty
        | |
        #backslash
        | new\nline\ttab\b   |
        #pipe
        | left\|right\|  |
    
    @focus
    Scenario: data table, doc string and special chars
        Given a scenario
        When I pass data table
        #| no header | only data |
            |  | empty|
            | new\nline\ttab\b | with backslash chars|
            | left\|right\|  | with pipe sign | extra column should be skipped |
        And I can also pass a doc string
        #> no format; single line;
            """
            This text will be trimmed from starting and \tend
            | with pipe
            # with hash
            Feature: something
            and """ are allowed in between "
            """
        And I can specify a step
        And I can give "  " in quotes
        And I can pass 😀 unicode
