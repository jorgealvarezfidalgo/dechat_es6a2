#Search.feature

Feature: DeChat ES-6A-II
    I should be able to go to the https://arquisoft.github.io/dechat_es6a2 and login

    Scenario: Bad credential, we don't reach the home page
        Given We visit the "https://arquisoft.github.io/dechat_es6a2"
        And We put the bad credentials username "unexistent" and password "unexistent"
        Then We click on "login" we will stay on the same page and no messages shown

    Scenario: Good credential, we reach the home page
        Given We visit the "https://arquisoft.github.io/dechat_es6a2"
        And We put the good credentials username "asw" and password "asw-2018-19"
        Then We click and we reach the home page with the messages shown

    Scenario: When the user is logged in, we select a friend and write a message
        Given We visit the "https://arquisoft.github.io/dechat_es6a2"
        And We put the good credentials username "asw" and password "asw-2018-19" and click on "login"
        Then the messages will appear and we an existing conversation
        Then we send the implicated friend a message "hi friend"

    Scenario: When the user is logged in, we should see friends and add contacts/groups icons
        Given We visit the "https://arquisoft.github.io/dechat_es6a2"
        And We put the credentials username "asw" and password "asw-2018-19" and click on "login"
        Then the messages will appear and we select a friend in the friends' section
        Then we should see friends and add groups and friends menu

    Scenario: Google search for our application es6a-II
        When I search Google for "dechat_es6a2"
        Then I should see "Arquisoft" in the result
