// loading spinner
const loader = document.getElementById('graph-loading');
loader.classList.remove('hidden');

fetch('http://localhost:8080/api/graph')
    // fetch('data/concept_lv1.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {

        // 노드 분리
        const conceptLv1Nodes = data.nodes.filter(n => n.label === 'Concept_lv1');
        const conceptLv2Nodes = data.nodes.filter(n => n.label === 'Concept_lv2');
        const eventNodes = data.nodes.filter(n => n.label === 'Event');
        const youtubeNodes = data.nodes.filter(n => n.label === 'Youtube');

        // 링크 분리 (같은 레이어 안)
        const conceptLv1Links = data.links.filter(l =>
            conceptLv1Nodes.some(n => n.name === l.source) &&
            conceptLv1Nodes.some(n => n.name === l.target)
        );
        const conceptLv2Links = data.links.filter(l =>
            conceptLv2Nodes.some(n => n.name === l.source) &&
            conceptLv2Nodes.some(n => n.name === l.target)
        );
        const eventLinks = data.links.filter(l =>
            eventNodes.some(n => n.name === l.source) &&
            eventNodes.some(n => n.name === l.target)
        );
        const youtubeLinks = data.links.filter(l =>
            youtubeNodes.some(n => n.name === l.source) &&
            youtubeNodes.some(n => n.name === l.target)
        );

        // 레이어 간 연결만 따로 필터 : 관계가 어떤 방향으로 DB에 정의되어 있는지 확인하기
        const interLayerLinks = data.links.filter(l =>
            (conceptLv1Nodes.some(n => n.name === l.source) && conceptLv2Nodes.some(n => n.name === l.target)) ||
            (conceptLv2Nodes.some(n => n.name === l.source) && eventNodes.some(n => n.name === l.target)) ||
            (eventNodes.some(n => n.name === l.target) && youtubeNodes.some(n => n.name === l.source))
        );

        // 1) data.links 중 eventNodes → youtubeNodes 이어주는 링크만 따로 뽑아서
        const eventToYoutubeLinks = data.links.filter(l =>
            eventNodes.some(n => n.name === l.target) &&  // source가 Event 레이어
            youtubeNodes.some(n => n.name === l.source)   // target이 Youtube 레이어
        );
        // 2) 콘솔에 찍어보기
        console.log('Event → Youtube 링크만 확인:', youtubeLinks);

        // 노드 강조용 색상과 기본 색상 정의
        const DEFAULT_COLOR = '#ffffff';
        const HIGHLIGHT_COLOR = '#ff3333';

        const NODE_REL = 8;
        const NODE_VAL   = 8;
        const LINK_WIDTH  = 2;
        const LINK_COLOR_DEFAULT  = '#08122A';
        const LINK_COLOR_CAUSE     = 'yellow';
        const LINK_COLOR_GENERAL   = 'green';

        const formatNodeLabel = name => `
          <div style="
            font-weight: 600;
            font-size: 30px;
            color: #fff;
            white-space: nowrap;
          ">
            ${name}
          </div>
        `;

        const graphs = {};

        const layerConfigs = [
            {
                level: '4',
                nodes: conceptLv1Nodes,
                links: conceptLv1Links,
                arrow_len:0,
                background: '#1F957233',
                chargeStrength: -50,
                linkDistance:   80,
                center: [ -70, 20, 0 ]
            },
            {
                level: '3',
                nodes: conceptLv2Nodes,
                links: conceptLv2Links,
                arrow_len:0,
                background: '#7BBEDF33',
                chargeStrength: -10,
                linkDistance:   250,
                center: [ -70, 20, 0 ]
            },
            {
                level: '2',
                nodes: eventNodes,
                links: eventLinks,
                arrow_len:0,
                background: '#2AC2BD33',
                chargeStrength: -20,
                linkDistance:   30,
                center: [ -70, 20, 0 ]
            },
            {
                level: '1',
                nodes: youtubeNodes,
                links: youtubeLinks,
                arrow_len:10,
                background: '#5F72A433',
                chargeStrength: -50,
                linkDistance:   80,
                center: [ -70, 20, 0 ]
            }
        ];

        layerConfigs.forEach(cfg => {
            const g = ForceGraph3D()(document.getElementById(`graph-level-${cfg.level}`))
                .graphData({ nodes: cfg.nodes, links: cfg.links })
                .nodeId('name')
                .nodeLabel(n => formatNodeLabel(n.name))
                .width(1200).height(800)
                .nodeRelSize(NODE_REL)
                .nodeVal(NODE_VAL)          // 노드 크기 확대
                .nodeOpacity(1)
                .linkOpacity(1)
                .linkWidth(LINK_WIDTH)
                .nodeColor(() => DEFAULT_COLOR)
                .linkColor(link =>
                    link.type === 'isCauseOf'   ? LINK_COLOR_CAUSE  :
                        link.type === 'isGeneralOf' ? LINK_COLOR_GENERAL:
                            LINK_COLOR_DEFAULT
                )
                .linkDirectionalArrowLength(cfg.arrow_len)
                .linkDirectionalArrowRelPos(1)
                .showNavInfo(false)
                .backgroundColor(cfg.background)
                .enablePointerInteraction(false)
                .enableNavigationControls(false)
                .d3Force('charge', d3.forceManyBody().strength(cfg.chargeStrength))
                .d3Force('link', d3.forceLink().distance(cfg.linkDistance).strength(1))
                .d3Force('center',
                    cfg.center
                        ? d3.forceCenter(...cfg.center)
                        : null
                );

            graphs[cfg.level] = g;
        });


        // ===== 통합 레이어 간 연결 (merged)
        graphs['merged'] = ForceGraph3D()(document.getElementById('graph-level-merged'))
            .graphData({ nodes: youtubeNodes, links: youtubeNodes })
            .nodeId('name') // id값이 없어서 추가
            .nodeLabel(n => n.name)
            .nodeAutoColorBy('group')
            .linkWidth(0.5)
            .showNavInfo(false)  // 우측 하단 info 제거
            .backgroundColor('transparent')
            .enablePointerInteraction(false)
            .enableNavigationControls(false)

            // 1) 노드 간 반발력(Repulsion) 강화
            //    - strength 값이 더 음수일수록 서로 멀리 떨어짐
            .d3Force('charge', d3.forceManyBody().strength(-50))

            // 2) 링크 거리(Link distance) 증가
            //    - distance 값을 키우면 연결된 노드 사이 간격이 넓어짐
            .d3Force('link', d3.forceLink().distance(80).strength(1))

            // 3) 중앙 집중력(Centering) 비활성화
            //    - 기본으로 들어가는 center force를 제거하면
            //      “(0,0,0)” 쪽으로 모이는 힘이 사라짐
            .d3Force('center', null);


        // --- 0) 레이어별 인덱스 매핑 ---
        const layerMap = new Map();
        // concept_lv1 → 4, concept_lv2 → 3, event → 2, youtube → 1
        conceptLv1Nodes.forEach(n => layerMap.set(n.name, 4));
        conceptLv2Nodes.forEach(n => layerMap.set(n.name, 3));
        eventNodes.forEach(n      => layerMap.set(n.name, 2));
        youtubeNodes.forEach(n    => layerMap.set(n.name, 1));

        let highlightSet = new Set()
        // --- 1) 클릭→강조 셋 업데이트 함수 ---
        function highlightConnected(startNode) {
            // 1-1) 위쪽/아래쪽 각각 탐색용 방문 집합
            const visitedUp   = new Set();
            const visitedDown = new Set();

            // 1-2) 위쪽 방향(높은 레이어)으로만 DFS
            function dfsUp(curr) {
                if (visitedUp.has(curr)) return;
                visitedUp.add(curr);

                const currLayer = layerMap.get(curr);
                // concept_lv1(4)에 도달하면 중단
                if (currLayer === 4) return;

                interLayerLinks.forEach(l => {
                    let nbr = null;
                    if (l.source === curr)      nbr = l.target;
                    else if (l.target === curr) nbr = l.source;
                    // nbr 레이어가 더 높다면
                    if (nbr && layerMap.get(nbr) > currLayer) {
                        dfsUp(nbr);
                    }
                });
            }

            // 1-3) 아래쪽 방향(낮은 레이어)으로만 DFS
            function dfsDown(curr) {
                if (visitedDown.has(curr)) return;
                visitedDown.add(curr);

                const currLayer = layerMap.get(curr);
                // youtube(1)에 도달하면 중단
                if (currLayer === 1) return;

                interLayerLinks.forEach(l => {
                    let nbr = null;
                    if (l.source === curr)      nbr = l.target;
                    else if (l.target === curr) nbr = l.source;
                    // nbr 레이어가 더 낮다면
                    if (nbr && layerMap.get(nbr) < currLayer) {
                        dfsDown(nbr);
                    }
                });
            }

            // 1-4) 두 방향 모두 탐색
            dfsUp(startNode.name);
            dfsDown(startNode.name);

            // 1-5) 시작 노드도 강조 대상에 포함
            // const highlightSet = new Set([startNode.name, ...visitedUp, ...visitedDown]);
            highlightSet.clear();
            highlightSet.add(startNode.name);
            visitedUp.forEach(n => highlightSet.add(n));
            visitedDown.forEach(n => highlightSet.add(n));

            // --- 2) 강조색/기본색으로 노드·링크 색상 갱신 ---
            ['merged','4','3','2','1'].forEach(levelId => {
                graphs[levelId]
                    .nodeColor(n => highlightSet.has(n.name) ? HIGHLIGHT_COLOR : DEFAULT_COLOR);
            });

            graphs['merged']
                .linkColor(link =>
                    (highlightSet.has(link.source) && highlightSet.has(link.target))
                        ? HIGHLIGHT_COLOR
                        : DEFAULT_COLOR
                );

            // --- 3) 리프레시 ---
            ['merged','4','3','2','1'].forEach(levelId => {
                graphs[levelId].refresh();
            });
        }

        // --- 4) 클릭 핸들러 등록 (풀스크린 전환 시에도) ---
        ['merged','4','3','2','1'].forEach(levelId => {
            graphs[levelId]
                .enablePointerInteraction(true)
                .onNodeClick(highlightConnected);
        });

        // // 2) merged 그래프에 클릭 핸들러 등록
        // graphs['merged']
        //     .onNodeClick(highlightConnected);

        let currentLevelId = null;  // 현재 interaction이 켜져 있는 레이어 ID

        function expandGraphToFullscreen(levelId) {
            // 1) 기존에 선택된 레이어가 있으면 interaction 끄기
            if (currentLevelId !== null) {
                graphs[currentLevelId]
                    .enablePointerInteraction(false)
                    .enableNavigationControls(false);
            }

            // 2) 클릭한 레이어만 “current” 클래스 부여 (visual 강조)
            document.querySelectorAll('.level').forEach(lvl => lvl.classList.remove('level--current'));
            const selectedLevelEl = document.querySelector(`.level--${levelId}`);
            selectedLevelEl.classList.add('level--current');

            // 3) .levels 전체를 풀스크린화
            document.querySelector('.levels').classList.add('levels--fullscreen');

            // 4) 해당 그래프 컨테이너만 fullscreen-graph 클래스 부여
            const graphDiv = document.getElementById(`graph-level-${levelId}`);

            graphDiv.classList.add('fullscreen-graph');  // .fullscreen-graph {position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:2000;}

            // 5) 해당 그래프 인스턴스만 interaction 켜기
            graphs[levelId]
                .enablePointerInteraction(true)
                .enableNavigationControls(true)
                .width(window.innerWidth)
                .height(window.innerHeight)
                // .nodeVal(NODE_VAL)          // 노드 크기 확대
                // .nodeRelSize(NODE_REL)    // 노드 크기 확대
                // .linkWidth(LINK_WIDTH)  // 얇게
                // .nodeOpacity(1)
                // .linkOpacity(1)
                .enablePointerInteraction(true)
                .onNodeClick(highlightConnected);

            // 6) 현재 레이어 ID 업데이트
            currentLevelId = levelId;
        }

        function collapseAllFullscreen() {
            // 1) .levels 풀스크린 모드 해제
            document.querySelector('.levels').classList.remove('levels--fullscreen');

            // 2) 풀스크린으로 열린 모든 그래프 컨테이너에서 클래스 제거
            document.querySelectorAll('.fullscreen-graph').forEach(div => div.classList.remove('fullscreen-graph'));

            // 3) “current” 클래스도 모두 제거
            document.querySelectorAll('.level--current').forEach(lvl => lvl.classList.remove('level--current'));

            // 4) interaction이 켜져 있던 레이어가 있으면 끄기
            if (currentLevelId !== null) {
                graphs[currentLevelId]
                    .enablePointerInteraction(false)
                    .enableNavigationControls(false);
                currentLevelId = null;
            }

            // 5) 모든 그래프를 원래 크기/스타일로 리셋
            ['1','2','3','4'].forEach(id => {
                graphs[id]
                    .width(1200)
                    .height(800)
                    // .nodeRelSize(NODE_REL)
                    // .nodeVal(NODE_VAL)          // 노드 크기 확대
                    // .linkWidth(LINK_WIDTH)  // 얇게
            });
        }

        // ----- 이벤트 리스너 등록 -----
        ['1','2','3','4'].forEach(levelId => {
            document.querySelector(`.level--${levelId}`).addEventListener('click', () => {
                expandGraphToFullscreen(levelId);
            });
        });

        // ① 각 레이어 자체(.level--1, .level--2 등)에만 클릭 리스너 등록
        ['1','2','3','4'].forEach(levelId => {
            document.querySelector(`.level--${levelId}`)
                .addEventListener('click', () => {
                    expandGraphToFullscreen(levelId);
                });
        });

        // ② mallnav “Up” 버튼: 이벤트 버블링 중단 + navigate 호출
        const levelUpCtrl = document.querySelector('.mallnav__button--up');
        levelUpCtrl.addEventListener('click', function(e) {
            e.stopPropagation();  // 이 클릭이 부모 .level로 버블되지 않게 막음
            navigate('Down');     // 실제 레벨 이동 함수 (main.js 쪽 구현 코드)
        });

        // ③ mallnav “Down” 버튼: 이벤트 버블링 중단 + navigate 호출
        const levelDownCtrl = document.querySelector('.mallnav__button--down');
        levelDownCtrl.addEventListener('click', function(e) {
            e.stopPropagation();
            navigate('Up');
        });

        // ④ mallnav “모든 레이어 보기(All-levels)” 버튼: 이벤트 버블링 중단 + 콜백
        const allLevelsCtrl = document.querySelector('.mallnav__button--all-levels');
        allLevelsCtrl.addEventListener('click', function(e) {
            e.stopPropagation();
            collapseAllFullscreen();
        });

        // (1) 버튼과 컨테이너 참조
        const btnShow = document.getElementById('show-filtered');
        const divFiltered = document.getElementById('filtered-graph');
        const canvasContainer = document.getElementById('filtered-graph-canvas');
        let filteredGraph;  // 전용 ForceGraph3D 인스턴스

        // (2) 버튼 클릭 핸들러 등록
        btnShow.addEventListener('click', () => {
            // 토글 표시
            const isVisible = divFiltered.style.display === 'block';
            divFiltered.style.display = isVisible ? 'none' : 'block';
            btnShow.textContent = isVisible ? '구조화 그래프 보기' : '닫기';

            if (isVisible) return;  // 닫기 모드면 그만

            // (3) highlightSet 기준으로 노드/링크 필터링
            const filteredNodes = data.nodes.filter(n => highlightSet.has(n.name));
            const filteredLinks = data.links.filter(l =>
                highlightSet.has(l.source) && highlightSet.has(l.target)
            );

            const nodesCopy = filteredNodes.map(n => ({ ...n }));
            const linksCopy = filteredLinks.map(l => ({ ...l }));

            // (4) 기존 인스턴스가 있으면 제거
            if (filteredGraph) {
                canvasContainer.innerHTML = '';
            }

            const layerColorMap = {
                'Concept_lv1': '#ff0000',  // 진한 빨강
                'Concept_lv2': '#ff6666',  // 약간 연한 빨강
                'Event'      : '#ffbbbb',  // 더 연한 빨강
                'Youtube'    : '#ffffff'   // 가장 연한 빨강
            };

            // (5) 새 ForceGraph3D 인스턴스 생성
            filteredGraph = ForceGraph3D()(canvasContainer)
                .graphData({nodes: nodesCopy, links: linksCopy})
                .nodeId('name')
                .nodeLabel(n => n.name)
                .width(canvasContainer.clientWidth)
                .height(canvasContainer.clientHeight)
                .nodeRelSize(8)
                .nodeVal(8)          // 노드 크기 확대
                .linkWidth(LINK_WIDTH)  // 얇게
                .nodeColor(n => layerColorMap[n.label] || DEFAULT_COLOR)
                .linkColor(() => HIGHLIGHT_COLOR)
                .backgroundColor('rgba(0,0,0,0)')
                .d3Force('charge', d3.forceManyBody().strength(-60))
                .d3Force('link', d3.forceLink().distance(50).strength(1))
                .d3Force('center', d3.forceCenter(0, 0, 0))
        });

        // ① 버튼 참조
        const btnLinkPred = document.getElementById('link_pred');

        // ② 클릭 핸들러 등록
        btnLinkPred.addEventListener('click', () => {
            // (선택) 요청 직전에 사용자에게 로딩 표시
            btnLinkPred.disabled = true;
            btnLinkPred.textContent = '검색 중…';

            // ③ API 호출 (POST 예시)
            fetch('/api/hidden-relations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // 필요하다면 본문에 추가 파라미터를 담아 보낼 수 있습니다.
                body: JSON.stringify({
                    // 예: 현재 강조된 노드 집합
                    nodes: Array.from(highlightSet),
                    // 예: 현재 inter-layer 링크
                    links: interLayerLinks
                })
            })
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                .then(data => {
                    console.log('숨은 관계 결과:', data);
                    // TODO: 받은 data를 바탕으로 UI에 표시하거나,
                    //       filtered-graph 등에 업데이트 로직을 추가
                })
                .catch(err => {
                    console.error('숨은 관계 검색 중 에러:', err);
                    alert('숨은 관계 검색에 실패했습니다.');
                })
                .finally(() => {
                    // 버튼 상태 원복
                    btnLinkPred.disabled = false;
                    btnLinkPred.textContent = '숨은 관계 찾기';
                });
        });
    })

    .catch(err => {
        console.error(err);
        alert('그래프 로딩에 실패했습니다.');
    })
    .finally(() => {
        // ③ hide it when done (whether success or fail)
        loader.classList.add('hidden');
    });