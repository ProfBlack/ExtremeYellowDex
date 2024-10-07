const mapSelect = document.getElementById('mapSelect');
const resultContainer = document.getElementById('result');

// Base URL of the external GitHub repository containing the map files
const baseUrl = 'https://raw.githubusercontent.com/RainbowMetalPigeon/ExtremeYellow/main/data/wild/maps/';

// Array of map filenames
const mapFiles = [
    'CeladonCity.asm',
    'CeruleanCave.asm',
    'CeruleanCity.asm',
    // Add other map filenames here
];

// Encounter rate sequence (hardcoded)
const encounterRateSequence = [51, 51, 39, 25, 25, 25, 13, 10, 10, 3, 1, 1, 1];

// Load map files into dropdown on page load
function loadMapFiles() {
    mapFiles.forEach(mapFile => {
        const option = document.createElement('option');
        option.value = mapFile;
        option.text = mapFile.replace('.asm', '');
        mapSelect.appendChild(option);
    });
}

// Fetch and parse map data
async function fetchMapData(mapFile) {
    const url = `${baseUrl}${mapFile}`;
    console.log(`Fetching map data from: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.text();
        return parseAsmFile(data);
    } catch (error) {
        console.error('Error fetching map data:', error);
        return null;
    }
}

// Parse the ASM file content and extract encounters
function parseAsmFile(data) {
    const encounterData = { grass: [], water: [] };
    const lines = data.split('\n');

    let parsingGrass = false;
    let parsingWater = false;

    let encounterIndex = 0;

    lines.forEach(line => {
        line = line.trim();

        if (line.includes('def_grass_wildmons')) {
            parsingGrass = true;
            parsingWater = false;
            encounterIndex = 0;
        } else if (line.includes('def_water_wildmons')) {
            parsingGrass = false;
            parsingWater = true;
            encounterIndex = 0;
        } else if (line.includes('end_grass_wildmons') || line.includes('end_water_wildmons')) {
            parsingGrass = false;
            parsingWater = false;
        } else if (line.startsWith('db') && (parsingGrass || parsingWater)) {
            try {
                const parts = line.split(',');
                const level = parts[0].split()[1];
                const pokemon = parts[1].split(';')[0].trim();
                const encounterRate = encounterRateSequence[encounterIndex] || 0; // Apply encounter rate

                if (parsingGrass) {
                    encounterData.grass.push({ level, pokemon, encounterRate });
                } else if (parsingWater) {
                    encounterData.water.push({ level, pokemon, encounterRate });
                }

                encounterIndex++; // Move to the next rate in the sequence
            } catch (error) {
                console.log(`Error parsing line: ${line}. Error: ${error}`);
            }
        }
    });

    return encounterData;
}

// Display the selected map's encounters
function loadMap() {
    const selectedMap = mapSelect.value;
    console.log(`Selected map: ${selectedMap}`);

    resultContainer.innerHTML = 'Loading...';

    fetchMapData(selectedMap).then(data => {
        if (data) {
            resultContainer.innerHTML = `Map: ${selectedMap.replace('.asm', '')}\n\nGrass Encounters:\n`;

            if (data.grass.length > 0) {
                data.grass.forEach(encounter => {
                    resultContainer.innerHTML += `Level ${encounter.level} - ${encounter.pokemon} - ${encounter.encounterRate}%\n`;
                });
            } else {
                resultContainer.innerHTML += 'No grass encounters found.\n';
            }

            resultContainer.innerHTML += '\nWater Encounters:\n';
            if (data.water.length > 0) {
                data.water.forEach(encounter => {
                    resultContainer.innerHTML += `Level ${encounter.level} - ${encounter.pokemon} - ${encounter.encounterRate}%\n`;
                });
            } else {
                resultContainer.innerHTML += 'No water encounters found.\n';
            }
        } else {
            resultContainer.innerHTML = 'Failed to load map data.';
        }
    }).catch(error => {
        console.error('Error displaying map:', error);
        resultContainer.innerHTML = 'Error displaying map data.';
    });
}

// Search for a Pokémon in all maps
async function searchPokemon() {
    const searchTerm = document.getElementById('searchInput').value.trim().toUpperCase();
    console.log('Search Term:', searchTerm);

    resultContainer.innerHTML = 'Searching...';

    let foundAny = false;

    for (const mapFile of mapFiles) {
        const data = await fetchMapData(mapFile);

        if (data) {
            let found = false;

            // Search in grass encounters
            data.grass.forEach(encounter => {
                if (encounter.pokemon.toUpperCase().includes(searchTerm)) {
                    if (!found) {
                        resultContainer.innerHTML += `\nMap: ${mapFile.replace('.asm', '')}\n`;
                        found = true;
                        foundAny = true;
                    }
                    resultContainer.innerHTML += `Grass - Level ${encounter.level} - ${encounter.pokemon} - ${encounter.encounterRate}%\n`;
                }
            });

            // Search in water encounters
            data.water.forEach(encounter => {
                if (encounter.pokemon.toUpperCase().includes(searchTerm)) {
                    if (!found) {
                        resultContainer.innerHTML += `\nMap: ${mapFile.replace('.asm', '')}\n`;
                        found = true;
                        foundAny = true;
                    }
                    resultContainer.innerHTML += `Water - Level ${encounter.level} - ${encounter.pokemon} - ${encounter.encounterRate}%\n`;
                }
            });
        }
    }

    if (!foundAny) {
        resultContainer.innerHTML = `No encounters found for Pokémon: ${searchTerm}`;
    }
}

// Load map files when the page is loaded
window.onload = loadMapFiles;
