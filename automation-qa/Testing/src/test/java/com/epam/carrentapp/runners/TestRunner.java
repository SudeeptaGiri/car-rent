package com.epam.carrentapp.runners;

import io.cucumber.junit.Cucumber;
import io.cucumber.junit.CucumberOptions;
import org.junit.runner.RunWith;

@RunWith(Cucumber.class)
@CucumberOptions(
        features = "src/test/resources/features/ui",
        glue = { "com.epam.carrentapp.stepdefinitions.ui", "hooks"},
        plugin = {"pretty","html:target/cucumber-reports.html"},
        monochrome = true
)
public class TestRunner {
}
