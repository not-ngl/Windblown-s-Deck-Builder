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
    storageKey: 'deck_builder_state'
};

let appState = {
    selected: {},
    currentTab: null
};

let currentBuild = {
    weapons: [null, null],
    trinkets: [null, null],
    magifishes: [null],
    backpack: null,
    gifts: [null, null, null, null, null, null],
    hexes: [null]
};

let buildMode = false;
let endlessMode = false;

const elements = {};
let categoryData = {};

function getGiftSlotCount() {
    return endlessMode ? 18 : 6;
}

function getHexSlotCount() {
    return endlessMode ? 5 : 1;
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
    }
}

function removeFromBuildIfPresent(category, itemKey) {
    let removed = false;
    
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
        if (idx >= 0) { currentBuild.hexes[idx] = null; removed = true; }
    } else if (currentBuild.backpack && currentBuild.backpack.key === itemKey) {
        currentBuild.backpack = null;
        removed = true;
    }
    
    if (removed) {
        renderBuildSlots();
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
                currentBuild.hexes[index] = null;
            }
        }
    } else if (type === 'backpack') {
        if (currentBuild.backpack) {
            appState.selected[currentBuild.backpack.category].add(currentBuild.backpack.key);
            const card = document.querySelector(`#grid-${currentBuild.backpack.category} [data-key="${currentBuild.backpack.key}"]`);
            if (card) card.classList.add('selected');
            currentBuild.backpack = null;
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

async function init() {
    Object.keys(CONFIG.categories).forEach(cat => {
        appState.selected[cat] = new Set();
    });
    appState.currentTab = Object.keys(CONFIG.categories)[0];
    
    setupElements();
    await loadData();
    setupEventListeners();
    renderAllTabs();
    updateDeckSummary();
    loadFromStorage();
    initBuildSection();
    switchTab(appState.currentTab);
    renderBuildSlots();
}

function setupElements() {
    elements.tabs = document.querySelectorAll('.tab-btn');
    elements.panels = document.querySelectorAll('.category-panel');
    elements.btnReset = document.getElementById('btn-reset');
    elements.btnExport = document.getElementById('btn-export');
    elements.btnImport = document.getElementById('btn-import');
    elements.importFile = document.getElementById('import-file');
    elements.deckGrid = document.getElementById('deck-grid');
    elements.globalTotal = document.getElementById('global-total');
    
    ['weapons', 'trinkets', 'magifishes', 'gifts', 'hexes'].forEach(cat => {
        const el = document.getElementById(`tab-info-${cat}`);
        if (el) {
            elements.tabInfos = elements.tabInfos || {};
            elements.tabInfos[cat] = el;
        }
    });
}

async function loadData() {
    try {
        const promises = Object.keys(CONFIG.categories).map(async (cat) => {
            const res = await fetch(`../data/${cat}.json`);
            const json = await res.json();
            const name = cat.charAt(0).toUpperCase() + cat.slice(1);
            const data = json[name];
            
            categoryData[cat] = Object.entries(data || {}).map(([key, item]) => ({
                key,
                name: item.Name || key,
                description: item.Description ? cleanWikiText(item.Description) : '',
                imageUrl: item.Image 
                    ? `${CONFIG.gameWikiBase}/images/${item.Image.replace(/ /g, '_')}?format=original` 
                    : null,
                raw: item
            })).filter(item => !(item.raw.RemovedIn && item.raw.RemovedIn !== null));
        });
        await Promise.all(promises);
    } catch (err) {
        console.error('Load failed:', err);
    }
}

function cleanWikiText(text) {
  let result = text;
  result = result.replace(/<(?!br\/?>)[^>]*>/gi, '');
  result = result.replace(/<br\s*\/?>/gi, '<br>');
  result = result.replace(/\[\[File:[^\]]+\]\]/gi, '');

  let prevLength = -1;
  let iterations = 0;
  const maxIterations = 20;

  while (prevLength !== result.length && iterations < maxIterations) {
    prevLength = result.length;
    iterations++;
    result = result.replace(/\{\{CustomTooltip\|([^|{}]+?)(?:\|[^}]*)?\}\}/g, '$1');
    result = result.replace(/\{\{color\|[^|{}]+?\|([^}]*)\}\}/g, '$1');
    result = result.replace(/\{\{(\w*Link)\|([^|{}]*)\|([^}{}]*)\}\}/g, (m, name, arg1, arg2) => arg2.trim());
    result = result.replace(/\{\{(\w*Link)\|([^}{}]*)\}\}/g, '$2');
    result = result.replace(/\(\s*capped[^)]*\)/gi, '');
    result = result.replace(/\bper level\b/gi, '');
  }

  result = result.replace(/\{[^}]*$/g, '').replace(/^\{[^}]*\}/g, '').replace(/\}/g, '');
  return result.trim();
}

