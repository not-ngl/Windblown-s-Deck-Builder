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
let chrysalisBonusActive = false;

const elements = {};
let categoryData = {};
