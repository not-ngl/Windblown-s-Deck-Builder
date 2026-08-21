function getGiftSlotCount() {
    const baseSlots = endlessMode ? 18 : 6;
    const bonusSlots = chrysalisBonusActive && hasChrysalis() ? 6 : 0;
    return baseSlots + bonusSlots;
}

function getHexSlotCount() {
    return endlessMode ? 5 : 1;
}

function hasChrysalis() {
    return currentBuild.hexes.some(hex => hex && hex.name === CONFIG.CHRYSALIS_HEX_NAME);
}

function getChrysalisBonusAvailable() {
    return hasChrysalis();
}

function getUsedItemKeys() {
    const keys = new Set();
    Object.keys(currentBuild).forEach(cat => {
        if (Array.isArray(currentBuild[cat])) {
            currentBuild[cat].forEach(item => {
                if (item) keys.add(item.key);
            });
        } else if (currentBuild[cat]) {
            keys.add(currentBuild[cat].key);
        }
    });
    return keys;
}

function addItemToBuild(item) {
    if (!item) return;
    if (getUsedItemKeys().has(item.key)) return;

    let added = false;

    if (item.category === 'weapons') {
        for (let i = 0; i < currentBuild.weapons.length; i++) {
            if (currentBuild.weapons[i] === null) {
                currentBuild.weapons[i] = item;
                added = true;
                break;
            }
        }
    } else if (item.category === 'trinkets') {
        for (let i = 0; i < currentBuild.trinkets.length; i++) {
            if (currentBuild.trinkets[i] === null) {
                currentBuild.trinkets[i] = item;
                added = true;
                break;
            }
        }
    } else if (item.category === 'magifishes') {
        for (let i = 0; i < currentBuild.magifishes.length; i++) {
            if (currentBuild.magifishes[i] === null) {
                currentBuild.magifishes[i] = item;
                added = true;
                break;
            }
        }
    } else if (item.category === 'gifts') {
        for (let i = 0; i < currentBuild.gifts.length; i++) {
            if (currentBuild.gifts[i] === null) {
                currentBuild.gifts[i] = item;
                added = true;
                break;
            }
        }
    } else if (item.category === 'hexes') {
        for (let i = 0; i < currentBuild.hexes.length; i++) {
            if (currentBuild.hexes[i] === null) {
                currentBuild.hexes[i] = item;
                added = true;
                break;
            }
        }
    } else if (!['weapons','trinkets','magifishes','gifts','hexes'].includes(item.category)) {
        if (currentBuild.backpack === null) {
            currentBuild.backpack = item;
            added = true;
        }
    }

    if (added) {
        renderBuildSlots();
        updateDeckSummary();

        if (item.name === CONFIG.CHRYSALIS_HEX_NAME) {
            rebuildBuildSection();
        }
    }
}

function removeFromBuildIfPresent(category, itemKey) {
    let removed = false;
    let wasChrysalis = false;

    if (category === 'weapons') {
        const idx = currentBuild.weapons.findIndex(w => w && w.key === itemKey);
        if (idx >= 0) { currentBuild.weapons[idx] = null; removed = true; }
    } else if (category === 'trinkets') {
        const idx = currentBuild.trinkets.findIndex(t => t && t.key === itemKey);
        if (idx >= 0) { currentBuild.trinkets[idx] = null; removed = true; }
    } else if (category === 'magifishes') {
        const idx = currentBuild.magifishes.findIndex(m => m && m.key === itemKey);
        if (idx >= 0) { currentBuild.magifishes[idx] = null; removed = true; }
    } else if (category === 'gifts') {
        const idx = currentBuild.gifts.findIndex(g => g && g.key === itemKey);
        if (idx >= 0) { currentBuild.gifts[idx] = null; removed = true; }
    } else if (category === 'hexes') {
        const idx = currentBuild.hexes.findIndex(h => h && h.key === itemKey);
        if (idx >= 0) {
            wasChrysalis = currentBuild.hexes[idx]?.name === CONFIG.CHRYSALIS_HEX_NAME;
            currentBuild.hexes[idx] = null;
            removed = true;
        }
    } else if (currentBuild.backpack && currentBuild.backpack.key === itemKey) {
        wasChrysalis = currentBuild.backpack.name === CONFIG.CHRYSALIS_HEX_NAME;
        currentBuild.backpack = null;
        removed = true;
    }

    if (removed) {
        renderBuildSlots();
        updateDeckSummary();

        if (wasChrysalis) {
            chrysalisBonusActive = false;
            rebuildBuildSection(true);
        }
    }
}