function toggleItem(category, itemKey) {
    const selection = appState.selected[category];
    
    if (selection.has(itemKey)) {
        selection.delete(itemKey);
        removeFromBuildIfPresent(category, itemKey);
    } else {
        selection.add(itemKey);
    }
    
    saveToStorage();
    
    const card = document.querySelector(`#grid-${category} [data-key="${itemKey}"]`);
    if (card) {
        card.classList.toggle('selected');
    }
    
    updateDeckSummary();
}

function filterItems(category, searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const grid = document.getElementById(`grid-${category}`);
    if (!grid) return;

    const cards = grid.querySelectorAll('.item-card');

    cards.forEach(card => {
        const name = card.dataset.name || '';

        if (term === '' || name.includes(term)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

function isSelected(category, itemKey) {
    return appState.selected[category]?.has(itemKey) || false;
}

function renderAllTabs() {
    Object.keys(CONFIG.categories).forEach(renderTab);
}

function renderTab(category) {
    const panel = document.getElementById(category);
    if (!panel) return;

    panel.innerHTML = '';

    const config = CONFIG.categories[category];
    const items = categoryData[category] || [];

    const searchBox = document.createElement('div');
    searchBox.className = 'search-box';
    searchBox.innerHTML = `<input type="text" placeholder="Search..." id="search-${category}">`;
    panel.appendChild(searchBox);

    setTimeout(() => {
        document.getElementById(`search-${category}`)?.addEventListener('input', (e) => filterItems(category, e.target.value));
    }, 0);

    const grid = document.createElement('div');
    grid.className = 'item-grid';
    grid.id = `grid-${category}`;

    if (category === 'gifts') {
        const types = [...new Set(items.map(item => item.raw?.Type || 'Uncategorized'))];
        types.sort((a, b) => {
            if (a === 'General') return -1;
            if (b === 'General') return 1;
            return a.localeCompare(b);
        });

        types.forEach(type => {
            const header = document.createElement('div');
            header.className = 'section-header';
            header.textContent = type;
            grid.appendChild(header);

            const typeItems = items
                .filter(item => (item.raw?.Type || 'Uncategorized') === type)
                .sort((a, b) => a.name.localeCompare(b.name));

            typeItems.forEach(item => {
                grid.appendChild(createCard(category, item));
            });
        });
    } else {
        items.sort((a, b) => a.name.localeCompare(b.name));
        items.forEach(item => {
            grid.appendChild(createCard(category, item));
        });
    }

    panel.appendChild(grid);
}

function createCard(category, item) {
    const card = document.createElement('div');
    card.className = 'item-card' + (isSelected(category, item.key) ? ' selected' : '');
    card.dataset.key = item.key;
    card.dataset.name = item.name.toLowerCase();
    card.dataset.desc = item.description.toLowerCase();
    card.dataset.category = category;

    const iconWrap = document.createElement('div');
    iconWrap.className = 'item-icon-wrapper';

    if (item.imageUrl) {
        const img = document.createElement('img');
        img.src = item.imageUrl;
        img.alt = item.name;
        img.width = 64;
        img.height = 64;
        img.loading = 'lazy';

        const tooltip = document.createElement('div');
        tooltip.className = 'item-tooltip';

        const tooltipName = document.createElement('div');
        tooltipName.className = 'tooltip-name';
        tooltipName.textContent = item.name;

        const tooltipDesc = document.createElement('div');
        tooltipDesc.className = 'tooltip-desc';
        tooltipDesc.innerHTML = item.description;

        tooltip.appendChild(tooltipName);
        tooltip.appendChild(tooltipDesc);
        iconWrap.appendChild(tooltip);

        iconWrap.appendChild(img);
    }

    card.appendChild(iconWrap);

    const info = document.createElement('div');
    info.className = 'item-info';
    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = item.name;
    info.appendChild(name);
    card.appendChild(info);

    card.onclick = (e) => {
        if (!e.target.closest('.item-tooltip')) {
            toggleItem(category, item.key);
        }
    };

    return card;
}

function updateDeckSummary() {
    let total = 0;
    let valid = true;
    const selectedItemList = [];

    Object.keys(CONFIG.categories).forEach(cat => {
        const count = appState.selected[cat]?.size || 0;
        const config = CONFIG.categories[cat];
        total += count;

        const tabBtn = document.querySelector(`button[data-tab="${cat}"]`);
        if (tabBtn) {
            tabBtn.classList.toggle('valid', count >= config.min);
            tabBtn.querySelector('.tab-info').textContent = `${count}/${config.min}`;
        }

        if (count < config.min) valid = false;

        const catItems = [];
        appState.selected[cat]?.forEach(key => {
            const item = categoryData[cat].find(i => i.key === key);
            if (item) {
                catItems.push({ ...item, category: cat });
            }
        });

        if (cat === 'gifts') {
            catItems.sort((a, b) => {
                const typeA = a.raw?.Type || 'Uncategorized';
                const typeB = b.raw?.Type || 'Uncategorized';
                if (typeA === 'General' && typeB !== 'General') return -1;
                if (typeB === 'General' && typeA !== 'General') return 1;
                if (typeA !== typeB) return typeA.localeCompare(typeB);
                return a.name.localeCompare(b.name);
            });
        } else {
            catItems.sort((a, b) => a.name.localeCompare(b.name));
        }

        selectedItemList.push(...catItems);
    });

    elements.globalTotal.textContent = `${total}/${CONFIG.globalMinTotal} minimum`;
    elements.globalTotal.className = total >= CONFIG.globalMinTotal ? 'global-total valid' : 'global-total error';

    renderDeckGrid(selectedItemList);
}

function renderDeckGrid(items) {
    elements.deckGrid.innerHTML = '';
    
    if (items.length === 0) {
        elements.deckGrid.innerHTML = '<div style="grid-column:1/-1;padding:1rem;color:#999;text-align:center;font-size:0.75rem;">No items selected</div>';
        return;
    }
    
    const LONG_PRESS_DELAY = 500;
    
    items.forEach(item => {
        const deckItem = document.createElement('div');
        deckItem.className = 'deck-item';
        deckItem.dataset.key = item.key;
        deckItem.dataset.category = item.category;
        
        if (item.imageUrl) {
            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.alt = item.name;
            img.title = item.name;
            deckItem.appendChild(img);
        }
        
        deckItem.title = item.name;
        
        let longPressTimer = null;
        let isLongPress = false;
        
        const handleStart = (e) => {
            if (!buildMode) return;
            isLongPress = false;
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                if (getUsedItemKeys().has(item.key)) return;
                
                if (currentBuild.backpack === null) {
                    currentBuild.backpack = item;
                    renderBuildSlots();
                    updateDeckSummary();
                    deckItem.style.transform = 'scale(1.15)';
                    setTimeout(() => deckItem.style.transform = '', 150);
                }
            }, LONG_PRESS_DELAY);
        };
        
        const handleEnd = (e) => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            
            if (!isLongPress && buildMode) {
                addItemToBuild(item);
            } else if (!isLongPress && !buildMode) {
                removeFromDeck(item.category, item.key);
            }
        };
        
        deckItem.addEventListener('mousedown', handleStart);
        deckItem.addEventListener('mouseup', handleEnd);
        deckItem.addEventListener('mouseleave', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });
        
        deckItem.addEventListener('touchstart', (e) => {
            handleStart(e);
        }, { passive: true });
        
        deckItem.addEventListener('touchend', (e) => {
            handleEnd(e);
        }, { passive: true });
        
        deckItem.addEventListener('touchmove', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }, { passive: true });
        
        elements.deckGrid.appendChild(deckItem);
    });
}

