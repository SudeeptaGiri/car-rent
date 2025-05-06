package com.epam.carrentapp.stepdefinitions.ui;

import com.epam.carrentapp.driver.DriverFactory;
import com.epam.carrentapp.pages.RegistrationPage;
import io.cucumber.java.en.*;
import org.junit.Assert;
import org.openqa.selenium.WebDriver;

public class RegistrationSteps {

    WebDriver driver= DriverFactory.getInstance().getDriver();
    RegistrationPage registrationPage = new RegistrationPage(driver);

    @Given("I am on the registration page")
    public void i_am_on_the_registration_page() {
        driver.get("https://team03bucketstatichosting.s3.eu-west-3.amazonaws.com/index.html");
    }
    @When("I enter valid {string} and {string} and {string} and {string} and {string}")
    public void i_enter_valid_and_and_and_and(String firstName, String lastName, String email, String password, String confirmPassword) {
        registrationPage.enterFirstName(firstName);
        registrationPage.enterLastName(lastName);
        registrationPage.enterEmail(email);
        registrationPage.enterPassword(password);
        registrationPage.confirmPassword(confirmPassword);
    }
    @When("I click on register")
    public void i_click_on_register() {
        registrationPage.clickRegister();
    }
    @Then("I should see {string}")
    public void i_should_see(String expMessage) {
        String actualMessage = registrationPage.getMessage();
        Assert.assertEquals(expMessage, actualMessage);
    }

}
