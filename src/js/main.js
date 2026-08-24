function setupElements() {
    elements.tabs = document.querySelectorAll('.tab-btn');
    elements.panels = document.querySelectorAll('.category-panel');
    elements.btnReset = document.getElementById('btn-reset');
    elements.btnExport = document.getElementById('btn-export');
    elements.btnImport = document.getElementById('btn-import');
    elements.btnFreshFile = document.getElementById('btn-fresh-file')
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

function initBuildSection() {
    const buildSection = document.createElement('div');
    buildSection.id = 'current-build-section';
    buildSection.className = 'build-collapsed' + (endlessMode ? ' build-endless' : '');

    buildSection.innerHTML = buildBuildSectionHTML();

    document.body.appendChild(buildSection);

    document.getElementById('build-toggle-btn').addEventListener('click', toggleBuildSection);
    document.getElementById('endless-checkbox').addEventListener('change', toggleEndlessMode);

    document.getElementById('chrysalis-bonus-checkbox')?.addEventListener('change', (e) => {
        chrysalisBonusActive = e.target.checked;
        
        saveToStorage();
        rebuildBuildSection(true);
        
        const newSection = document.getElementById('current-build-section');
        if (newSection && newSection.classList.contains('build-expanded')) {
            updateDeckSummary();
        }
    });
}

function buildBuildSectionNormalHTML() {
    const hexCount = getHexSlotCount();
    const giftCount = getGiftSlotCount();

    let hexSlotsHTML = '';
    for (let i = 0; i < hexCount; i++) {
        hexSlotsHTML += `<div class="build-slot" data-slot-type="hex" data-index="${i}"></div>`;
    }

    let giftSlotsHTML = '';
    for (let i = 0; i < giftCount; i++) {
        giftSlotsHTML += `<div class="build-slot gift-slot" data-slot-type="gift" data-index="${i}"></div>`;
    }

    return `
        <div class="build-slots-wrapper">
            <div class="build-slots-container">
                <div class="build-category-group" id="group-weapons">
                    <div class="build-category" id="build-weapons">
                        <div class="build-slot" data-slot-type="weapon" data-index="0"></div>
                        <div class="build-slot" data-slot-type="weapon" data-index="1"></div>
                    </div>
                </div>

                <div class="build-category-group" id="group-trinkets">
                    <div class="build-category" id="build-trinkets">
                        <div class="build-slot" data-slot-type="trinket" data-index="0"></div>
                        <div class="build-slot" data-slot-type="trinket" data-index="1"></div>
                    </div>
                </div>

                <div class="build-category-group" id="group-magifishes">
                    <div class="build-category" id="build-magifishes">
                        <div class="build-slot" data-slot-type="magifish" data-index="0"></div>
                    </div>
                </div>

                <div class="build-category-group" id="group-backpack">
                    <div class="build-category" id="build-backpack">
                        <div class="build-slot" data-slot-type="backpack" data-index="0"></div>
                    </div>
                </div>

                <div class="build-category-group" id="group-hexes">
                    <div class="build-category" id="build-hexes">
                        ${hexSlotsHTML}
                    </div>
                </div>

                <div class="build-category-group" id="group-gifts">
                    <div class="build-category" id="build-gifts">
                        ${giftSlotsHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildBuildSectionEndlessHTML() {
    const hexCount = getHexSlotCount();
    const giftCount = getGiftSlotCount();
    const giftRows = Math.ceil(giftCount / 6);

    let hexSlotsHTML = '';
    for (let i = 0; i < hexCount; i++) {
        hexSlotsHTML += `<div class="build-slot" data-slot-type="hex" data-index="${i}"></div>`;
    }

    let giftSlotsHTML = '';
    for (let i = 0; i < giftCount; i++) {
        giftSlotsHTML += `<div class="build-slot gift-slot" data-slot-type="gift" data-index="${i}"></div>`;
    }

    return `
        <div class="build-slots-wrapper">
            <div class="build-slots-container">
                <!-- LEFT COLUMN: 3 rows -->
                <div class="build-box-left">

                    <!-- Row 1: Weapons + Trinkets -->
                    <div class="build-row">
                        <div class="build-category-group" id="group-weapons">
                            <div class="build-category" id="build-weapons">
                                <div class="build-slot" data-slot-type="weapon" data-index="0"></div>
                                <div class="build-slot" data-slot-type="weapon" data-index="1"></div>
                            </div>
                        </div>

                        <div class="build-category-group" id="group-trinkets">
                            <div class="build-category" id="build-trinkets">
                                <div class="build-slot" data-slot-type="trinket" data-index="0"></div>
                                <div class="build-slot" data-slot-type="trinket" data-index="1"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Row 2: Magifish + Backpack -->
                    <div class="build-row">
                        <div class="build-category-group" id="group-magifishes">
                            <div class="build-category" id="build-magifishes">
                                <div class="build-slot" data-slot-type="magifish" data-index="0"></div>
                            </div>
                        </div>

                        <div class="build-category-group" id="group-backpack">
                            <div class="build-category" id="build-backpack">
                                <div class="build-slot" data-slot-type="backpack" data-index="0"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Row 3: Hexes -->
                    <div class="build-row">
                        <div class="build-category-group" id="group-hexes">
                            <div class="build-category" id="build-hexes">
                                ${hexSlotsHTML}
                            </div>
                        </div>
                    </div>

                </div>

                <!-- RIGHT COLUMN: Gifts -->
                <div class="build-box-right">
                    <div class="build-category-group" id="group-gifts">
                        <div class="build-category" id="build-gifts" data-rows="${giftRows}">
                            ${giftSlotsHTML}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildBuildSectionHTML() {
    const hexCount = getHexSlotCount();
    const giftCount = getGiftSlotCount();
    const giftRows = Math.ceil(giftCount / 6);
    const bonusAvailable = getChrysalisBonusAvailable();
    const bonusChecked = chrysalisBonusActive && bonusAvailable;
    const bonusDisabled = !bonusAvailable;

    return `
        <div class="build-header">
            <button id="build-toggle-btn" class="build-toggle-btn" aria-label="Toggle build section">
                <span class="build-arrow">▲</span>Build Mode
            </button>
            <label class="endless-toggle">
                <input type="checkbox" id="endless-checkbox" ${endlessMode ? 'checked' : ''}>
                <span class="endless-label">Endless</span>
            </label>
            <label class="chrysalis-bonus" title="${bonusAvailable ? 'Enable +6 gift slots from Random Chrysalis Hex' : 'Add Random Chrysalis Hex to enable'}">
                <input type="checkbox" id="chrysalis-bonus-checkbox" ${bonusChecked ? 'checked' : ''} ${bonusDisabled ? 'disabled' : ''}>
                <span class="bonus-label">Gain 6 Gifts?</span>
            </label>
        </div>
        ${endlessMode ? buildBuildSectionEndlessHTML() : buildBuildSectionNormalHTML()}
    `;
}

function rebuildBuildSection(preserveExpansion = true) {
    const oldSection = document.getElementById('current-build-section');
    const wasExpanded = preserveExpansion && oldSection && oldSection.classList.contains('build-expanded');

    if (oldSection) {
        oldSection.remove();
    }

    initBuildSection();
    renderBuildSlots();

    if (wasExpanded) {
        const newSection = document.getElementById('current-build-section');
        if (newSection) {
            newSection.classList.remove('build-collapsed');
            newSection.classList.add('build-expanded');
            const arrow = newSection.querySelector('.build-arrow');
            if (arrow) arrow.textContent = '▼';
        }
    }
}

function toggleEndlessMode(e) {
    endlessMode = e.target.checked;

    document.body.classList.toggle('endless-mode-active', endlessMode);
    
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
        if (arrow) arrow.textContent = '▼';
    }
    
    if (newSection && newSection.classList.contains('build-expanded')) {
        updateDeckSummary();
    }
}

function toggleBuildSection() {
    const section = document.getElementById('current-build-section');
    const arrow = document.querySelector('.build-arrow');
    const isCollapsed = section.classList.contains('build-collapsed');
    
    buildMode = isCollapsed;
    
    if (isCollapsed) {
        section.classList.remove('build-collapsed');
        section.classList.add('build-expanded');
        arrow.textContent = '▼';
    } else {
        section.classList.add('build-collapsed');
        section.classList.remove('build-expanded');
        arrow.textContent = '▲';
    }
}

function setupEventListeners() {
    elements.tabs.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    elements.btnReset?.addEventListener('click', resetAll);
    elements.btnExport?.addEventListener('click', exportDeck);
    elements.btnImport?.addEventListener('click', () => elements.importFile.click());
    elements.btnFreshFile?.addEventListener('click', generateFreshFileDeck);
    elements.importFile?.addEventListener('change', importDeck); 
}

async function init() {
    Object.keys(CONFIG.categories).forEach(cat => {
        appState.selected[cat] = new Set();
    });
    appState.currentTab = Object.keys(CONFIG.categories)[0];
    
    setupElements();
    await loadData();
    setupVersionSelector();
    setupEventListeners();
    renderAllTabs();
    updateDeckSummary();
    loadFromStorage();
    initBuildSection();
    switchTab(appState.currentTab);
    renderBuildSlots();
}

document.addEventListener('DOMContentLoaded', init);
