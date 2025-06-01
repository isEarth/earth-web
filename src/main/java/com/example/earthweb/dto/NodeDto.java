package com.example.earthweb.dto;

public class NodeDto {
    private String name;
    private String label;

    public NodeDto() {}

    public NodeDto(String name, String label) {
        this.name = name;
        this.label = label;
    }

    // getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
