const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// 既存のファイルを読み込むヘルパー
function loadFile(filePath) {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
    }
    return null;
}

// members.jsの内容をパースする（JavaScriptファイルなので簡易的に評価するか、Regexで抽出）
// ここではNode.js環境で実行するため、requireではなくファイル読み込みで処理します
// update: members.js is `const membersData = [...]`, so we can strip the variable decl and parse JSON
function loadMembers() {
    const content = loadFile(path.join(__dirname, '../members.js'));
    if (!content) return [];

    // `const membersData = ` を削除し、末尾の `;` を削除して JSON parse を試みる
    // 注意: 完全なJS評価ではないため、データが単純なJSONライクな構造であることを前提とします
    const jsonStr = content.replace(/^const membersData\s*=\s*/, '').replace(/;s*$/, '').trim();
    // JSオブジェクトリテラルはJSONではない（キーにクォートがない場合など）ので
    // 今回は簡易的に `eval` を使いますが、セキュリティ的には信頼できるソースのみに限るべきです
    // GitHub Actions環境下では自身のコードなので許容します
    try {
        return eval(jsonStr);
    } catch (e) {
        console.error("Failed to parse members.js", e);
        return [];
    }
}

// 既存のsns_data.jsを読み込んで前回のデータを取得
// 既存のsns_data.jsを読み込んで前回のデータを取得
function loadPreviousStats() {
    const content = loadFile(path.join(__dirname, '../sns_data.js'));
    if (!content) return {};

    // ファイル内容から snsStats オブジェクト部分を抽出してパースする
    // 想定形式: const snsStats = { ... };
    try {
        const match = content.match(/const snsStats\s*=\s*(\{[\s\S]*\});?/);
        if (match && match[1]) {
            return eval(`(${match[1]})`);
        }
    } catch (e) {
        console.error("Failed to parse previous sns_data.js", e);
    }
    return {};
}

async function scrapeProfile(page, url, platform) {
    if (!url) return null;

    try {
        // Human-like viewport
        await page.setViewport({ width: 1366, height: 768 });

        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

        // Random slight delay to mimic human
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

        let followerCount = null;

        if (platform === 'tiktok') {
            // Priority 1: Try to find precise data in script tags (SIGI_STATE or __UNIVERSAL_DATA_FOR_REHYDRATION__)
            try {
                const scripts = await page.$$eval('script', els =>
                    els.filter(e => e.textContent.includes('followerCount') || e.textContent.includes('userInteractionCount'))
                        .map(e => e.textContent)
                );
                let bestCount = null;

                for (const content of scripts) {
                    if (!content) continue;

                    // Match all followerCount occurrences
                    // TikTok often has "stats":{"followerCount":4900000} AND "statsV2":{"followerCount":"4946894"}
                    const matches = content.match(/"followerCount":\s*"?(\d+)"?/g);
                    if (matches) {
                        for (const m of matches) {
                            const valMatch = m.match(/\d+/);
                            if (valMatch) {
                                const val = parseInt(valMatch[0], 10);
                                // Prioritize the most "precise" looking number (not ending in many zeros)
                                // or simply the largest if they are very close
                                if (!bestCount || (val > bestCount && val < bestCount * 1.05)) {
                                    // If the new value is slightly larger but close, it's likely the precise one
                                    bestCount = val;
                                } else if (val % 1000 !== 0 && (bestCount % 1000 === 0)) {
                                    // If new value is not rounded but old one was, prefer new
                                    bestCount = val;
                                }
                            }
                        }
                    }

                    // Fallback to searching schema.org/JSON-LD interaction counts
                    // Must strictly check for FollowAction to avoid picking up LikeAction (heart count)
                    if (content.includes('InteractionCounter') && content.includes('FollowAction')) {
                        // Try to match standard Schema.org structure:
                        // { "@type": "InteractionCounter", "interactionType": "http://schema.org/FollowAction", "userInteractionCount": 12345 }
                        const interactionMatch = content.match(/"interactionType":"[^"]*FollowAction"[^}]*"userInteractionCount":(\d+)/) ||
                            content.match(/"userInteractionCount":(\d+)[^}]*"interactionType":"[^"]*FollowAction"/);

                        if (interactionMatch && interactionMatch[1]) {
                            const val = parseInt(interactionMatch[1], 10);
                            console.log(`    (Found Schema FollowAction count: ${val})`);
                            // This is likely the most accurate count if present
                            bestCount = val;
                        }
                    }
                }

                if (bestCount && bestCount > 0) {
                    console.log(`    (Found precise count: ${bestCount})`);
                    return bestCount;
                }
            } catch (e) {
                console.log(`    Script data extraction failed: ${e.message}`);
            }

            // Priority 2: "title" attribute or other fallbacks (might be rounded)
            try {
                const titleVal = await page.$eval('[data-e2e="followers-count"]', el => el.getAttribute('title'));
                if (titleVal && !titleVal.includes('フォロワー') && !titleVal.includes('Followers')) {
                    const count = parseCount(titleVal);
                    if (count > 0) return count;
                }
            } catch (e) { }

            // Priority 3: Standard text content (might be 4.9M)
            try {
                const el = await page.$('[data-e2e="followers-count"]');
                if (el) {
                    const text = await (await el.getProperty('textContent')).jsonValue();
                    followerCount = parseCount(text);
                }
            } catch (e) { }

            // Strategy 3: Meta Description (Fallback)
            if (!followerCount) {
                try {
                    const meta = await page.$('meta[name="description"]');
                    if (meta) {
                        const content = await (await meta.getProperty('content')).jsonValue();
                        const match = content.match(/([\d.,KkMm]+)\s+Followers?/);
                        if (match) {
                            followerCount = parseCount(match[1]);
                        }
                    }
                } catch (e) { }
            }
        }

        // ... (Instagram logic skipped as per previous instruction) ...

        return followerCount;

    } catch (e) {
        console.log(`    Failed to scrape ${url}: ${e.message}`);
        return null;
    }
}

