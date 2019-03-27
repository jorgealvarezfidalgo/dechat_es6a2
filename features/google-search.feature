#Search.feature

Feature: Google Search Testing
    I should be able to go to a website
    and check its search functionality

    Scenario: Google search for voter cards app
        When I search Google for "itunes vote cards app"
        Then I should see "Outvote" in the result
