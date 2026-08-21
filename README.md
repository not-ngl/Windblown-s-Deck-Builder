# Windblown's Deck Builder

A web-based deck builder tool for the game Windblown. Plan, validate, and export your builds with real-time eligibility checking and slot visualization.

## Live Demo
[Just here](https://not-ngl.github.io/windblown-deck-builder/).

## Features
### Core Functionality
- **Deck Planning**: Select items across all categories (Weapons, Trinkets, Magifishes, Gifts, Hexes)
- **Build Visualization**: Visual slot representation for Weapons (2), Trinkets (2), Magifishes (1), Backpack (1), Hexes (1-5), and Gifts (6-18+)
- **Eligibility Checking**: Automatic check if Gift/Hex can generate with the current build
- **Mode Support**: Toggle between Normal and Endless modes
- **Random Chrysalis Hex**: +6 gift slots if equipped and checked with this bonus
- **Import/Export**: Save and share decks via JSON files

### Category Minimums
| Category | Total Available | Minimum Required |
|----------|-----------------|------------------|
| Weapons | 28 | 8 |
| Trinkets | 25 | 8 |
| Magifishes | 3 | 2 |
| Gifts | 135 | 35 |
| Hexes | 20 | 8 |
| **Global Minimum** | **211** | **80** |

### Slot Configuration
| Mode | Hex Slots | Gift Slots |
|------|-----------|------------|
| Normal | 1 | 6 |
| Endless | 5 | 18 |
| Random Chrysalis Hex | - | +6 |

## Data Sources
All game data is fetched from the Windblown Wiki:

| Source | Wiki Page |
|--------|--------------|
| Weapons | [Module:Weapons/Data](https://windblown.wiki.gg/wiki/Module:Weapons/Data) |
| Trinkets | [Module:Trinkets/Data](https://windblown.wiki.gg/wiki/Module:Trinkets/Data) |
| Magifishes | [Module:Magifishes/Data](https://windblown.wiki.gg/wiki/Module:Magifishes/Data) |
| Gifts | [Module:Gifts/Data](https://windblown.wiki.gg/wiki/Module:Gifts/Data) |
| Hexes | [Module:Hexes/Data](https://windblown.wiki.gg/wiki/Module:Hexes/Data) |

Icons and metadata are sourced from the [Windblown Wiki](https://windblown.wiki.gg/) and processed during the build process.
- Weapon Icons: [Category:Weapon Icon Images](https://windblown.wiki.gg/wiki/Category:Weapon_Icon_Images)
- Trinket Icons: [Category:Trinket Icon Images](https://windblown.wiki.gg/wiki/Category:Trinket_Icon_Images)
- Magifish Icons: [Category:Magifish Icon Images](https://windblown.wiki.gg/wiki/Category:Magifish_Icon_Images)
- Gift Icons: [Category:Gift Icon Images](https://windblown.wiki.gg/wiki/Category:Gift_Icon_Images)
- Hex Icons: [Category:Hex Icon Images](https://windblown.wiki.gg/wiki/Category:Hex_Icon_Images)

## Design & Assets
### Icons
All icons are served from the Windblown Wiki or bundled locally:

- **Icon Frames**: Color-coded frames for each category (Red=Weapons, Purple=Trinkets/Magifishes, Blue=Gifts/Hexes)
- **Slot Backgrounds**: Dedicated backgrounds for Backpack, Hex, and Gift slots
- **Logo**: [Custom WDB logo](https://windblown-logo-generator.vercel.app/?text=Deck+builder&font=LT+Museum&style=normal&offset=2&gc=%235100ff&gs=10&c1=%231ddcff&a1=1&c2=%23ff2dff&a2=1&c3=%23ffffff&a3=1&c4=%23b3ddf3&a4=1)

### Styling
CSS variables and theme design copy-pasted from [Windblown Wiki Common.css](https://windblown.wiki.gg/wiki/MediaWiki:Common.css).

## Usage
### Building a Deck
1. Click items in the category panels to select them for your deck
2. Toggle **Build Mode** to move items from deck to build slots
3. Use **long-press** in build mode for quick backpack assignment
4. Watch eligibility indicators (grayed out = cannot spawn with the current build)

### Exporting
Click **Export** to download your deck as JSON. Share the file with others who can **Import** it to load your build.

## Contributing
Feel free to submit issues or enhancement requests via GitHub Issues.

## How It Works
### Data Pipeline
- Run `npm run fetch-data` to sync game data from the Windblown Wiki via MediaWiki API
- Lua modules are fetched, parsed, and converted to JSON for client-side consumption
- All icons are hotlinked directly from the wiki

### Data Structure
Wiki's Modules handle:
- Name
- Icon Name
- Type (for Gifts)
- Description
- **DeckIn** attribute: which effect does this item need in order to spawn? (added only for this tool!)
- **DeckOut** attribute: which effect does this item provide when equipped? (added only for this tool!)

This permits to organize properly the Deck as the one provided in-game, with the same requirements. The DeckIn/DeckOut attributes allows to go even further than the in-game version by showing the cascade of items that cannot generate with the build.

## License
Tool code: [MIT License](LICENSE)  
Game assets & icons: © Motion Twin  
Wiki data: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)

---

*This is an unofficial fan tool. Not affiliated with Windblown developers or publishers.*
