// import { GUI } from 'https://esm.sh/dat.gui';

// loading spinner
const loader = document.getElementById('graph-loading');
loader.classList.remove('hidden');

// fetch('http://10.123.236.40:8080/api/graph')
fetch('http://localhost:8080/api/graph')
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
            (eventNodes.some(n => n.name === l.source) && youtubeNodes.some(n => n.name === l.target))
        );

        // name → label 맵
        const nodeLabelMap = new Map(data.nodes.map(n => [n.name, n.label]));

        // 노드 강조용 색상과 기본 색상 정의
        const DEFAULT_COLOR = '#ffffff';
        // const HIGHLIGHT_COLOR = '#ff3333';
        const HIGHLIGHT_COLOR = '#fb4d3d';

        const NODE_REL = 8;
        const NODE_VAL   = 8;
        const LINK_WIDTH  = 3;
        const LINK_COLOR_DEFAULT  = '#08122A00';
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
        const formatLinkLabel = (type) => {
            const color = type === 'isCauseOf'
                ? 'yellow'
                : type === 'isGeneralOf'
                    ? 'green'
                    : 'white';

            const label = type === 'isCauseOf'   ? '인과 관계'
                : type === 'isGeneralOf' ? '관계 있음'
                    : '';

            return `
                <div style="
                  font-weight: 600;
                  font-size: 30px;
                  color: ${color};
                  white-space: nowrap;
                ">
                  ${label}
                </div>
              `;
        };

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
                .linkLabel(link => formatLinkLabel(link.type))
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
            .graphData({ nodes: youtubeNodes, links: youtubeLinks })
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

            // (추가) 유튜브 레이어 intra-link 확산
            youtubeLinks.forEach(l => {
                if (highlightSet.has(l.source) && highlightSet.has(l.target)) {
                    // 한쪽만 있어도 양쪽 다 추가
                    highlightSet.add(l.source);
                    highlightSet.add(l.target);
                }
            });

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
        const btnForce = document.getElementById('layout-force');
        const btnTree  = document.getElementById('layout-tree');

        // (2) 버튼 클릭 핸들러 등록
        btnForce.addEventListener('click', () => {
            if (!filteredGraph) return;
            // dagMode 를 비활성화 → 완전한 force 레이아웃
            filteredGraph
                .dagMode(null)
                .refresh();
        });

        btnTree.addEventListener('click', () => {
            if (!filteredGraph) return;
            // td(top-down) 트리 구조
            filteredGraph
                .dagMode('td')                 // 'td','lr','rl','bu','zout','zin',…
                .dagLevelDistance(100)         // 각 레벨 간격
                .refresh();
        });

        btnShow.addEventListener('click', () => {
            // 토글 표시
            const isVisible = divFiltered.style.display === 'block';
            divFiltered.style.display = isVisible ? 'none' : 'block';
            btnShow.textContent = isVisible ? '구조화 그래프 보기' : '닫기';

            if (isVisible) return;  // 닫기 모드면 그만

            // highlightSet 기준으로 노드/링크 필터링
            const filteredNodes = data.nodes.filter(n => highlightSet.has(n.name));
            const nodesCopy = filteredNodes.map((n, index) => ({
                ...n,
                index: index  // 새로운 인덱스 할당
            }));

            const nameToIndexMap = new Map();
            nodesCopy.forEach((node, index) => {
                nameToIndexMap.set(node.name, index);
            });

            const filteredLinks = data.links.filter(l => {
                // 1) 양쪽 노드가 모두 강조된 상태인지 확인
                const sourceName = typeof l.source === 'object' ? l.source.name : l.source;
                const targetName = typeof l.target === 'object' ? l.target.name : l.target;

                if (!highlightSet.has(sourceName) || !highlightSet.has(targetName)) {
                    return false;
                }

                // 2) source 노드가 Concept_lv1 또는 Concept_lv2 인지 확인
                const srcLabel = nodeLabelMap.get(sourceName);
                const isSrcConcept = srcLabel === 'Concept_lv1' || srcLabel === 'Concept_lv2';

                // 3) 레이어 순위 비교
                const srcRank = layerMap.get(sourceName);
                const tgtRank = layerMap.get(targetName);

                if (isSrcConcept) {
                    // Concept 계열일 때만 상위→하위 (rank 높음→낮음) 관계만 허용
                    return srcRank > tgtRank;
                } else {
                    // 그 밖의 노드(이벤트나 유튜브)는 단순히 강조된 링크만 남기기
                    return true;
                }
            }).map(l => {
                const sourceName = typeof l.source === 'object' ? l.source.name : l.source;
                const targetName = typeof l.target === 'object' ? l.target.name : l.target;

                return {
                    ...l,
                    source: nameToIndexMap.get(sourceName), // 🔥 인덱스로 변환
                    target: nameToIndexMap.get(targetName)  // 🔥 인덱스로 변환
                };
            });


            // const interLinks = youtubeLinks.filter(l => {
            //     // source와 target이 객체인지 문자열인지 확인
            //     const sourceName = typeof l.source === 'object' ? l.source.name : l.source;
            //     const targetName = typeof l.target === 'object' ? l.target.name : l.target;
            //
            //     return highlightSet.has(sourceName) && highlightSet.has(targetName);
            // }).map(l => ({...l}));
            const filteredIntraLayerLinks = youtubeLinks.filter(l => {
                const sourceName = typeof l.source === 'object' ? l.source.name : l.source;
                const targetName = typeof l.target === 'object' ? l.target.name : l.target;
                return highlightSet.has(sourceName) && highlightSet.has(targetName);
            }).map(l => {
                const sourceName = typeof l.source === 'object' ? l.source.name : l.source;
                const targetName = typeof l.target === 'object' ? l.target.name : l.target;

                return {
                    ...l,
                    source: nameToIndexMap.get(sourceName), // 🔥 인덱스로 변환
                    target: nameToIndexMap.get(targetName)  // 🔥 인덱스로 변환
                };
            });

            console.log('filteredLinks');
            console.log(filteredLinks);

            console.log('── 전체 youtubeLinks ──');
            console.log(youtubeLinks);
            console.log('youtubeLinks 객체',youtubeLinks[0]);

            console.log('── highlightSet ──');
            console.log(Array.from(highlightSet));

            console.log('── highlightSet 기반 매칭 youtubeLinks ──');

            console.log(filteredIntraLayerLinks
                // youtubeLinks.filter(l =>
                //     highlightSet.has(l.source) || highlightSet.has(l.target)
                // )
            );

            const linksCopy = [
                ...filteredLinks,  // concept-/event-/event→youtube 링크
                ...filteredIntraLayerLinks      // youtube→youtube 링크
            ];  // 최종 shallow copy

            console.log('nodesCopy')
            console.log((nodesCopy))
            console.log('linksCopy')
            console.log((linksCopy))


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
            const NODE_REL_SIZE = 8;

            // (5) 새 ForceGraph3D 인스턴스 생성
            filteredGraph = ForceGraph3D()(canvasContainer)
                .graphData({nodes: nodesCopy, links: linksCopy})
                .nodeId('index')
                .nodeLabel(n => formatNodeLabel(n.name))
                .dagMode(null)
                .onDagError(cycle => {            // 사이클(루프) 검출시 호출
                    console.error('DAG 사이클 발견:', cycle);
                })
                .width(canvasContainer.clientWidth)
                .height(canvasContainer.clientHeight)
                .nodeRelSize(NODE_REL_SIZE)
                .nodeVal(8)          // 노드 크기 확대
                .nodeColor(n => layerColorMap[n.label] || DEFAULT_COLOR)
                .linkColor(link =>
                    link.type === 'isCauseOf'   ? LINK_COLOR_CAUSE  :
                        link.type === 'isGeneralOf' ? LINK_COLOR_GENERAL:
                            HIGHLIGHT_COLOR
                )
                .linkWidth(LINK_WIDTH)  // 얇게
                .linkDirectionalArrowLength(10)
                .linkDirectionalArrowRelPos(1)
                .linkDirectionalParticles(2)   // 방향성 입자
                .linkDirectionalParticleWidth(1)
                .linkDirectionalParticleColor('white')
                .linkDirectionalArrowLength(10) // 화살표 길이
                .backgroundColor('rgba(0,0,0,0)')
                .d3Force('charge', d3.forceManyBody().strength(-60))
                .d3Force('link', d3.forceLink()
                    .id(d => d.index)
                    // 연결 유형별 거리 조정: 유튜브-유튜브는 30, 나머지는 100
                    .distance(link => {
                        return (link.source.label === 'Youtube' && link.target.label === 'Youtube')
                            ? 40    // 유튜브 간은 촘촘하게
                            : 100;  // 그 외는 널찍하게
                    })
                    // 연결 강도(strength)도 유형별로: 유튜브-유튜브는 0.8, 그 외는 0.2
                    // .strength(link => {
                    //     const src = nodesCopy[link.source];
                    //     const tgt = nodesCopy[link.target];
                    //     return (src.label === 'Youtube' && tgt.label === 'Youtube')
                    //         ? 0.8   // 힘을 세게 주어 뭉치도록
                    //         : 0.2;  // 약하게 주어 느슨히
                    // })
                    .strength(link => {
                        return (link.source.label === 'Youtube' && link.target.label === 'Youtube')
                            ? 1.0  // YT–YT 간은 뭉치도록 강하게
                            : 0.1; // 그 외는 느슨하게
                    })
                )
                // .d3Force('collision',
                //         forceCollide(node => NODE_REL_SIZE + 1)  // 충돌 처리: 반지름 + 여유 1px
                // )
                .d3Force('charge', d3.forceManyBody().strength(-50))
                .d3Force('center', d3.forceCenter(0, 0, 0));
        });

        // ① 버튼 참조
        const btnLinkPred = document.getElementById('link_pred');

        // ② 클릭 핸들러 등록
        btnLinkPred.addEventListener('click', async () => {
            // (선택) 요청 직전에 사용자에게 로딩 표시
            btnLinkPred.disabled = true;
            btnLinkPred.textContent = '검색 중…';

            // ③ API 호출 (POST 예시)
            await fetch('http://regularmark.iptime.org:37003/generate_hiding_relation', {
                method: 'GET',
                // headers: {
                //     'Content-Type': 'application/json'
                // },
            })
                .then(res => {
                    console.log('response OKayyyyyyyy')
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
                })
                // fetch('data/dummy_links.json').then(res => {
                //     if (!res.ok) throw new Error(`더미 JSON 오류: ${res.status}`);
                //     return res.json();
                // })
                .then(data => {
                    console.log('숨은 관계 결과:', data);
                    const predLinks = data.map(l => ({
                        source: l.source,
                        target: l.target,
                        type: l.type,
                        // 원본 링크 객체와 비교하기 위해 ID 같은 고유값을 꼭 포함시켜 주세요.
                        key: `${l.source}⇄${l.target}`
                    }));
                    const predLinkKeySet = new Set(predLinks.map(l => l.key));

                    // 4) 기존 youtube 레이어 링크에 더미 링크 합치기
                    const mergedLinks = [
                        ...youtubeLinks.map(l => ({
                            ...l,
                            key: `${l.source.name||l.source}⇄${l.target.name||l.target}`  // 기존 링크에도 key 설정
                        })),
                        ...predLinks
                    ];
                    // 5) graphs['1']에 새 데이터로 갱신
                    graphs['1']
                        .graphData({ nodes: youtubeNodes, links: mergedLinks })

                        .linkWidth(link =>
                            predLinkKeySet.has(link.key) ? 4 : LINK_WIDTH
                        )
                        // 5) linkDirectionalParticles: 예측 링크만 입자(4개) 띄우기
                        .linkDirectionalParticles(link =>
                            predLinkKeySet.has(link.key) ? 4 : 0
                        )
                        // 6) linkDirectionalParticleWidth: 입자 크기
                        .linkDirectionalParticleWidth(link =>
                            predLinkKeySet.has(link.key) ? 7 : 0
                        )
                        .linkDirectionalParticleColor(link =>
                            predLinkKeySet.has(link.key) ? 'white' : null
                        )

                        // 7) linkColor: 예측 링크는 마젠타, 나머지는 기존 로직
                        .linkColor(link => {
                            if (predLinkKeySet.has(link.key)) {
                                return HIGHLIGHT_COLOR;                      // 예측 링크 강조 색
                            } else if (link.type === 'isCauseOf') {
                                return LINK_COLOR_CAUSE;               // 기존 인과 링크
                            } else if (link.type === 'isGeneralOf') {
                                return LINK_COLOR_GENERAL;             // 기존 일반 링크
                            } else {
                                return LINK_COLOR_DEFAULT;             // 그 외
                            }
                        })

                        // 8) 렌더링 갱신
                        .refresh();
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