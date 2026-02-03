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

        // ナビゲーション (Chips) の作成
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

        keys.forEach(key => {
            // 見出し
            const cleanKey = key.replace(/\s+/g, '-');
            const header = document.createElement('div');
            header.className = 'generation-section';
            header.id = `group-${cleanKey}`; // Navigation target
            header.innerHTML = `<h3 class="generation-title">${titleFn(key)}</h3>`;
            membersContainer.appendChild(header);

            // 中身
            grouped[key].forEach((member, i) => {
                membersContainer.appendChild(createCard(member, false, i));
            });
        });
    }

    function createCard(member, isStaff, delayIndex) {
        const card = document.createElement('article');
        card.className = 'member-card';
        // Reset delay for each section if grouped, but simple delay works too
        card.style.animationDelay = `${(delayIndex % 20) * 0.05}s`;

        let socialHtml = '';
        if (member.socials) {
            // Helper to get non-empty link
            const getLink = (keys) => {
                if (!Array.isArray(keys)) keys = [keys];
                for (const key of keys) {
                    const val = member.socials[key];
                    if (val && val.trim() !== "") return val;
                }
                return null;
            };

            const xLink = getLink(['x', 'twitter']);
            // Support both 'instagram' and 'ig' just in case
            const igLink = getLink(['instagram', 'ig']);
            const ttLink = getLink('tiktok');
            const ytLink = getLink('youtube');

            if (xLink) socialHtml += `<a href="${xLink}" target="_blank" title="X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>`;
            if (igLink) socialHtml += `<a href="${igLink}" target="_blank" title="Instagram"><i class="fa-brands fa-instagram"></i></a>`;
            if (ttLink) socialHtml += `<a href="${ttLink}" target="_blank" title="TikTok"><i class="fa-brands fa-tiktok"></i></a>`;
            if (ytLink) socialHtml += `<a href="${ytLink}" target="_blank" title="YouTube"><i class="fa-brands fa-youtube"></i></a>`;
        }

        // Detail Fields
        let detailsHtml = '';
        if (isStaff) {
            detailsHtml += `<span><span class="label">Role:</span> ${member.relationship || 'Staff'}</span>`;
        } else {
            detailsHtml += `<span><span class="label">Gen:</span> ${member.generation}</span>`;
            detailsHtml += `<span><span class="label">Birthday:</span> ${member.birthdate}</span>`;
            detailsHtml += `<span><span class="label">Origin:</span> ${member.birthplace || '-'}</span>`; // Separated
            if (member.graduation_date) {
                detailsHtml += `<span><span class="label">Graduated:</span> ${member.graduation_date}</span>`;
            }
        }

        if (member.remarks) {
            detailsHtml += `<span class="member-remarks">Note: ${member.remarks}</span>`;
        }

        card.innerHTML = `
            <div class="card-content">
                <span class="status-badge status-${member.status}">${member.status}</span>
                <h3 class="member-name">${member.name}</h3>
                ${!isStaff ? `<p class="member-nickname">${member.nickname}</p>` : ''}
                
                <div class="member-details">
                    ${detailsHtml}
                </div>

                <div class="social-links">
                    ${socialHtml}
                </div>
            </div>
        `;
        return card;
    }

    function renderRanking() {
        membersContainer.innerHTML = '';

        // 更新日時の表示
        if (typeof lastUpdated !== 'undefined') {
            const dateDisplay = document.createElement('div');
            dateDisplay.style.textAlign = 'right';
            dateDisplay.style.color = 'var(--text-muted)';
            dateDisplay.style.marginBottom = '1rem';
            dateDisplay.style.fontSize = '0.9rem';
            dateDisplay.innerHTML = `<i class="fa-regular fa-clock"></i> Data updated: ${lastUpdated}`;
            membersContainer.appendChild(dateDisplay);
        }

        // Helper to attach stats
        const attachStats = (members) => members.map(m => {
            const stats = (typeof snsStats !== 'undefined' && snsStats[m.id]) ? snsStats[m.id] : null;
            return {
                ...m,
                stats: stats || { x: 0, instagram: 0, tiktok: 0, total: 0, x_diff: 0, ig_diff: 0, tk_diff: 0, total_diff: 0 }
            };
        });

        // SECTION 1: ACTIVE MEMBERS (Regular + Trainee)
        // Note: Filter excludes only Staff and Graduate, so Trainees are automatically included if they exist.
        // Explicitly ensuring Trainees are included by logic: !(Staff or Graduate)
        const activeMembers = allMembers.filter(m => m.status !== 'Staff' && m.status !== 'Graduate');
        const activeData = attachStats(activeMembers);

        renderRankingGroup('Active Members Ranking (Regular + Trainee)', activeData);

        // SECTION 2: GRADUATES
        const gradMembers = allMembers.filter(m => m.status === 'Graduate');
        const gradData = attachStats(gradMembers);

        // Spacer
        const spacer = document.createElement('div');
        spacer.style.height = '4rem';
        membersContainer.appendChild(spacer);

        renderRankingGroup('Graduates Ranking', gradData);
    }

    function renderRankingGroup(groupTitle, membersData) {
        // Group Header
        const header = document.createElement('h2');
        header.textContent = groupTitle;
        header.style.color = '#fff';
        header.style.fontFamily = 'var(--font-heading)';
        header.style.marginBottom = '1.5rem';
        header.style.borderLeft = '5px solid var(--primary)';
        header.style.paddingLeft = '1rem';
        membersContainer.appendChild(header);

        if (membersData.length === 0) {
            const msg = document.createElement('p');
            msg.textContent = 'No data available.';
            msg.style.color = 'var(--text-muted)';
            membersContainer.appendChild(msg);
            return;
        }

        const factory = (title, data, valueFn, diffFn, iconClass) => {
            const section = document.createElement('div');
            section.className = 'ranking-section';

            let html = `
                <div class="ranking-header">
                    <h3><i class="${iconClass}"></i> ${title}</h3>
                </div>
                <div class="ranking-list">
            `;

            data.forEach((m, idx) => {
                const val = valueFn(m);
                const diff = diffFn ? diffFn(m) : null;
                const rank = idx + 1;
                let rankClass = 'rank-other';
                if (rank === 1) rankClass = 'rank-1';
                else if (rank === 2) rankClass = 'rank-2';
                else if (rank === 3) rankClass = 'rank-3';

                html += `
                    <div class="ranking-item ${rankClass}">
                        <div class="rank-num">${rank}</div>
                        <div class="rank-name">${m.name} <span class="rank-team">${m.team || m.status}</span></div>
                        <div class="rank-val">
                            <span class="main-val">${val.toLocaleString()}</span>
                            ${diff !== null ? `<span class="diff-val ${diff >= 0 ? 'pos' : 'neg'}">${diff >= 0 ? '+' : ''}${diff.toLocaleString()}</span>` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            section.innerHTML = html;
            return section;
        };

        // 1. Instagram Ranking
        const igRank = [...membersData].sort((a, b) => b.stats.instagram - a.stats.instagram).slice(0, 10);
        membersContainer.appendChild(factory('Instagram Followers', igRank, m => m.stats.instagram, m => m.stats.ig_diff, 'fa-brands fa-instagram'));

        // 2. TikTok Ranking
        const tkRank = [...membersData].sort((a, b) => b.stats.tiktok - a.stats.tiktok).slice(0, 10);
        membersContainer.appendChild(factory('TikTok Followers', tkRank, m => m.stats.tiktok, m => m.stats.tk_diff, 'fa-brands fa-tiktok'));

        // 3. X Ranking (Optional)
        // データが0ばかりでない場合のみ表示、または常に表示するか。
        // User said "if difficult, okay to skip", but we have mock data so let's show it below.
        const xRank = [...membersData].sort((a, b) => b.stats.x - a.stats.x).slice(0, 10);
        if (xRank[0].stats.x > 0) {
            membersContainer.appendChild(factory('X (Twitter) Followers', xRank, m => m.stats.x, m => m.stats.x_diff, 'fa-brands fa-x-twitter'));
        }

        // Growth Rankings (Optional - keep or remove based on "just ranking"? User asked for "follower ranking". 
        // Showing growth adds value, keeping it but maybe simplified or separate section)
        const growthHeader = document.createElement('h3');
        growthHeader.textContent = "Daily Growth Leaders";
        growthHeader.style.color = "var(--primary)";
        growthHeader.style.marginTop = "2rem";
        growthHeader.style.fontFamily = "var(--font-heading)";
        membersContainer.appendChild(growthHeader);

        const growthContainer = document.createElement('div');
        growthContainer.className = 'growth-rankings-grid';

        // IG Growth
        const igSort = [...membersData].sort((a, b) => b.stats.ig_diff - a.stats.ig_diff).slice(0, 5);
        growthContainer.appendChild(factory('Instagram Growth', igSort, m => m.stats.instagram, m => m.stats.ig_diff, 'fa-brands fa-instagram'));

        // TikTok Growth
        const tkSort = [...membersData].sort((a, b) => b.stats.tk_diff - a.stats.tk_diff).slice(0, 5);
        growthContainer.appendChild(factory('TikTok Growth', tkSort, m => m.stats.tiktok, m => m.stats.tk_diff, 'fa-brands fa-tiktok'));

        membersContainer.appendChild(growthContainer);
    }

    function renderLinks() {
        membersContainer.innerHTML = '';

        // Header
        const header = document.createElement('h2');
        header.textContent = 'Recommended Links';
        header.style.color = '#fff';
        header.style.fontFamily = 'var(--font-heading)';
        header.style.marginBottom = '1.5rem';
        header.style.borderLeft = '5px solid var(--primary)';
        header.style.paddingLeft = '1rem';
        membersContainer.appendChild(header);

        if (typeof linksData === 'undefined' || !linksData) {
            membersContainer.innerHTML += '<p style="color:var(--text-muted)">No links data found.</p>';
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

        membersContainer.appendChild(grid);
    }
});
