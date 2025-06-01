package com.example.earthweb.controller;

import com.example.earthweb.dto.GraphResponse;
import com.example.earthweb.service.GraphService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

// 개선된 Controller
@RestController
@RequestMapping("/api")
public class GraphController {

    @Autowired
    private GraphService graphService;

    @GetMapping("/graph")
    public GraphResponse getAllGraphData() {
        return graphService.getAllGraphData();
    }

    @GetMapping("/graph/filter")
    public GraphResponse getFilteredGraphData(@RequestParam List<String> labels) {
        return graphService.getGraphDataByLabels(labels);
    }

    // 사용 예시: /api/graph/filter?labels=Concept_lv1,Concept_lv2
}