function parseCount(str) {
    if (!str) return 0;
    // Remove non-numeric characters except . , K M
    str = str.toUpperCase().replace(/[^\d.,KM]/g, '').trim();

    // If it's a pure number with commas (e.g. "4,912,345"), handle strictly
    if (!str.includes('K') && !str.includes('M')) {
        return parseInt(str.replace(/,/g, ''), 10) || 0;
    }

    let multiplier = 1;
    if (str.includes('K')) {
        multiplier = 1000;
        str = str.replace('K', '');
    } else if (str.includes('M')) {
        multiplier = 1000000;
        str = str.replace('M', '');
    }

    str = str.replace(/,/g, ''); // 1.2M -> 1.2

    const val = parseFloat(str);
    if (isNaN(val)) return 0;

    return Math.floor(val * multiplier);
}

// Main Process
(async () => {
    const members = loadMembers();
    if (members.length === 0) {
        console.log("No members found.");
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        headless: "new",
        channel: 'chrome', // Use system installed Chrome
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    // Set User Agent to avoid immediate blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Filter for Active Members Only (Reqular, Trainee, JKT48V)
    // Graduates often have no links or mixed content, and Instagram is too strict.
    // We will focus on TikTok for Active members to ensure success.
    const activeMembers = members.filter(m =>
        ['Regular', 'Trainee', 'JKT48V'].includes(m.status)
    );

    // Load previous stats to use as fallback
    const prevStats = loadPreviousStats();
    const newStats = {}; // Initialize newStats object

    console.log(`Starting update for ${activeMembers.length} active members (TikTok only)...`);

    for (const member of activeMembers) {
        console.log(`Checking ${member.name} (ID: ${member.id})...`);

        // Get previous data for this member
        const prev = prevStats[member.id] || {
            x: 0,
            instagram: 0,
            tiktok: 0,
            x_diff: 0,
            ig_diff: 0,
            tk_diff: 0
        };

        let tkCount = prev.tiktok;
        // Keep previous Instagram count since we are skipping it
        let igCount = prev.instagram;

        // TikTok Scraping Only
        if (member.socials && member.socials.tiktok) {
            const scrapedTk = await scrapeProfile(page, member.socials.tiktok, 'tiktok');
            if (scrapedTk !== null && scrapedTk > 0) {
                tkCount = scrapedTk;
            }
        }

        // Calculate diffs
        const tkDiff = tkCount - prev.tiktok;

        // Update stats
        newStats[member.id] = {
            id: member.id,
            name: member.name,
            x: prev.x,
            instagram: igCount,
            tiktok: tkCount,
            total: prev.x + igCount + tkCount,
            x_diff: 0,
            ig_diff: 0, // No update for IG
            tk_diff: tkDiff,
            socials: member.socials,
            total_diff: tkDiff // Only TikTok growth contributes to daily diff today
        };

        console.log(`  -> TK: ${tkCount} (${tkDiff >= 0 ? '+' : ''}${tkDiff})`);
    }

    // Copy over inactive members data (Graduates, etc.) without updating
    members.forEach(m => {
        if (!newStats[m.id]) {
            newStats[m.id] = prevStats[m.id] || {
                id: m.id,
                name: m.name,
                x: 0, instagram: 0, tiktok: 0, total: 0,
                x_diff: 0, ig_diff: 0, tk_diff: 0,
                socials: m.socials, total_diff: 0
            };
        }
    });

    await browser.close();

    // Generate sns_data.js content
    const now = new Date();
    // JST表示用の文字列を作成 (簡易的)
    const dateStr = now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });

    const fileContent = `// SNS Stats Data
// Updated at: ${now.toISOString()}

const lastUpdated = "${dateStr}";
const snsStats = ${JSON.stringify(newStats, null, 2)};
`;

    fs.writeFileSync(path.join(__dirname, '../sns_data.js'), fileContent);
    console.log("sns_data.js updated successfully.");

})();
