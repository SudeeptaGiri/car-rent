package com.epam.carrentapp.stepdefinitions.ui;

import com.epam.carrentapp.driver.DriverFactory;
import com.epam.carrentapp.pages.LoginPage;
import io.cucumber.java.en.*;
import org.junit.Assert;
import org.openqa.selenium.WebDriver;

public class LoginSteps {

    private WebDriver driver= DriverFactory.getInstance().getDriver();
    LoginPage loginPage=new LoginPage(driver);

    @Given("I am on the login page")
    public void i_am_on_the_login_page() {
            loginPage.openLoginPage("https://team03bucketstatichosting.s3.eu-west-3.amazonaws.com/login");
         }


    @When("I leave the email and password fields empty")
    public void i_leave_the_email_and_password_fields_empty() {
        loginPage.enterEmail("");
        loginPage.enterPassword("");
    }

    @When("I click on the logout button")
    public void i_click_on_the_logout_button() {
        loginPage.clickLogout();
    }

    @When("I enter {string} and {string}")
    public void i_enter_credentials(String email, String password) {
        loginPage.enterEmail(email);
        loginPage.enterPassword(password);
    }
    @When("I click on the login button")
    public void i_click_on_the_login_button() {
        loginPage.clickLogin();
    }
    @Then("I should be redirected to the dashboard")
    public void i_should_be_redirected_to_the_dashboard() {
        Assert.assertTrue(loginPage.isLogoutButtonDisplayed());
    }
    @Then("I should remain logged in across sessions")
    public void i_should_remain_logged_in_across_sessions() {
        driver.navigate().refresh();
        Assert.assertTrue(loginPage.isLogoutButtonDisplayed());
    }

    @Given("I am logged in as a valid user")
    public void i_am_logged_in_as_a_valid_user() {
        loginPage.openLoginPage("https://team03bucketstatichosting.s3.eu-west-3.amazonaws.com/login");
        loginPage.enterEmail("user@example.com");
        loginPage.enterPassword("Password123");
        loginPage.clickLogin();
        Assert.assertTrue(loginPage.isLogoutButtonDisplayed());
    }

    @Then("I should be redirected to the login page")
    public void i_should_be_redirected_to_the_loginPage() {
        Assert.assertTrue(loginPage.isLoginButtonDisplayed());
     }
    @Then("I should see {String}")
    public void i_should_see(String expMsg){
        String actMsg=loginPage.getErrorMessage();
        Assert.assertEquals(expMsg,actMsg);
    }

    @Then("I should not remain logged in across sessions")
    public void i_should_not_remain_logged_in_across_sessions() {
         driver.navigate().refresh();
         Assert.assertFalse(loginPage.isLogoutButtonDisplayed());
    }

}