// Helper to generate HTML for build section
function buildBuildSectionHTML() {
    const hexCount = getHexSlotCount();
    const giftCount = getGiftSlotCount();
    
    let hexSlotsHTML = '';
    for (let i = 0; i < hexCount; i++) {
        hexSlotsHTML += `<div class="build-slot" data-slot-type="hex" data-index="${i}"><span class="slot-num">${i + 1}</span></div>`;
    }
    
    let giftSlotsHTML = '';
    for (let i = 0; i < giftCount; i++) {
        giftSlotsHTML += `<div class="build-slot" data-slot-type="gift" data-index="${i}"><span class="slot-num">${i + 1}</span></div>`;
    }
    
    return `
        <div class="build-header">
            <button id="build-toggle-btn" class="build-toggle-btn" aria-label="Toggle build section">
                <span class="build-arrow">▼</span> Current Build
            </button>
            <span class="build-count" id="build-count">0/${getTotalSlots()}</span>
            <label class="endless-toggle">
                <input type="checkbox" id="endless-checkbox" ${endlessMode ? 'checked' : ''}>
                <span class="endless-label">Endless</span>
            </label>
        </div>
        <div class="build-slots-wrapper">
            <div class="build-slots-container">
                <div class="build-box-left">
                    <div class="build-category-group" id="group-weapons">
                        <div class="build-category-title">Weapons</div>
                        <div class="build-category" id="build-weapons">
                            <div class="build-slot" data-slot-type="weapon" data-index="0"><span class="slot-num">1</span></div>
                            <div class="build-slot" data-slot-type="weapon" data-index="1"><span class="slot-num">2</span></div>
                        </div>
                    </div>
                    <div class="build-category-group" id="group-trinkets">
                        <div class="build-category-title">Trinkets</div>
                        <div class="build-category" id="build-trinkets">
                            <div class="build-slot" data-slot-type="trinket" data-index="0"><span class="slot-num">1</span></div>
                            <div class="build-slot" data-slot-type="trinket" data-index="1"><span class="slot-num">2</span></div>
                        </div>
                    </div>
                    <div class="build-category-group" id="group-magifishes">
                        <div class="build-category-title">Magifish</div>
                        <div class="build-category" id="build-magifishes">
                            <div class="build-slot" data-slot-type="magifish" data-index="0"><span class="slot-num">1</span></div>
                        </div>
                    </div>
                    <div class="build-category-group" id="group-backpack">
                        <div class="build-category-title">Backpack</div>
                        <div class="build-category" id="build-backpack">
                            <div class="build-slot" data-slot-type="backpack" data-index="0"><span class="slot-num">Any</span></div>
                        </div>
                    </div>
                    <div class="build-category-group" id="group-hexes">
                        <div class="build-category-title">Hexes</div>
                        <div class="build-category" id="build-hexes">
                            ${hexSlotsHTML}
                        </div>
                    </div>
                </div>
                <div class="build-box-right">
                    <div class="build-category-group" id="group-gifts">
                        <div class="build-category-title">Gifts</div>
                        <div class="build-category" id="build-gifts">
                            ${giftSlotsHTML}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initBuildSection() {
    const buildSection = document.createElement('div');
    buildSection.id = 'current-build-section';
    buildSection.className = 'build-collapsed' + (endlessMode ? ' build-endless' : '');
    
    buildSection.innerHTML = buildBuildSectionHTML();
    
    document.body.appendChild(buildSection);
    
    document.getElementById('build-toggle-btn').addEventListener('click', toggleBuildSection);
    document.getElementById('endless-checkbox').addEventListener('change', toggleEndlessMode);
}

function getTotalSlots() {
    return 2 + 2 + 1 + 1 + getHexSlotCount() + getGiftSlotCount();
}

function toggleEndlessMode(e) {
    endlessMode = e.target.checked;

    const oldSection = document.getElementById('current-build-section');
    const wasExpanded = oldSection && oldSection.classList.contains('build-expanded');

    saveToStorage();

    if (oldSection) {
        oldSection.remove();
    }

    initBuildSection();
    renderBuildSlots();

    const newSection = document.getElementById('current-build-section');
    if (wasExpanded && newSection) {
        newSection.classList.remove('build-collapsed');
        newSection.classList.add('build-expanded');
        const arrow = newSection.querySelector('.build-arrow');
        if (arrow) arrow.textContent = '▲';
    }

    document.getElementById('build-count').textContent = `${getTotalBuilt()}/${getTotalSlots()}`;

    if (newSection && newSection.classList.contains('build-expanded')) {
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

function toggleBuildSection() {
    const section = document.getElementById('current-build-section');
    const arrow = document.querySelector('.build-arrow');
    const isCollapsed = section.classList.contains('build-collapsed');
    
    buildMode = isCollapsed;
    
    if (isCollapsed) {
        section.classList.remove('build-collapsed');
        section.classList.add('build-expanded');
        arrow.textContent = '▲';
    } else {
        section.classList.add('build-collapsed');
        section.classList.remove('build-expanded');
        arrow.textContent = '▼';
    }
}

function renderBuildSlots() {
    const hexCount = getHexSlotCount();
    const giftCount = getGiftSlotCount();
    
    if (currentBuild.hexes.length !== hexCount) {
        const preservedHexes = currentBuild.hexes.filter(h => h !== null).slice(0, hexCount);
        currentBuild.hexes = Array(hexCount).fill(null);
        preservedHexes.forEach((h, i) => currentBuild.hexes[i] = h);
    }
    if (currentBuild.gifts.length !== giftCount) {
        const preservedGifts = currentBuild.gifts.filter(g => g !== null).slice(0, giftCount);
        currentBuild.gifts = Array(giftCount).fill(null);
        preservedGifts.forEach((g, i) => currentBuild.gifts[i] = g);
    }
    
    renderSlotGroup('build-weapons', currentBuild.weapons, 'weapon');
    renderSlotGroup('build-trinkets', currentBuild.trinkets, 'trinket');
    renderSlotGroup('build-magifishes', currentBuild.magifishes, 'magifish');
    renderSingleSlot('build-backpack', currentBuild.backpack, 'backpack');
    renderSlotGroup('build-hexes', currentBuild.hexes, 'hex');
    renderSlotGroup('build-gifts', currentBuild.gifts, 'gift');
    
    document.getElementById('build-count').textContent = `${getTotalBuilt()}/${getTotalSlots()}`;
}

function renderSlotGroup(containerId, items, slotType) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const slots = container.querySelectorAll('.build-slot');
    
    slots.forEach((slot) => {
        const index = parseInt(slot.dataset.index);
        
        const hasImage = slot.querySelector('img');
        if (hasImage) hasImage.remove();
        const numSpan = slot.querySelector('.slot-num');
        if (numSpan) numSpan.style.display = 'block';
        const removeBtn = slot.querySelector('.remove-slot-btn');
        if (removeBtn) removeBtn.remove();
        slot.classList.remove('filled');
        
        const item = items[index];
        if (item && item.imageUrl) {
            slot.classList.add('filled');
            if (numSpan) numSpan.style.display = 'none';
            
            slot.onclick = (e) => {
                e.stopPropagation();
                removeFromBuildBySlot(slotType, index);
            };
            
            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.alt = item.name;
            img.title = item.name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-slot-btn';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromBuildBySlot(slotType, index);
            });
            
            slot.appendChild(img);
            slot.appendChild(removeBtn);
        } else {
            slot.onclick = null;
        }
    });
}

function renderSingleSlot(containerId, item, slotType) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const slot = container.querySelector('.build-slot');
    const index = parseInt(slot.dataset.index);
    
    const hasImage = slot.querySelector('img');
    if (hasImage) hasImage.remove();
    const numSpan = slot.querySelector('.slot-num');
    if (numSpan) numSpan.style.display = 'block';
    const removeBtn = slot.querySelector('.remove-slot-btn');
    if (removeBtn) removeBtn.remove();
    slot.classList.remove('filled');
    
    if (item && item.imageUrl) {
        slot.classList.add('filled');
        if (numSpan) numSpan.style.display = 'none';
        
        slot.onclick = (e) => {
            e.stopPropagation();
            removeFromBuildBySlot(slotType, index);
        };
        
        const img = document.createElement('img');
        img.src = item.imageUrl;
        img.alt = item.name;
        img.title = item.name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-slot-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromBuildBySlot(slotType, index);
        });
        
        slot.appendChild(img);
        slot.appendChild(removeBtn);
    } else {
        slot.onclick = null;
    }
}

function switchTab(tab) {
    appState.currentTab = tab;
    elements.tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    elements.panels.forEach(p => p.classList.toggle('active', p.id === tab));
    saveToStorage();
}

function setupEventListeners() {
    elements.tabs.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    elements.btnReset?.addEventListener('click', resetAll);
    elements.btnExport?.addEventListener('click', exportDeck);
    elements.btnImport?.addEventListener('click', () => elements.importFile.click());
    elements.importFile?.addEventListener('change', importDeck);
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

document.addEventListener('DOMContentLoaded', init);
