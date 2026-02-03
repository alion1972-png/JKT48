const linksData = [
    {
        category: "Official Channels",
        description: "JKT48の公式動画や運営情報の配信チャンネル一覧です。",
        items: [
            {
                title: "JKT48 Official YouTube",
                url: "https://www.youtube.com/@JKT48",
                note: "JKT48のMVや配信アーカイブ。「JKT48」の公式アカウント"
            },
            {
                title: "JKT48 TV (YouTube)",
                url: "https://www.youtube.com/c/JKT48TV",
                note: "バラエティ企画や舞台裏映像が満載の公式サブチャンネル。"
            },
            {
                title: "JKT48 Official Website",
                url: "https://jkt48.com",
                note: "公式スケジュール、ニュース、プロフィールはこちら。"
            },
            {
                title: "JKT48 Official X",
                url: "https://x.com/officialJKT48",
                note: "運営からの最新のお知らせ、公演情報など。"
            },
            {
                title: "JKT48 Official Facebook",
                url: "https://www.facebook.com/official.JKT48/",
                note: "「JKT48」の公式アカウント"
            },
            {
                title: "JKT48 Official Instagram",
                url: "https://www.instagram.com/jkt48",
                note: "「JKT48」の公式アカウント。"
            },
            {
                title: "JKT48 Official TikTok",
                url: "https://www.tiktok.com/@jkt48.official",
                note: "「JKT48」の公式アカウント。"
            }
        ]
    },
    {
        category: "Official Teams (X/Twitter)",
        description: "各チームの公式Xアカウントなど。",
        items: [
            {
                title: "Team Love Official X",
                url: "", // こちらにURLを入力してください
                note: "Team Loveの最新情報。"
            },
            {
                title: "Team Dream Official X",
                url: "", // こちらにURLを入力してください
                note: "Team Dreamの最新情報。"
            },
            {
                title: "Team Passion Official X",
                url: "", // こちらにURLを入力してください
                note: "Team Passionの最新情報。"
            }
        ]
    },
    {
        category: "Official Goods & Shop",
        description: "グッズやチケット、ショップ関連の公式アカウント。",
        items: [
            {
                title: "JKT48 Merchandise X",
                url: "", // こちらにURLを入力してください
                note: "公式グッズ情報。"
            },
            {
                title: "JKT48 Private Message",
                url: "https://x.com/jkt48_pm",
                note: "メンバーからのプライベートメッセージサービス公式。"
            },
            {
                title: "JKT48 Official Store (Tokopedia)",
                url: "https://www.tokopedia.com/officialjkt48",
                note: "公式オンラインショップ。"
            }
        ]
    },
    {
        category: "JKT48 Services",
        description: "JKT48関連のサービス、アプリなど",
        items: [
            {
                title: "IDN App",
                url: "https://www.idn.app/",
                note: "JKT48の個人live配信や劇場公演やコンサートのlive配信などが見れるアプリ。"
            },
            {
                title: "VIDEO CALL WITH JKT48",
                url: "https://www.youtube.com/@JKT48V_official",
                note: "JKT48メンバーとのビデオ通話サービス"
            }
        ]
    },
    {
        category: "JKT48V",
        description: "JKT48の完全なバーチャルサブユニットです",
        items: [
            {
                title: "JKT48V Official Website",
                url: "https://jkt48.com/jkt48v",
                note: "バーチャルアイドルユニット「JKT48V」の公式サイト。"
            },
            {
                title: "JKT48V Official X",
                url: "https://x.com/JKT48V_official",
                note: "JKT48Vの様々な情報を発信する「JKT48V」の公式アカウント。"
            },
            {
                title: "JKT48V Official YouTube",
                url: "https://www.youtube.com/@JKT48V_official",
                note: "JKT48VのMVや配信アーカイブ。「JKT48V」の公式アカウント"
            },
            {
                title: "JKT48V Official Instagram",
                url: "https://www.instagram.com/jkt48v_official",
                note: "バーチャルアイドルユニット「JKT48V」の公式アカウント。"
            }
        ]
    },
    {
        category: "Quadlips",
        description: "アジア各都市に展開を広げるAKB48グループの選抜メンバーによるユニット",
        items: [
            {
                title: "Quadlips Official X",
                url: "https://x.com/quadlips_staff",
                note: "Quadlipsの公式アカウント。"
            },
            {
                title: "Quadlips Official YouTube",
                url: "https://www.youtube.com/@QUADLIPS",
                note: "QuadlipsのMVや配信アーカイブ。"
            }
        ]
    },
    {
        category: "Recommended Media",
        description: "メンバーが出演した外部チャンネルやおすすめ動画。",
        items: [
            {
                title: "Iclub48 NetTV",
                url: "https://www.youtube.com/@Iclub48",
                note: "nettvによるメンバー主演の番組。"
            },
            {
                title: "YOKOSO JKT48",
                url: "https://www.youtube.com/@YokosoJKT48",
                note: "日本を紹介する番組「YOKOSO JKT48」の動画。"
            },
            {
                title: "MNCTV Official",
                url: "https://www.youtube.com/@MNCTVOfficialId/search?query=jkt48",
                note: "MNCTV OfficialのJKT48の動画。"
            },
            {
                title: "MDTV OFFICIAL",
                url: "https://www.youtube.com/@mdtelevisi/search?query=jkt48",
                note: "MDTV OFFICIALのJKT48の動画。（旧NET.TV）"
            },
            {
                title: "VIVA JKT48 2014",
                url: "https://www.youtube.com/@OfficialRCTI/search?query=jkt48",
                note: "RCTIのJKT48の動画。"
            }
        ]
    },
    {
        category: "FanCam",
        description: "JKT48のファンカム",
        items: [
            {
                title: "dialektikaksara TV",
                url: "https://www.youtube.com/@dialektikaksaraTV",
                note: "代表的なJKT48のファンカム。"
            },
            {
                title: "黃偉平Fujiwara",
                url: "https://www.youtube.com/@Fujiwara",
                note: "代表的なJKT48のファンカム。"
            }
        ]
    }
];
