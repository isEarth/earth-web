package com.example.earthweb.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class UrlController {

    @RequestMapping(value="/home")
    public String home(){
        return "index";
    }
}
