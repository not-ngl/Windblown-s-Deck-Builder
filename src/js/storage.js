function saveToStorage() {
    const state = {
        selected: {},
        currentTab: appState.currentTab,
        endless: endlessMode
    };
    Object.keys(appState.selected).forEach(c => {
        state.selected[c] = Array.from(appState.selected[c]);
    });
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(state));
}

function loadFromStorage() {
    const stored = localStorage.getItem(CONFIG.storageKey);
    if (!stored) return;
    try {
        const state = JSON.parse(stored);
        Object.keys(state.selected || {}).forEach(c => {
            if (Array.isArray(state.selected[c])) {
                appState.selected[c] = new Set(state.selected[c]);
            }
        });
        if (state.currentTab) appState.currentTab = state.currentTab;
        if (typeof state.endless === 'boolean') {
            endlessMode = state.endless;
        }
        renderAllTabs();
        updateDeckSummary();
        if (elements.tabs) switchTab(appState.currentTab);
    } catch (err) {}
}

function exportDeck() {
    let allValid = true;
    const missing = [];
    
    Object.keys(CONFIG.categories).forEach(cat => {
        const count = appState.selected[cat]?.size || 0;
        const config = CONFIG.categories[cat];
        if (count < config.min) {
            allValid = false;
            missing.push(`${config.label}: ${count}/${config.min}`);
        }
    });
    
    if (!allValid) {
        alert(`Cannot export invalid deck.\n\nMissing requirements:\n${missing.join('\n')}\n\nAdd more items to meet all minimums.`);
        return;
    }
    
    const total = Object.values(appState.selected).reduce((sum, set) => sum + set.size, 0);
    if (total < CONFIG.globalMinTotal) {
        alert(`Cannot export. Total ${total}/${CONFIG.globalMinTotal} required.`);
        return;
    }
    
    const data = {
        version: 2,
        timestamp: new Date().toISOString(),
        endless: endlessMode,
        deck: {},
        build: {}
    };
    Object.keys(CONFIG.categories).forEach(c => {
        data.deck[c] = Array.from(appState.selected[c] || []);
    });
    
    data.build.weapons = currentBuild.weapons.map(i => i ? i.key : null);
    data.build.trinkets = currentBuild.trinkets.map(i => i ? i.key : null);
    data.build.magifishes = currentBuild.magifishes.map(i => i ? i.key : null);
    data.build.backpack = currentBuild.backpack ? currentBuild.backpack.key : null;
    data.build.hexes = currentBuild.hexes.map(i => i ? i.key : null);
    data.build.gifts = currentBuild.gifts.map(i => i ? i.key : null);
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deck.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importDeck(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            Object.keys(appState.selected).forEach(c => appState.selected[c] = new Set());
            Object.keys(data.deck || {}).forEach(c => {
                if (Array.isArray(data.deck[c])) {
                    data.deck[c].forEach(k => appState.selected[c].add(k));
                }
            });
            
            if (typeof data.endless === 'boolean') {
                endlessMode = data.endless;
            }
            
            if (data.build) {
                currentBuild.weapons = (data.build.weapons || []).map(key => 
                    categoryData.weapons.find(i => i.key === key) || null
                );
                currentBuild.trinkets = (data.build.trinkets || []).map(key => 
                    categoryData.trinkets.find(i => i.key === key) || null
                );
                currentBuild.magifishes = (data.build.magifishes || []).map(key => 
                    categoryData.magifishes.find(i => i.key === key) || null
                );
                currentBuild.backpack = categoryData.weapons.find(i => i.key === data.build.backpack) ||
                                       categoryData.trinkets.find(i => i.key === data.build.backpack) ||
                                       categoryData.magifishes.find(i => i.key === data.build.backpack) ||
                                       categoryData.gifts.find(i => i.key === data.build.backpack) ||
                                       categoryData.hexes.find(i => i.key === data.build.backpack) ||
                                       null;
                currentBuild.hexes = (data.build.hexes || []).map(key => key ? categoryData.hexes.find(i => i.key === key) || null : null);
                currentBuild.gifts = (data.build.gifts || []).map(key => key ? categoryData.gifts.find(i => i.key === key) || null : null);
                
                renderBuildSlots();
            }
            
            saveToStorage();
            renderAllTabs();
            updateDeckSummary();
        } catch (err) {
            alert('Invalid file');
        }
        e.target.value = '';
    };
    reader.readAsText(file);
}

function resetAll() {
    if (!confirm('Reset deck?')) return;
    
    Object.keys(appState.selected).forEach(c => appState.selected[c] = new Set());
    
    currentBuild = {
        weapons: [null, null],
        trinkets: [null, null],
        magifishes: [null],
        backpack: null,
        gifts: Array(getGiftSlotCount()).fill(null),
        hexes: Array(getHexSlotCount()).fill(null)
    };
    
    endlessMode = false;
    const endlessCheckbox = document.getElementById('endless-checkbox');
    if (endlessCheckbox) endlessCheckbox.checked = false;
    
    const buildSection = document.getElementById('current-build-section');
    if (buildSection) {
        buildSection.classList.remove('build-endless');
    }
    
    saveToStorage();
    renderAllTabs();
    updateDeckSummary();
    renderBuildSlots();
}
