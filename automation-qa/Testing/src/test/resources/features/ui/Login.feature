Feature: User Login
  As a User, I want to be able to login so that I can access my account and interact with the application.

  @Positive
  Scenario: Successful Login
    Given I am on the login page
    When I enter "user@example.com" and "Password123"
    And I click on the login button
    Then I should be redirected to the dashboard
    And I should remain logged in across sessions

  @Negative
  Scenario Outline: Login with Invalid Credentials
    Given I am on the login page
    When I enter "<Email>" and "<Password>"
    And I click on the login button
    Then I should see "<ErrorMessage>"

    Examples:
      | Email                  | Password    | ErrorMessage                           |
      | invalid@example.com    | Password123 | Invalid email              |
      | user@example.com       | WrongPass   | Invalid email              |
      | user@example.com       |             | Password is required                   |
      |                       | Password123 | Email is required                      |
      | invalid-email-format   | Password123 | Please enter a valid email address     |

  @Negative
  Scenario: Login with Empty Fields
    Given I am on the login page
    When I leave the email and password fields empty
    And I click on the login button
    Then I should see "Email is required and Password is required"

  @Functional
  Scenario: Logout Functionality
    Given I am logged in as a valid user
    When I click on the logout button
    Then I should be redirected to the login page
    And I should not remain logged in across sessions
