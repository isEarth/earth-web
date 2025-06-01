package com.example.earthweb.service;

import com.example.earthweb.dto.GraphResponse;
import com.example.earthweb.dto.LinkDto;
import com.example.earthweb.dto.NodeDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Record;
import org.neo4j.driver.Result;
import org.neo4j.driver.Session;
import org.neo4j.driver.types.Node;

import java.util.*;

@Service
public class GraphService {

    @Autowired
    private Driver neo4jDriver;

    public GraphResponse getAllGraphData() {
        List<NodeDto> nodes = getAllNodes();
        List<LinkDto> links = getAllRelationships();
        return new GraphResponse(nodes, links);
    }

    public GraphResponse getGraphDataByLabels(List<String> labels) {
        List<NodeDto> nodes = getNodesByLabels(labels);
        List<LinkDto> links = getRelationshipsByNodes(
                nodes.stream().map(NodeDto::getName).collect(java.util.stream.Collectors.toList())
        );
        return new GraphResponse(nodes, links);
    }

    private List<NodeDto> getAllNodes() {
        List<NodeDto> nodes = new ArrayList<>();

        try (Session session = neo4jDriver.session()) {
            String query = "MATCH (n) RETURN n ORDER BY n.name";
            Result result = session.run(query);

            while (result.hasNext()) {
                Record record = result.next();
                Node node = record.get("n").asNode();

                String name = node.get("name").asString();
                String label = extractPrimaryLabel(node);

                nodes.add(new NodeDto(name, label));
            }
        }

        return nodes;
    }

    private List<NodeDto> getNodesByLabels(List<String> labels) {
        List<NodeDto> nodes = new ArrayList<>();

        try (Session session = neo4jDriver.session()) {
            String labelClause = labels.stream()
                    .map(label -> "n:" + label)
                    .collect(java.util.stream.Collectors.joining(" OR "));

            String query = String.format("MATCH (n) WHERE %s RETURN n ORDER BY n.name", labelClause);
            Result result = session.run(query);

            while (result.hasNext()) {
                Record record = result.next();
                Node node = record.get("n").asNode();

                String name = node.get("name").asString();
                String label = extractPrimaryLabel(node);

                nodes.add(new NodeDto(name, label));
            }
        }

        return nodes;
    }

    private List<LinkDto> getAllRelationships() {
        List<LinkDto> links = new ArrayList<>();

        try (Session session = neo4jDriver.session()) {
            String query = "MATCH (a)-[r]->(b) RETURN a.name as source, b.name as target, type(r) as type";
            Result result = session.run(query);

            while (result.hasNext()) {
                Record record = result.next();
                String source = record.get("source").asString();
                String target = record.get("target").asString();
                String type = record.get("type").asString();

                links.add(new LinkDto(source, target, type));
            }
        }

        return links;
    }

    private List<LinkDto> getRelationshipsByNodes(List<String> nodeNames) {
        List<LinkDto> links = new ArrayList<>();

        if (nodeNames.isEmpty()) {
            return links;
        }

        try (Session session = neo4jDriver.session()) {
            Map<String, Object> parameters = new HashMap<>();
            parameters.put("nodeNames", nodeNames);

            String query = "MATCH (a)-[r]->(b) " +
                    "WHERE a.name IN $nodeNames AND b.name IN $nodeNames " +
                    "RETURN a.name as source, b.name as target, type(r) as type";

            Result result = session.run(query, parameters);

            while (result.hasNext()) {
                Record record = result.next();
                String source = record.get("source").asString();
                String target = record.get("target").asString();
                String type = record.get("type").asString();

                links.add(new LinkDto(source, target, type));
            }
        }

        return links;
    }

    private String extractPrimaryLabel(Node node) {
        // Neo4j 노드는 여러 라벨을 가질 수 있으므로 첫 번째 라벨을 반환
        return node.labels().iterator().hasNext() ?
                node.labels().iterator().next() : "Unknown";
    }
}