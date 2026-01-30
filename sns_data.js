// SNS Stats Data
// In a real scenario, this would be updated by a backend script daily.
// For this demo, we generate mock data based on the existing members.

const snsStats = {};

(function initializeStats() {
    if (typeof membersData === 'undefined') return;

    // Seed for consistent pseudo-random numbers
    let seed = 1234;
    function random() {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    membersData.forEach(member => {
        // Base popularity factor based on Generation (mock logic)
        let baseFactor = 1;
        if (member.generation && member.generation <= 7) baseFactor = 3;
        else if (member.generation && member.generation <= 9) baseFactor = 2;

        const xBase = Math.floor(50000 * baseFactor + random() * 100000);
        const igBase = Math.floor(100000 * baseFactor + random() * 200000);
        const tkBase = Math.floor(80000 * baseFactor + random() * 150000);

        snsStats[member.id] = {
            id: member.id,
            name: member.name,
            x: xBase,
            instagram: igBase,
            tiktok: tkBase,
            total: xBase + igBase + tkBase,
            // Daily increase
            x_diff: Math.floor(random() * 500 * baseFactor),
            ig_diff: Math.floor(random() * 1000 * baseFactor),
            tk_diff: Math.floor(random() * 1500 * baseFactor),
            // URLs for convenience
            socials: member.socials
        };
        snsStats[member.id].total_diff = snsStats[member.id].x_diff + snsStats[member.id].ig_diff + snsStats[member.id].tk_diff;
    });
})();
