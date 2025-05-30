fetch('/data/concept_lv1.json')
    .then(response => response.json())
    .then(data => {
        // 노드 분리
        const conceptLv1Nodes = data.nodes.filter(n => n.label === 'Concept_lv1');
        const conceptLv2Nodes = data.nodes.filter(n => n.label === 'Concept_lv2');
        const eventNodes = data.nodes.filter(n => n.label === 'Event');
        const youtubeNodes = data.nodes.filter(n => n.label === 'youtube');

        // 링크 분리 (같은 레이어 안)
        const conceptLv1Links = data.links.filter(l =>
            conceptLv1Nodes.some(n => n.id === l.source) &&
            conceptLv1Nodes.some(n => n.id === l.target)
        );
        const conceptLv2Links = data.links.filter(l =>
            conceptLv2Nodes.some(n => n.id === l.source) &&
            conceptLv2Nodes.some(n => n.id === l.target)
        );
        const eventLinks = data.links.filter(l =>
            eventNodes.some(n => n.id === l.source) &&
            eventNodes.some(n => n.id === l.target)
        );
        const youtubeLinks = data.links.filter(l =>
            youtubeNodes.some(n => n.id === l.source) &&
            youtubeNodes.some(n => n.id === l.target)
        );

        // 레이어 간 연결만 따로 필터
        const interLayerLinks = data.links.filter(l =>
            (conceptLv1Nodes.some(n => n.id === l.source) && conceptLv2Nodes.some(n => n.id === l.target)) ||
            (conceptLv2Nodes.some(n => n.id === l.source) && eventNodes.some(n => n.id === l.target)) ||
            (eventNodes.some(n => n.id === l.source) && youtubeNodes.some(n => n.id === l.target))
        );

        // ===== 레이어 4 (Concept_lv1)
        ForceGraph3D()(document.getElementById('graph-level-4'))
            .graphData({ nodes: conceptLv1Nodes, links: conceptLv1Links })
            .nodeLabel(n => n.id)
            .nodeAutoColorBy('group')
            .linkWidth(2)
            .width(1200)
            .height(800)
            .backgroundColor('#1F957233');  // 레이어4 파랑

        // ===== 레이어 3 (Concept_lv2)
        ForceGraph3D()(document.getElementById('graph-level-3'))
            .graphData({ nodes: conceptLv2Nodes, links: conceptLv2Links })
            .nodeLabel(n => n.id)
            .nodeAutoColorBy('group')
            .linkWidth(2)
            .width(1200)
            .height(800)
            .backgroundColor('#7BBEDF33');

        // ===== 레이어 2 (Event)
        ForceGraph3D()(document.getElementById('graph-level-2'))
            .graphData({ nodes: eventNodes, links: eventLinks })
            .nodeLabel(n => n.id)
            .nodeAutoColorBy('group')
            .linkWidth(2)
            .width(1200)
            .height(800)
            .backgroundColor('#2AC2BD33');

        // ===== 레이어 1 (youtube)
        ForceGraph3D()(document.getElementById('graph-level-1'))
            .graphData({ nodes: youtubeNodes, links: youtubeLinks })
            .nodeLabel(n => n.id)
            .nodeAutoColorBy('group')
            .linkWidth(2)
            .width(1200)
            .height(800)
            .backgroundColor('#1F957233');

        // ===== 통합 레이어 간 연결 (merged)
        ForceGraph3D()(document.getElementById('graph-level-merged'))
            .graphData({ nodes: data.nodes, links: interLayerLinks })
            .nodeLabel(n => n.id)
            .nodeAutoColorBy('group')
            .linkWidth(2)
            .backgroundColor('transparent');
    });