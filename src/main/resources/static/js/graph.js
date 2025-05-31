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

        // 레이어 간 연결만 따로 필터
        const interLayerLinks = data.links.filter(l =>
            (conceptLv1Nodes.some(n => n.name === l.source) && conceptLv2Nodes.some(n => n.name === l.target)) ||
            (conceptLv2Nodes.some(n => n.name === l.source) && eventNodes.some(n => n.name === l.target)) ||
            (eventNodes.some(n => n.name === l.source) && youtubeNodes.some(n => n.name === l.target))
        );

        const graphs = {};

        // ===== 레이어 4 (Concept_lv1)
        graphs['4'] = ForceGraph3D()(document.getElementById('graph-level-4'))
            .graphData({ nodes: conceptLv1Nodes, links: conceptLv1Links })
            .nodeId('name') // id값이 없어서 추가
            .nodeLabel(n => n.name)
            .nodeAutoColorBy('group')
            .width(1200)
            .height(800)
            .nodeRelSize(3)  // 노드 크기 작게
            .linkWidth(0.5)  // 얇게
            .linkColor(() => '#ffffff')
            .showNavInfo(false)  // 우측 하단 info 제거
            .backgroundColor('#1F957233')  // 레이어4 파랑
            .enablePointerInteraction(false)
            .enableNavigationControls(false);

            // ===== 레이어 3 (Concept_lv2)
        graphs['3'] = ForceGraph3D()(document.getElementById('graph-level-3'))
            .graphData({ nodes: conceptLv2Nodes, links: conceptLv2Links })
            .nodeId('name') // id값이 없어서 추가
            .nodeLabel(n => n.name)
            .nodeAutoColorBy('group')
            .width(1200)
            .height(800)
            .nodeRelSize(3)  // 노드 크기 작게
            .linkWidth(0.5)  // 얇게
            .linkColor(() => '#ffffff')
            .showNavInfo(false)  // 우측 하단 info 제거
            .backgroundColor('#7BBEDF33')
            .enablePointerInteraction(false)
            .enableNavigationControls(false);


        // ===== 레이어 2 (Event)
        graphs['2'] = ForceGraph3D()(document.getElementById('graph-level-2'))
            .graphData({ nodes: eventNodes, links: eventLinks })
            .nodeId('name') // id값이 없어서 추가
            .nodeLabel(n => n.name)
            .nodeAutoColorBy('group')
            .width(1200)
            .height(800)
            .nodeRelSize(3)  // 노드 크기 작게
            .linkWidth(0.5)  // 얇게
            .linkColor(() => '#ffffff')
            .showNavInfo(false)  // 우측 하단 info 제거
            .backgroundColor('#2AC2BD33')
            .enablePointerInteraction(false)
            .enableNavigationControls(false);


        // ===== 레이어 1 (youtube)
        graphs['1'] = ForceGraph3D()(document.getElementById('graph-level-1'))
            .graphData({ nodes: youtubeNodes, links: youtubeLinks })
            .nodeId('name') // id값이 없어서 추가
            .nodeLabel(n => n.name)
            .nodeAutoColorBy('group')
            .width(1200)
            .height(800)
            .nodeRelSize(3)  // 노드 크기 작게
            .linkWidth(0.5)  // 얇게
            .linkColor(() => '#ffffff')
            .showNavInfo(false)  // 우측 하단 info 제거
            .backgroundColor('#5F72A433')
            .enablePointerInteraction(false)
            .enableNavigationControls(false);


        // ===== 통합 레이어 간 연결 (merged)
        graphs['merged'] = ForceGraph3D()(document.getElementById('graph-level-merged'))
            .graphData({ nodes: data.nodes, links: interLayerLinks })
            .nodeId('name') // id값이 없어서 추가
            .nodeLabel(n => n.name)
            .nodeAutoColorBy('group')
            .linkWidth(0.5)
            .showNavInfo(false)  // 우측 하단 info 제거
            .backgroundColor('transparent')
            .enablePointerInteraction(false)
            .enableNavigationControls(false);

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
                    graphDiv.classList.add('fullscreen-graph');

                    // 5) 해당 그래프 인스턴스만 interaction 켜기
                    graphs[levelId]
                        .enablePointerInteraction(true)
                        .enableNavigationControls(true)
                        .width(window.innerWidth)
                        .height(window.innerHeight)
                        .nodeRelSize(3)    // 노드 크기 확대
                        .linkWidth(0.5);     // 링크 두께 확대

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
                                .nodeRelSize(3)
                                .linkWidth(0.5);
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

    });