package com.example.earthweb.dto;

public class LinkDto {
    private String source;
    private String target;
    private String type;

    public LinkDto() {}

    public LinkDto(String source, String target, String type) {
        this.source = source;
        this.target = target;
        this.type = type;
    }

    // getters and setters
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
}
