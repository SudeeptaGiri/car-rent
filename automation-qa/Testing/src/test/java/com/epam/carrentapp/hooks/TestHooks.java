package com.epam.carrentapp.hooks;

import com.epam.carrentapp.driver.DriverFactory;
import io.cucumber.java.Before;
import io.cucumber.java.After;

public class TestHooks {

    @Before
    public void setUp(){
        DriverFactory.getInstance().getDriver();
    }

    @After
    public void tearDown(){
        DriverFactory.getInstance().quitDriver();
    }
}
