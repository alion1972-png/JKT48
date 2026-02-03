document.addEventListener('DOMContentLoaded', () => {
    const membersContainer = document.getElementById('members-container');
    const filterBtns = document.querySelectorAll('.filter-btn');

    let allMembers = (typeof membersData !== 'undefined') ? membersData : [];

    if (allMembers.length === 0) {
        console.error('No membersData found. Please ensure members.js is loaded.');
        return;
    }

    // Initial load: Show Regular by default since All is removed
    filterMembers('Regular');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterType = btn.getAttribute('data-filter');
            // Reset scroll to top when switching tabs
            window.scrollTo(0, 0);

            filterMembers(filterType);
        });
    });

    function filterMembers(type) {
        if (type === 'Ranking') {
            membersContainer.classList.remove('members-grid');
            renderRanking();
            return;
        } else if (type === 'Links') {
            membersContainer.classList.remove('members-grid');
            renderLinks();
            return;
        } else {
            membersContainer.classList.add('members-grid');
        }

        const filtered = allMembers.filter(member => member.status === type);

        if (type === 'Graduate') {
            renderGrouped(filtered, 'generation', (key) =>
                key === 'Unknown' ? 'Others' : `${key}th Generation`
            );
        } else if (type === 'Regular') {
            const teamOrder = ['Tim Love', 'Tim Dream', 'Tim Passion', 'JKT48V'];
            renderGrouped(filtered, 'team', (key) =>
                key === 'Unknown' ? 'No Team' : key,
                (a, b) => {
                    const idxA = teamOrder.indexOf(a);
                    const idxB = teamOrder.indexOf(b);
                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                    if (idxA !== -1) return -1;
                    if (idxB !== -1) return 1;
                    return a.localeCompare(b);
                }
            );
        } else {
            renderGrid(filtered, type === 'Staff');
        }
    }


    function renderGrid(members, isStaff) {
        membersContainer.innerHTML = '';
        if (members.length === 0) {
            membersContainer.innerHTML = '<p style="color:var(--text-muted); text-align:center; grid-column: 1/-1;">No members found.</p>';
            return;
        }

        members.forEach((member, index) => {
            membersContainer.appendChild(createCard(member, isStaff, index));
        });
    }

    function renderGrouped(members, field, titleFn, sortFn = null) {
        membersContainer.innerHTML = '';

        // グループ化
        const grouped = {};
        members.forEach(m => {
            const key = (m[field] && String(m[field]).trim())
                ? String(m[field]).trim()
                : 'Unknown';
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(m);
        });

        // 並び順
        const keys = Object.keys(grouped);
        if (sortFn) {
            keys.sort(sortFn);
        } else {
            // 数値が含まれる場合は数値順にソート (例: "1" < "2" < "10")
            keys.sort((a, b) => {
                const numA = parseFloat(a);
                const numB = parseFloat(b);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                return a.localeCompare(b);
            });
        }

        // ナビゲーション (Chips) の作成 - コンテナ直下（全幅）
        if (keys.length > 3) { // グループが多い場合のみ表示
            const nav = document.createElement('div');
            nav.className = 'group-nav';
            keys.forEach(key => {
                const btn = document.createElement('button');
                btn.className = 'nav-chip';
                // 短いラベルを作成 (Generation -> 期)
                let label = titleFn(key);
                if (label.includes('Generation')) {
                    label = label.replace('Generation', '期').replace('th', '').replace('st', '').replace('nd', '').replace('rd', '');
                }
                btn.textContent = label;
                btn.onclick = () => {
                    const el = document.getElementById(`group-${key.replace(/\s+/g, '-')}`);
                    if (el) {
                        // Header height offset
                        const headerOffset = 100;
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth"
                        });
                    }
                };
                nav.appendChild(btn);
            });
            membersContainer.appendChild(nav);
        }

        // コンテンツ用のコンテナを作成（幅制限あり）
        const contentContainer = document.createElement('div');
        contentContainer.className = 'content-container';

        keys.forEach(key => {
            // 見出し
            const cleanKey = key.replace(/\s+/g, '-');
            const header = document.createElement('div');
            header.className = 'generation-section';
            header.id = `group-${cleanKey}`; // Navigation target
            header.innerHTML = `<h3 class="generation-title">${titleFn(key)}</h3>`;
            contentContainer.appendChild(header);

            // 中身 - このセクション用のGridコンテナを作るなどしてもいいが、
            // シンプルにCardを追加していく。CSS gridレイアウト調整のため、
            // ここでは generation-section ごとに区切らず、フラットに並べるか、
            // あるいは generation 単位でサブコンテナを作る。
            // 既存のCSS (.members-grid) との兼ね合いで、
            // style.cssで .content-container に .members-grid のようなグリッドを与えるか、
            // あるいはここでサブコンテナを作る。
            // 今回は、各グループをサブコンテナにするのが綺麗（見出しとの関係上）。

            const subGrid = document.createElement('div');
            subGrid.className = 'members-grid'; // Use grid style within container
            subGrid.style.width = '100%'; // Ensure full width of parent
            subGrid.style.padding = '0'; // Remove default padding of .members-grid inside here

            grouped[key].forEach((member, i) => {
                subGrid.appendChild(createCard(member, false, i));
            });
            contentContainer.appendChild(subGrid);
        });

        membersContainer.appendChild(contentContainer);
    }

    // ...

    function renderLinks() {
        membersContainer.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'content-container';

        // Header
        const header = document.createElement('h2');
        header.textContent = 'Recommended Links';
        header.style.color = '#fff';
        header.style.fontFamily = 'var(--font-heading)';
        header.style.marginBottom = '1.5rem';
        header.style.borderLeft = '5px solid var(--primary)';
        header.style.paddingLeft = '1rem';
        container.appendChild(header);

        if (typeof linksData === 'undefined' || !linksData) {
            container.innerHTML += '<p style="color:var(--text-muted)">No links data found.</p>';
            membersContainer.appendChild(container);
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'links-container';

        linksData.forEach(cat => {
            const section = document.createElement('div');
            section.className = 'link-section';

            section.innerHTML = `
                <h3 class="link-cat-title">${cat.category}</h3>
                <p class="link-cat-desc">${cat.description || ''}</p>
                <div class="link-list">
                    ${cat.items.map(item => `
                        <a href="${item.url}" target="_blank" class="link-item">
                            <span class="link-title"><i class="fa-solid fa-link"></i> ${item.title}</span>
                            <span class="link-note">${item.note || ''}</span>
                        </a>
                    `).join('')}
                </div>
            `;
            grid.appendChild(section);
        });

        container.appendChild(grid);
        membersContainer.appendChild(container);
    }
});
