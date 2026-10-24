const CONFIG = {
    gameWikiBase: 'https://windblown.wiki.gg',
    categories: {
        weapons: { label: 'Weapons', total: 28, min: 8 },
        trinkets: { label: 'Trinkets', total: 25, min: 8 },
        magifishes: { label: 'Magifishes', total: 3, min: 2 },
        gifts: { label: 'Gifts', total: 135, min: 35 },
        hexes: { label: 'Hexes', total: 20, min: 8 }
    },
    globalMinTotal: 80,
    storageKey: 'deck_builder_state',
    CHRYSALIS_HEX_NAME: 'Random Chrysalis Hex'
};

/* ============================================================
   VERSION-DEPENDENT DECK RULES
   Each entry applies from its version onward, until the next
   entry's version starts. Versions older than the first entry
   use the first entry. Unparsed/unknown versions use the newest.
   ============================================================ */
const VERSION_CONFIGS = [
    {
        since: 'Version 0.1',
        categories: {
            weapons:    { total: 28, min: 8 },
            trinkets:   { total: 25, min: 8 },
            magifishes: { total: 3,  min: 2 },
            gifts:      { total: 135, min: 35 },
            hexes:      { total: 20, min: 8 }
        },
        globalMinTotal: 80
    },
    {
        since: 'Version 0.11',
        categories: {
            weapons:    { total: 28, min: 15 },
            trinkets:   { total: 24, min: 12 },
            magifishes: { total: 4,  min: 2 },
            gifts:      { total: 136, min: 50 },
            hexes:      { total: 20, min: 10 }
        },
        globalMinTotal: 110
    }
];

let versionConfigsParsed = null;

function getVersionConfigs() {
    if (!versionConfigsParsed) {
        versionConfigsParsed = VERSION_CONFIGS
            .map(cfg => ({ ...cfg, parsed: parseVersion(cfg.since) }))
            .filter(cfg => cfg.parsed)
            .sort((a, b) => compareVersions(a.parsed, b.parsed)); // oldest → newest
    }
    return versionConfigsParsed;
}

function resolveVersionConfig(versionStr) {
    const configs = getVersionConfigs();
    if (!configs.length) return null;

    // Fall back to the newest version present in the loaded dataset
    const target = parseVersion(versionStr) ||
                   parseVersion(availableVersionsList[availableVersionsList.length - 1]);

    let chosen = configs[0]; // anything older than the first entry gets the first entry
    for (const cfg of configs) {
        if (!target || compareVersions(cfg.parsed, target) <= 0) chosen = cfg;
        else break;
    }
    return chosen;
}

function applyVersionConfig(versionStr) {
    const cfg = resolveVersionConfig(versionStr || appState.selectedVersion);
    if (!cfg) return;

    Object.keys(cfg.categories).forEach(cat => {
        // spread keeps `label` (and anything else) from the base CONFIG
        CONFIG.categories[cat] = { ...CONFIG.categories[cat], ...cfg.categories[cat] };
    });
    CONFIG.globalMinTotal = cfg.globalMinTotal;
}
