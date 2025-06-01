package com.example.earthweb.dto;
import java.util.List;

public class GraphResponse {
    private List<NodeDto> nodes;
    private List<LinkDto> links;

    public GraphResponse() {}

    public GraphResponse(List<NodeDto> nodes, List<LinkDto> links) {
        this.nodes = nodes;
        this.links = links;
    }

    // getters and setters
    public List<NodeDto> getNodes() { return nodes; }
    public void setNodes(List<NodeDto> nodes) { this.nodes = nodes; }
    public List<LinkDto> getLinks() { return links; }
    public void setLinks(List<LinkDto> links) { this.links = links; }
}
