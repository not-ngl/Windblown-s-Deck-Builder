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

const elements = {};
let categoryData = {};

function parseCustomTooltip(baseValue, tooltipText, currentLevel) {
  const levelMatch = tooltipText.match(/Past Level (\d+)/) || tooltipText.match(/Au-delà du niveau (\d+)/);
  if (!levelMatch) return baseValue;

  const thresholdLevel = parseInt(levelMatch[1], 10);
  const incrementMatch = tooltipText.match(/([\+\-]\d+(?:[,.]\d+)?)/);
  if (!incrementMatch) return baseValue;

  const perLevelIncrement = parseFloat(incrementMatch[1].replace(',', '.'));
  const baseNumMatch = baseValue.match(/([\+\-]?\d+(?:[,.]\d+)?)/);
  if (!baseNumMatch) return baseValue;

  const baseNum = parseFloat(baseNumMatch[1].replace(',', '.'));

  if (currentLevel > thresholdLevel) {
    const total = Math.round((baseNum + (currentLevel - thresholdLevel) * perLevelIncrement) * 100) / 100;
    const sign = total >= 0 ? '+' : '';
    const locale = Settings.getLang() === 'fr' ? 'fr-FR' : 'en-US';
    return sign + total.toLocaleString(locale) + baseValue.replace(baseNumMatch[0], '');
  }

  return baseValue;
}

function cleanWikiText(text) {
  let result = text;

  // Remove HTML formatting tags except <br> (preserve br as <br>)
  result = result.replace(/<(?!br\/?>)[^>]*>/gi, '');

  // Convert <br> variants to consistent format
  result = result.replace(/<br\s*\/?>/gi, '<br>');

  // Process file links [[File:...]] → remove completely
  result = result.replace(/\[\[File:[^\]]+\]\]/gi, '');

  // Iteratively process templates (handles nesting)
  let prevLength = -1;
  let iterations = 0;
  const maxIterations = 20; // Prevent infinite loops

  while (prevLength !== result.length && iterations < maxIterations) {
    prevLength = result.length;
    iterations++;

    // {{CustomTooltip|first_arg|rest}} → first_arg
    result = result.replace(/\{\{CustomTooltip\|([^|{}]+?)(?:\|[^}]*)?\}\}/g, '$1');

    // {{color|x|value}} → value (handles nested templates in value)
    result = result.replace(/\{\{color\|[^|{}]+?\|([^}]*)\}\}/g, '$1');

    // {{*Link|arg1|arg2}} → arg2 (multi-argument link)
    result = result.replace(/\{\{(\w*Link)\|([^|{}]*)\|([^}{}]*)\}\}/g, (m, name, arg1, arg2) => {
      return arg2.trim();
    });

    // {{*Link|arg1}} → arg1 (single argument case)
    result = result.replace(/\{\{(\w*Link)\|([^}{}]*)\}\}/g, '$2');

    result = result.replace(/\(\s*capped[^)]*\)/gi, '');

    // Remove standalone "per level" text that was inside templates (now orphaned)
    result = result.replace(/\bper level\b/gi, '');
  }

  // Final cleanup: remove any remaining unclosed template syntax
  result = result.replace(/\{[^}]*$/g, '').replace(/^\{[^}]*\}/g, '').replace(/\}/g, '');

  return result.trim();
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
    switchTab(appState.currentTab);
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
        if (el) elements.tabInfos = elements.tabInfos || {};
        if (el) elements.tabInfos[cat] = el;
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
                description: item.Description ? cleanWikiText((item.Description)) : '',
                imageUrl: item.Image 
                    ? `${CONFIG.gameWikiBase}/images/${item.Image.replace(/ /g, '_')}?format=original` 
                    : null,
                raw: item
            })).filter(item => {
                return !(item.raw.RemovedIn && item.raw.RemovedIn !== null);
            });
        });
        await Promise.all(promises);
    } catch (err) {
        console.error('Load failed:', err);
    }
}

function stripHtmlTags(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

function toggleItem(category, itemKey) {
    const selection = appState.selected[category];
    
    if (selection.has(itemKey)) {
        selection.delete(itemKey);
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
    
    items.forEach(item => {
        grid.appendChild(createCard(category, item));
    });
    
    panel.appendChild(grid);
}

function createCard(category, item) {
    const card = document.createElement('div');
    card.className = 'item-card' + (isSelected(category, item.key) ? ' selected' : '');
    card.dataset.key = item.key;
    card.dataset.name = item.name.toLowerCase();
    card.dataset.desc = item.description.toLowerCase();

    const iconWrap = document.createElement('div');
    iconWrap.className = 'item-icon-wrapper';

    if (item.imageUrl) {
        const img = document.createElement('img');
        img.src = item.imageUrl;
        img.alt = item.name;
        img.width = 64;
        img.height = 64;
        img.loading = 'lazy';

        // Create tooltip overlay
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

    const check = document.createElement('div');
    check.className = 'check-mark';
    check.textContent = '\u2713';
    card.appendChild(check);

    // Keep minimal info or remove entirely
    const info = document.createElement('div');
    info.className = 'item-info';
    const name = document.createElement('div');
    name.className = 'item-name';
    name.textContent = item.name;
    info.appendChild(name);
    card.appendChild(info);

    card.onclick = (e) => {
        // Don't toggle when clicking the tooltip area
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
        
        // Update tab info (min/total)
        if (elements.tabInfos?.[cat]) {
            elements.tabInfos[cat].textContent = `${count}/${config.min}`;
        }
        
        if (count < config.min) valid = false;
        
        // Collect selected items for the deck grid
        appState.selected[cat]?.forEach(key => {
            const item = categoryData[cat].find(i => i.key === key);
            if (item) {
                selectedItemList.push({ ...item, category: cat });
            }
        });
    });
    
    elements.globalTotal.textContent = `${total}/${CONFIG.globalMinTotal} minimum`;
    elements.globalTotal.className = total >= CONFIG.globalMinTotal ? 'global-total valid' : 'global-total error';
    
    // Render deck grid with only icons
    renderDeckGrid(selectedItemList);
}

function renderDeckGrid(items) {
    elements.deckGrid.innerHTML = '';
    
    if (items.length === 0) {
        elements.deckGrid.innerHTML = '<div style="grid-column:1/-1;padding:1rem;color:#999;text-align:center;font-size:0.75rem;">No items selected</div>';
        return;
    }
    
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
        
        // Close overlay on hover
        const close = document.createElement('div');
        close.className = 'close-overlay';
        close.textContent = '\u00D7';
        deckItem.appendChild(close);
        
        deckItem.title = item.name;
        deckItem.onclick = () => toggleItem(item.category, item.key);
        
        elements.deckGrid.appendChild(deckItem);
    });
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
    saveToStorage();
    renderAllTabs();
    updateDeckSummary();
}

function exportDeck() {
    // Validate all requirements before export
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
    
    // Global check
    const total = Object.values(appState.selected).reduce((sum, set) => sum + set.size, 0);
    if (total < CONFIG.globalMinTotal) {
        alert(`Cannot export. Total ${total}/${CONFIG.globalMinTotal} required.`);
        return;
    }
    
    // Export if valid
    const data = {
        version: 2,
        timestamp: new Date().toISOString(),
        deck: {}
    };
    Object.keys(CONFIG.categories).forEach(c => {
        data.deck[c] = Array.from(appState.selected[c] || []);
    });
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
        currentTab: appState.currentTab
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
        renderAllTabs();
        updateDeckSummary();
        if (elements.tabs) switchTab(appState.currentTab);
    } catch (err) {}
}

document.addEventListener('DOMContentLoaded', init);
