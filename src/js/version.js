function setupVersionSelector() {
    const select = document.getElementById('version-select');
    if (!select) return;
    
    select.innerHTML = '';
    
    availableVersionsList.forEach(version => {
        const option = document.createElement('option');
        const display = version.replace('Version ', '');
        option.value = version;
        option.textContent = display;
        select.appendChild(option);
    });
    
    if (appState.selectedVersion) {
        select.value = appState.selectedVersion;
        selectedVersionParsed = parseVersion(appState.selectedVersion);
    } else if (availableVersionsList.length > 0) {
        appState.selectedVersion = availableVersionsList[availableVersionsList.length - 1];
        select.value = appState.selectedVersion;
        selectedVersionParsed = parseVersion(appState.selectedVersion);
    }
    
    select.addEventListener('change', handleVersionChange);
}

function handleVersionChange(e) {
    const newVersion = e.target.value;
    if (newVersion === appState.selectedVersion) return;
    
    appState.selectedVersion = newVersion;
    selectedVersionParsed = parseVersion(newVersion);
    
    saveToStorage();
    
    cleanUpUnavailableItems();
    
    renderAllTabs();
    updateDeckSummary();
    checkAllDeckEligibility();
    renderBuildSlots();
}

function cleanUpUnavailableItems() {
    let removedCount = 0;
    
    Object.keys(appState.selected).forEach(category => {
        const visibleItems = getVisibleItems(category);
        const visibleKeys = new Set(visibleItems.map(i => i.key));
        
        const toRemove = [];
        appState.selected[category].forEach(key => {
            if (!visibleKeys.has(key)) {
                toRemove.push(key);
            }
        });
        
        toRemove.forEach(key => {
            appState.selected[category].delete(key);
            removeFromBuildIfPresent(category, key);
            removedCount++;
            
            const card = document.querySelector(`#grid-${category} [data-key="${key}"]`);
            if (card) {
                card.classList.remove('selected');
            }
        });
    });
    
    ['weapons', 'trinkets', 'magifishes', 'gifts', 'hexes'].forEach(cat => {
        if (Array.isArray(currentBuild[cat])) {
            currentBuild[cat].forEach((item, idx) => {
                if (item && !getVisibleItems(cat).some(i => i.key === item.key)) {
                    const oldItem = currentBuild[cat][idx];
                    appState.selected[cat].add(oldItem.key);
                    const card = document.querySelector(`#grid-${cat} [data-key="${oldItem.key}"]`);
                    if (card) card.classList.add('selected');
                    currentBuild[cat][idx] = null;
                }
            });
        }
    });
    
    if (currentBuild.backpack) {
        const category = currentBuild.backpack.category;
        if (!getVisibleItems(category).some(i => i.key === currentBuild.backpack.key)) {
            appState.selected[category].add(currentBuild.backpack.key);
            const card = document.querySelector(`#grid-${category} [data-key="${currentBuild.backpack.key}"]`);
            if (card) card.classList.add('selected');
            currentBuild.backpack = null;
        }
    }
    
    if (chrysalisBonusActive && !hasChrysalis()) {
        chrysalisBonusActive = false;
        const checkbox = document.getElementById('chrysalis-bonus-checkbox');
        if (checkbox) checkbox.checked = false;
        rebuildBuildSection(true);
    }
}

function parseVersion(versionStr) {
    if (!versionStr || typeof versionStr !== 'string') return null;
    const match = versionStr.match(/Version\s+(\d+)\.(\d+)/i);
    if (!match) return null;
    return {
        original: versionStr,
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10)
    };
}

function compareVersions(v1, v2) {
    if (v1.major !== v2.major) {
        return v1.major - v2.major;
    }
    return v1.minor - v2.minor;
}

function isItemAvailable(item, selectedVersionParsed) {
    const addedIn = parseVersion(item.raw?.AddedIn);
    const removedIn = parseVersion(item.raw?.RemovedIn);

    if (addedIn && compareVersions(addedIn, selectedVersionParsed) > 0) {
        return false;
    }

    if (removedIn && compareVersions(removedIn, selectedVersionParsed) <= 0) {
        return false;
    }

    return true;
}

function deriveAvailableVersions() {
    const versions = new Set();
    Object.keys(categoryData).forEach(cat => {
        categoryData[cat].forEach(item => {
            if (item.raw?.AddedIn) versions.add(item.raw.AddedIn);
            if (item.raw?.RemovedIn) versions.add(item.raw.RemovedIn);
        });
    });

    const parsed = Array.from(versions)
        .map(v => parseVersion(v))
        .filter(p => p !== null)
        .sort(compareVersions);

    return parsed.map(p => p.original);
}

function getVisibleItems(category) {
    const items = categoryData[category] || [];
    if (!appState.selectedVersion || !selectedVersionParsed) {
        return items;
    }
    return items.filter(item => isItemAvailable(item, selectedVersionParsed));
}
