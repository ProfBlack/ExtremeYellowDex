const baseUrl = 'https://raw.githubusercontent.com/RainbowMetalPigeon/ExtremeYellow/main/data/wild/maps/';
const asmFileList = [];  // Holds the list of available .asm files
let mapData = {};        // Holds the parsed data for each map

// Function to fetch the list of map files from GitHub and populate the dropdown
async function loadMapList() {
    const response = await fetch(baseUrl);
    const text = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');

    const links = [...doc.querySelectorAll('a')];
    links.forEach(link => {
        const fileName = link.textContent.trim();
        if (fileName.endsWith('.asm')) {
            asmFileList.push(fileName);
        }
    });

    const mapSelect = document.getElementById('mapSelect');
    asmFileList.forEach(file => {
        const option = document.createElement('option');
        option.value = file;
        option.textContent = file.replace('.asm', '');
        mapSelect.appendChild(option);
    });
}

// Function to fetch and parse an individual .asm file
async function fetchMapData(mapFileName) {
    const response = await fetch(baseUrl + mapFileName);
    const fileText = await response.text();
    return parseAsmFile(fileText);
}

// Parse the .asm file and extract encounter data (grass and water)
function parseAsmFile(fileContent) {
    const encounterData = { grass: [], water: [] };
    const lines = fileContent.split('\n');
    let parsingGrass = false;
    let parsingWater = false;

    lines.forEach(line => {
        line = line.trim();

        if (line.includes('def_grass_wildmons')) {
            parsingGrass = true;
            parsingWater = false;
        } else if (line.includes('def_water_wildmons')) {
            parsingGrass = false;
            parsingWater = true;
        } else if (line.includes('end_grass_wildmons') || line.includes('end_water_wildmons')) {
            parsingGrass = false;
            parsingWater = false;
        } else if (line.startsWith('db') && (parsingGrass || parsingWater)) {
            const parts = line.split(',');
            const level = parts[0].split(' ')[1];
            const pokemon = parts[1].split(';')[0].trim();

            if (parsingGrass) {
                encounterData.grass.push({ level, pokemon });
            } else if (parsingWater) {
                encounterData.water.push({ level, pokemon });
            }
        }
    });

    return encounterData;
}

// Apply encounter rate percentages to parsed encounters
function applyEncounterRates(encounters) {
    const rates = [51, 51, 39, 25, 25, 25, 13, 10, 10, 3, 1, 1, 1, 1]; // Hardcoded encounter rate sequence
    return encounters.map((encounter, index) => {
        const rate = rates[index] || 0; // Default to 0 if there are more Pokémon than rates
        const percentage = (rate / 100).toFixed(2) * 100; // Convert to percentage
        return { ...encounter, rate: percentage };
    });
}

// Load the selected map and display encounter data
async function loadMap() {
    const mapSelect = document.getElementById('mapSelect');
    const selectedMap = mapSelect.value;

    const resultDiv = document.getElementById('result');
    resultDiv.textContent = `Loading ${selectedMap}...`;

    const mapFileName = selectedMap;
    const encounterData = await fetchMapData(mapFileName);

    resultDiv.textContent = `Map: ${selectedMap.replace('.asm', '')}\n\nGrass Encounters:\n`;

    const grassEncounters = applyEncounterRates(encounterData.grass);
    if (grassEncounters.length) {
        grassEncounters.forEach(encounter => {
            resultDiv.textContent += `Level ${encounter.level} - ${encounter.pokemon} (${encounter.rate}%)\n`;
        });
    } else {
        resultDiv.textContent += 'No grass encounters found.\n';
    }

    resultDiv.textContent += `\nWater Encounters:\n`;

    const waterEncounters = applyEncounterRates(encounterData.water);
    if (waterEncounters.length) {
        waterEncounters.forEach(encounter => {
            resultDiv.textContent += `Level ${encounter.level} - ${encounter.pokemon} (${encounter.rate}%)\n`;
        });
    } else {
        resultDiv.textContent += 'No water encounters found.\n';
    }

    mapData[selectedMap] = { grassEncounters, waterEncounters };
}

// Search for Pokémon across all loaded maps
function searchPokemon() {
    const searchInput = document.getElementById('searchInput').value.trim().toUpperCase();
    const resultDiv = document.getElementById('result');
    resultDiv.textContent = '';

    let foundAny = false;

    asmFileList.forEach(mapFile => {
        const mapEncounters = mapData[mapFile];
        if (!mapEncounters) return;

        let found = false;
        resultDiv.textContent += `Map: ${mapFile.replace('.asm', '')}\n\n`;

        mapEncounters.grassEncounters.forEach(encounter => {
            if (encounter.pokemon.toUpperCase().includes(searchInput)) {
                resultDiv.textContent += `Grass - Level ${encounter.level} - ${encounter.pokemon} (${encounter.rate}%)\n`;
                found = true;
                foundAny = true;
            }
        });

        mapEncounters.waterEncounters.forEach(encounter => {
            if (encounter.pokemon.toUpperCase().includes(searchInput)) {
                resultDiv.textContent += `Water - Level ${encounter.level} - ${encounter.pokemon} (${encounter.rate}%)\n`;
                found = true;
                foundAny = true;
            }
        });

        if (!found) {
            resultDiv.textContent += 'No encounters found for this Pokémon.\n';
        }
    });

    if (!foundAny) {
        resultDiv.textContent = `No encounters found for Pokémon: ${searchInput}`;
    }
}

// Load the map list when the page is ready
loadMapList();
