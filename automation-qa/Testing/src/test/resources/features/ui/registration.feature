Feature: User Profile Registration

  As a user,
  I want to have the possibility to sign up,
  So that I could create an account with my custom settings.

  @Positive
  Scenario Outline: Successful Registration
    Given I am on the registration page
    When I enter valid "<FirstName>" and "<LastName>" and "<Email>" and "<Password>" and "<ConfirmPassword>"
    And I click on register
    Then I should see "<ExpectedMessage>"

    Examples:
      | FirstName | LastName | Email                 | Password    | ConfirmPassword | ExpectedMessage          |
      | John      | Doe      | john.doe@example.com | Password123 | Password123     | Registration successful  |
      | Alice     | Smith    | alice_smith@example.com | Password123 | Password123     | Registration successful  |

  @Negative
  Scenario Outline: Registration with Invalid or Missing Details
    Given I am on the registration page
    When I enter valid "<FirstName>" and "<LastName>" and "<Email>" and "<Password>" and "<ConfirmPassword>"
    And I click on register
    Then I should see "<ExpectedMessage>"

    Examples:
      | FirstName | LastName | Email                 | Password    | ConfirmPassword | ExpectedMessage                       |
      | John      | Doe      | existing@example.com  | Password123 | Password123     | This email is already registered      |
      | Jane      | Doe      | jane.doe@example.com  | Password123 | Password456     | Passwords should match                |
      |           | Doe      | no.firstname@example.com | Password123 | Password123     | First name is required                |
      | Jane      |          | jane.lastname@example.com | Password123 | Password123     | Last name is required                 |
      | Jane      | Doe      | invalid-email         | Password123 | Password123     | Invalid email format                  |
      | Jane      | Doe      | jane.doe@example.com  | Pass        | Pass           | Password should meet complexity rules |