function removeFromBuildBySlot(type, index) {
    if (type === 'weapon') {
        if (index >= 0 && index < currentBuild.weapons.length) {
            const item = currentBuild.weapons[index];
            if (item) {
                appState.selected[item.category].add(item.key);
                const card = document.querySelector(`#grid-${item.category} [data-key="${item.key}"]`);
                if (card) card.classList.add('selected');
                currentBuild.weapons[index] = null;
            }
        }
    } else if (type === 'trinket') {
        if (index >= 0 && index < currentBuild.trinkets.length) {
            const item = currentBuild.trinkets[index];
            if (item) {
                appState.selected[item.category].add(item.key);
                const card = document.querySelector(`#grid-${item.category} [data-key="${item.key}"]`);
                if (card) card.classList.add('selected');
                currentBuild.trinkets[index] = null;
            }
        }
    } else if (type === 'magifish') {
        if (index >= 0 && index < currentBuild.magifishes.length) {
            const item = currentBuild.magifishes[index];
            if (item) {
                appState.selected[item.category].add(item.key);
                const card = document.querySelector(`#grid-${item.category} [data-key="${item.key}"]`);
                if (card) card.classList.add('selected');
                currentBuild.magifishes[index] = null;
            }
        }
    } else if (type === 'gift') {
        if (index >= 0 && index < currentBuild.gifts.length) {
            const item = currentBuild.gifts[index];
            if (item) {
                appState.selected[item.category].add(item.key);
                const card = document.querySelector(`#grid-${item.category} [data-key="${item.key}"]`);
                if (card) card.classList.add('selected');
                currentBuild.gifts[index] = null;
            }
        }
    } else if (type === 'hex') {
        if (index >= 0 && index < currentBuild.hexes.length) {
            const item = currentBuild.hexes[index];
            if (item) {
                appState.selected[item.category].add(item.key);
                const card = document.querySelector(`#grid-${item.category} [data-key="${item.key}"]`);
                if (card) card.classList.add('selected');

                const wasChrysalis = item.name === CONFIG.CHRYSALIS_HEX_NAME;
                currentBuild.hexes[index] = null;

                if (wasChrysalis) {
                    chrysalisBonusActive = false;
                    rebuildBuildSection(true);
                }
            }
        }
    } else if (type === 'backpack') {
        if (currentBuild.backpack) {
            appState.selected[currentBuild.backpack.category].add(currentBuild.backpack.key);
            const card = document.querySelector(`#grid-${currentBuild.backpack.category} [data-key="${currentBuild.backpack.key}"]`);
            if (card) card.classList.add('selected');

            const wasChrysalis = currentBuild.backpack.name === CONFIG.CHRYSALIS_HEX_NAME;
            currentBuild.backpack = null;

            if (wasChrysalis) {
                chrysalisBonusActive = false;
                rebuildBuildSection(true);
            }
        }
    }

    renderBuildSlots();
    updateDeckSummary();
}

function removeFromDeck(category, itemKey) {
    const selection = appState.selected[category];
    if (selection.has(itemKey)) {
        selection.delete(itemKey);
        
        const card = document.querySelector(`#grid-${category} [data-key="${itemKey}"]`);
        if (card) {
            card.classList.remove('selected');
        }
        
        removeFromBuildIfPresent(category, itemKey);
        updateDeckSummary();
    }
}

function getTotalBuilt() {
    return (
        (currentBuild.weapons.filter(x => x).length) +
        (currentBuild.trinkets.filter(x => x).length) +
        (currentBuild.magifishes.filter(x => x).length) +
        (currentBuild.backpack ? 1 : 0) +
        (currentBuild.hexes.filter(x => x).length) +
        (currentBuild.gifts.filter(x => x).length)
    );
}

function getTotalSlots() {
    return 2 + 2 + 1 + 1 + getHexSlotCount() + getGiftSlotCount();
}

// === SPAWN ELIGIBILITY LOGIC ===

function getProvidedEffects() {
    const effects = new Set();

    const categoriesToScan = ['weapons', 'trinkets', 'magifishes', 'gifts', 'hexes'];

    categoriesToScan.forEach(cat => {
        const items = currentBuild[cat];
        if (!items) return;

        items.forEach(item => {
            if (!item) return;

            if (item.deckOut) {
                item.deckOut.forEach(effect => effects.add(effect));
            }
        });
    });

    return effects;
}

function isItemEligible(item) {
    // no DeckIn
    if (!item.deckIn || item.deckIn.length === 0) {
        return { eligible: true, requiredEffects: [] };
    }

    const providedEffects = getProvidedEffects();

    // required effect is provided (any?)
    const satisfiedEffect = item.deckIn.find(effect => providedEffects.has(effect));

    if (satisfiedEffect) {
        return { eligible: true, requiredEffects: item.deckIn };
    }

    // what would be required?
    const unsatisfied = item.deckIn.filter(effect => !providedEffects.has(effect));

    return { eligible: false, requiredEffects: unsatisfied };
}
