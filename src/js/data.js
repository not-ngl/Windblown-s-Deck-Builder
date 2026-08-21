async function loadData() {
    try {
        const promises = Object.keys(CONFIG.categories).map(async (cat) => {
            const res = await fetch(`./data/${cat}.json`);
            const json = await res.json();
            const name = cat.charAt(0).toUpperCase() + cat.slice(1);
            const data = json[name];
            
            categoryData[cat] = Object.entries(data || {}).map(([key, item]) => {
                const deckOutRaw = item.DeckOut;
                let deckOut = [];
                
                // Parse DeckOut if it exists 
                if (deckOutRaw && deckOutRaw.__array) {
                    deckOut = [...deckOutRaw.__array];
                }
                
                // augment DeckOut for Trinkets/Magifishes
                if (cat === 'trinkets' && !deckOut.includes('Trinket')) {
                    deckOut.push('Trinket');
                } else if (cat === 'magifishes' && !deckOut.includes('Magifish')) {
                    deckOut.push('Magifish');
                }
                
                return {
                    key,
                    name: item.Name || key,
                    description: item.Description ? cleanWikiText(item.Description) : '',
                    imageUrl: item.Image 
                        ? `${CONFIG.gameWikiBase}/images/${item.Image.replace(/ /g, '_')}?format=original` 
                        : null,
                    raw: item,
                    deckIn: item.DeckIn?.__array || [],  // Empty array if missing
                    deckOut: deckOut  // Augmented array
                };
            }).filter(item => !(item.raw.RemovedIn && item.raw.RemovedIn !== null));
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
    result = result.replace(/\{{(\w*Link)\|([^|{}]*)\|([^}{}]*)\}\}/g, (m, name, arg1, arg2) => arg2.trim());
    result = result.replace(/\{\{(\w*Link)\|([^}{}]*)\}\}/g, '$2');
    result = result.replace(/\(\s*capped[^)]*\)/gi, '');
    result = result.replace(/\bper level\b/gi, '');
  }

  result = result.replace(/\{[^}]*$/g, '').replace(/^\{[^}]*\}/g, '').replace(/\}/g, '');
  return result.trim();
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
