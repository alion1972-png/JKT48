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
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // プラットフォームごとのセレクタ（※サイトのデザイン変更ですぐ動かなくなります）
        // これは一例です
        let followerCount = null;

        if (platform === 'tiktok') {
            // TikTok Selector example
            // <strong title="Followers" data-e2e="followers-count">1.2M</strong>
            const el = await page.$('[data-e2e="followers-count"]');
            if (el) {
                const text = await (await el.getProperty('textContent')).jsonValue();
                followerCount = parseCount(text);
            }
        } else if (platform === 'instagram') {
            // Instagram is very hard via scraper without login.
            // Often returns login gate.
            // Try looking for meta description: "100k Followers, ..."
            const meta = await page.$('meta[name="description"]');
            if (meta) {
                const content = await (await meta.getProperty('content')).jsonValue();
                // "123K Followers, 10 Following, ..."
                const match = content.match(/([0-9.,KkMm]+)\s+Followers?/);
                if (match) followerCount = parseCount(match[1]);
            }
        } else if (platform === 'x' || platform === 'twitter') {
            // X is extremely protected. 
            // Often relies on looking at specific aria-labels or text content.
            // Very prone to failure.
            // Skip for stability in this demo or return mock if failed.
        }

        return followerCount;

    } catch (e) {
        console.log(`Failed to scrape ${url}: ${e.message}`);
        return null;
    }
}

function parseCount(str) {
    if (!str) return 0;
    str = str.toUpperCase().replace(/,/g, '').trim();
    let multiplier = 1;
    if (str.includes('K')) {
        multiplier = 1000;
        str = str.replace('K', '');
    } else if (str.includes('M')) {
        multiplier = 1000000;
        str = str.replace('M', '');
    }
    return Math.floor(parseFloat(str) * multiplier);
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
