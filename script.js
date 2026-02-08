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
        // Clear container class - we will handle layout inside render functions
        membersContainer.className = '';

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
        } else if (type === 'Ranking') {
            renderRanking();
        } else if (type === 'Links') {
            renderLinks();
        } else {
            // Trainee and others
            renderGrid(filtered, type === 'Staff');
        }
    }


    function renderGrid(members, isStaff) {
        membersContainer.innerHTML = '';
        if (members.length === 0) {
            membersContainer.innerHTML = '<div class="content-container"><p style="color:var(--text-muted); text-align:center;">No members found.</p></div>';
            return;
        }

        const container = document.createElement('div');
        container.className = 'content-container members-grid'; // Combine width limit and grid layout

        members.forEach((member, index) => {
            container.appendChild(createCard(member, isStaff, index));
        });

        membersContainer.appendChild(container);
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
            const navWrapper = document.createElement('div');
            navWrapper.className = 'nav-wrapper';

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
            navWrapper.appendChild(nav);
            membersContainer.appendChild(navWrapper);
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

    function createCard(member, isStaff, index) {
        const card = document.createElement('div');
        card.className = 'member-card';
        card.style.animationDelay = `${index * 0.05}s`;

        const content = document.createElement('div');
        content.className = 'card-content';

        // 0. Status Badge (Moved to top)
        const badge = document.createElement('span');
        badge.className = `status-badge status-${member.status}`;
        badge.textContent = member.status;
        content.appendChild(badge);

        // 1. Name
        const name = document.createElement('h3');
        name.className = 'member-name';
        name.textContent = member.name;
        content.appendChild(name);

        // 2. Nickname (Except Staff)
        if (member.status !== 'Staff' && member.nickname && member.nickname !== '-') {
            const nick = document.createElement('div');
            nick.className = 'member-nickname';
            nick.textContent = member.nickname;
            content.appendChild(nick);
        }

        const details = document.createElement('div');
        details.className = 'member-details';

        // Helper to add row
        const addDetail = (label, value) => {
            if (value && value !== '-' && value !== '') {
                details.innerHTML += `<span><span class="label">${label}:</span> ${value}</span>`;
            }
        };

        if (member.status === 'Staff') {
            // Staff: Relation, Remarks
            addDetail('Relation', member.relationship);
            addDetail('Remarks', member.remarks);
        } else if (member.status === 'Graduate') {
            // Graduate: Gen, Birthday, Birthplace, Grad Date, Remarks
            addDetail('Gen', member.generation);
            addDetail('Birth', member.birthdate);
            addDetail('Origin', member.birthplace);
            addDetail('Graduated', member.graduation_date);
            addDetail('Remarks', member.remarks);
        } else {
            // Regular, Trainee: Gen, Birthday, Birthplace, Remarks
            addDetail('Gen', member.generation);
            addDetail('Birth', member.birthdate);
            addDetail('Origin', member.birthplace);
            addDetail('Remarks', member.remarks);
        }

        content.appendChild(details);

        // Socials
        if (member.socials) {
            const socialDiv = document.createElement('div');
            socialDiv.className = 'social-links';
            Object.keys(member.socials).forEach(platform => {
                const url = member.socials[platform];
                if (url) {
                    const a = document.createElement('a');
                    a.href = url;
                    a.target = '_blank';
                    let iconClass = '';
                    switch (platform) {
                        case 'x': iconClass = 'fa-brands fa-x-twitter'; break;
                        case 'tiktok': iconClass = 'fa-brands fa-tiktok'; break;
                        case 'instagram': iconClass = 'fa-brands fa-instagram'; break;
                        case 'youtube': iconClass = 'fa-brands fa-youtube'; break;
                        default: iconClass = 'fa-solid fa-link';
                    }
                    a.innerHTML = `<i class="${iconClass}"></i>`;
                    socialDiv.appendChild(a);
                }
            });
            content.appendChild(socialDiv);
        }

        card.appendChild(content);
        return card;
    }

    function formatCount(num) {
        if (!num && num !== 0) return '0';
        if (typeof num === 'string') num = parseInt(num, 10) || 0;

        const full = num.toLocaleString();
        if (num >= 1000000) {
            return `${full} <span class="abbr-val">(${(num / 1000000).toFixed(2)}M)</span>`;
        } else if (num >= 10000) {
            return `${full} <span class="abbr-val">(${(num / 1000).toFixed(1)}K)</span>`;
        }
        return full;
    }

    function renderRanking() {
        membersContainer.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'content-container';

        const header = document.createElement('h2');
        header.textContent = 'TikTok Ranking (Active Members)';
        header.style.color = '#fff';
        header.style.fontFamily = 'var(--font-heading)';
        header.style.marginBottom = '1.5rem';
        header.style.borderLeft = '5px solid var(--primary)';
        header.style.paddingLeft = '1rem';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';

        // Add Last Updated date
        if (typeof lastUpdated !== 'undefined' && lastUpdated) {
            const dateSpan = document.createElement('span');
            dateSpan.textContent = `Updated: ${lastUpdated}`;
            dateSpan.style.fontSize = '0.8rem';
            dateSpan.style.color = 'var(--text-muted)';
            dateSpan.style.fontWeight = 'normal';
            header.appendChild(dateSpan);
        }

        container.appendChild(header);

        if (typeof snsStats === 'undefined' || !snsStats || Object.keys(snsStats).length === 0) {
            container.innerHTML += '<p style="color:var(--text-muted)">No ranking data available.</p>';
            membersContainer.appendChild(container);
            return;
        }

        // Active Members Filter
        const ACTIVE_STATUSES = ['Regular', 'Trainee', 'JKT48V'];
        const activeMemberIds = allMembers
            .filter(m => ACTIVE_STATUSES.includes(m.status))
            .map(m => m.id);

        const activeStats = Object.values(snsStats).filter(s => activeMemberIds.includes(s.id));

        // Sort by TikTok Total
        const sortedTotal = [...activeStats].sort((a, b) => b.tiktok - a.tiktok);
        // Sort by TikTok Growth
        const sortedGrowth = [...activeStats].sort((a, b) => b.tk_diff - a.tk_diff);

        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(350px, 1fr))';
        grid.style.gap = '2rem';

        // TikTok Total Ranking
        const totalSection = document.createElement('div');
        totalSection.className = 'ranking-section';
        totalSection.innerHTML = `
            <div class="ranking-header"><h3><i class="fa-brands fa-tiktok"></i> TikTok Followers</h3></div>
            <div class="ranking-list">
                ${sortedTotal.slice(0, 10).map((s, i) => `
                    <div class="ranking-item rank-${i + 1}">
                        <div class="rank-num">${i + 1}</div>
                        <div class="rank-name" style="flex-grow:1;">
                            <div>${s.name}</div> 
                        </div>
                        <div class="rank-val">
                            <span class="main-val">${formatCount(s.tiktok)}</span>
                            <span class="diff-val ${s.tk_diff >= 0 ? 'pos' : 'neg'}">
                                ${s.tk_diff >= 0 ? '+' : ''}${s.tk_diff.toLocaleString()}
                            </span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        grid.appendChild(totalSection);

        // TikTok Daily Growth Ranking
        const growthSection = document.createElement('div');
        growthSection.className = 'ranking-section';
        growthSection.innerHTML = `
            <div class="ranking-header"><h3><i class="fa-solid fa-arrow-trend-up"></i> Daily Growth (TikTok)</h3></div>
            <div class="ranking-list">
                ${sortedGrowth.slice(0, 10).map((s, i) => `
                    <div class="ranking-item rank-${i + 1}">
                        <div class="rank-num">${i + 1}</div>
                        <div class="rank-name">${s.name}</div>
                        <div class="rank-val">
                            <span class="main-val" style="color:#4cd964">+${s.tk_diff.toLocaleString()}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        grid.appendChild(growthSection);

        container.appendChild(grid);
        membersContainer.appendChild(container);
    }

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
