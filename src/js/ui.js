function renderAllTabs() {
    Object.keys(CONFIG.categories).forEach(renderTab);
}

function renderTab(category) {
    const panel = document.getElementById(category);
    if (!panel) return;

    panel.innerHTML = '';

    const config = CONFIG.categories[category];
    const items = getVisibleItems(category);

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

        // Smooth cursor-follow positioning
        iconWrap.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY - tooltip.offsetHeight / 2) + 'px';
        });

        iconWrap.addEventListener('mouseenter', () => {
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = '1';
        });

        iconWrap.addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
            tooltip.style.opacity = '0';
        });

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

    // Re-check eligibility 
    checkAllDeckEligibility();
}

function renderDeckGrid(items) {
    elements.deckGrid.innerHTML = '';

    if (items.length === 0) {
        elements.deckGrid.innerHTML = '<div style="grid-column:1/-1;padding:1rem;color:#999;text-align:center;font-size:0.75rem;">No items selected</div>';
        return;
    }

    const LONG_PRESS_DELAY = 500;

    items.forEach(item => {
        // Check eligibility
        let isIneligible = false;
        let requirementHint = [];

        if ((item.category === 'gifts' || item.category === 'hexes')) {
            const eligibility = isItemEligible(item);
            isIneligible = !eligibility.eligible;
            requirementHint = eligibility.requiredEffects;
        }

        const deckItem = document.createElement('div');
        deckItem.className = 'deck-item' + (isIneligible ? ' ineligible' : '');
        deckItem.dataset.key = item.key;
        deckItem.dataset.category = item.category;

        if (item.imageUrl) {
            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.alt = item.name;
            img.title = item.name;
            deckItem.appendChild(img);
        }

        // requirement hint for tooltip
        deckItem.dataset.requirementHint = requirementHint.join(', ');

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
}

function renderSlotGroup(containerId, items, slotType) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const slots = container.querySelectorAll('.build-slot');

    slots.forEach((slot) => {
        const index = parseInt(slot.dataset.index);

        // Clear previous content
        const existingImg = slot.querySelector('img:not([class*="icon"])');
        if (existingImg) existingImg.remove();
        const removeBtn = slot.querySelector('.remove-slot-btn');
        if (removeBtn) removeBtn.remove();
        slot.classList.remove('filled');

        const item = items[index];
        if (item && item.imageUrl) {
            slot.classList.add('filled');

            if (slotType === 'backpack') {
                const img = document.createElement('img');
                img.src = item.imageUrl;
                img.alt = item.name;
                img.title = item.name;
                img.style.zIndex = '2';
                slot.appendChild(img);

                slot.style.setProperty('--front-opacity', '0.7');
            } else {
                const img = document.createElement('img');
                img.src = item.imageUrl;
                img.alt = item.name;
                img.title = item.name;
                slot.appendChild(img);
            }

            slot.onclick = (e) => {
                e.stopPropagation();
                removeFromBuildBySlot(slotType, index);
            };

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-slot-btn';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromBuildBySlot(slotType, index);
            });

            slot.appendChild(removeBtn);
        } else {
            slot.onclick = null;

            if (slotType === 'backpack') {
                slot.style.setProperty('--front-opacity', '1');
            }
        }
    });
}

function renderSingleSlot(containerId, item, slotType) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const slot = container.querySelector('.build-slot');
    const index = parseInt(slot.dataset.index);

    const existingImg = slot.querySelector('img:not([class*="icon"])');
    if (existingImg) existingImg.remove();
    const removeBtn = slot.querySelector('.remove-slot-btn');
    if (removeBtn) removeBtn.remove();
    slot.classList.remove('filled');

    if (item && item.imageUrl) {
        slot.classList.add('filled');

        if (slotType === 'backpack') {
            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.alt = item.name;
            img.title = item.name;
            img.style.zIndex = '2';
            slot.appendChild(img);
            slot.style.setProperty('--front-opacity', '0.7');
        } else {
            const img = document.createElement('img');
            img.src = item.imageUrl;
            img.alt = item.name;
            img.title = item.name;
            slot.appendChild(img);
        }

        slot.onclick = (e) => {
            e.stopPropagation();
            removeFromBuildBySlot(slotType, index);
        };

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-slot-btn';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromBuildBySlot(slotType, index);
        });

        slot.appendChild(removeBtn);
    } else {
        slot.onclick = null;

        if (slotType === 'backpack') {
            slot.style.setProperty('--front-opacity', '1');
        }
    }
}

function switchTab(tab) {
    appState.currentTab = tab;
    elements.tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    elements.panels.forEach(p => p.classList.toggle('active', p.id === tab));
    saveToStorage();
}

function isSelected(category, itemKey) {
    return appState.selected[category]?.has(itemKey) || false;
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

function checkAllDeckEligibility() {
    const deckItems = elements.deckGrid.querySelectorAll('.deck-item');

    deckItems.forEach(deckItem => {
        const key = deckItem.dataset.key;
        const category = deckItem.dataset.category;

        const item = categoryData[category]?.find(i => i.key === key);
        if (!item) return;

        if (category !== 'gifts' && category !== 'hexes') return;

        const eligibility = isItemEligible(item);
        const isIneligible = !eligibility.eligible;

        deckItem.classList.toggle('ineligible', isIneligible);

        if (isIneligible) {
            const hint = eligibility.requiredEffects.join(', ');
            deckItem.dataset.requirementHint = hint;
            deckItem.title = `${item.name}\nRequires: ${hint}`;
        } else {
            delete deckItem.dataset.requirementHint;
            deckItem.title = item.name;
        }
    });
}

