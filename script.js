const GITHUB_REPO_URL = "https://github.com/RainbowMetalPigeon/ExtremeYellow/tree/main/data/wild/maps/";

// Predefined encounter rate sequence
const encounterRateSequence = [51, 51, 39, 25, 25, 25, 13, 10, 10, 3, 1, 1, 1, 1];

function calculatePercentage(rate) {
    const total = encounterRateSequence.reduce((sum, val) => sum + val, 0);
    return (rate / total) * 100;
}

function parseAsmFile(content) {
    const encounterData = { grass: [], water: [] };
    let parsingGrass = false;
    let parsingWater = false;
    const lines = content.split("\n");

    lines.forEach((line) => {
        line = line.trim();
        if (line.includes("def_grass_wildmons")) {
            parsingGrass = true;
            parsingWater = false;
        } else if (line.includes("def_water_wildmons")) {
            parsingGrass = false;
            parsingWater = true;
        } else if (line.includes("end_grass_wildmons") || line.includes("end_water_wildmons")) {
            parsingGrass = false;
            parsingWater = false;
        } else if (line.startsWith("db") && (parsingGrass || parsingWater)) {
            try {
                const parts = line.split(",");
                const level = parts[0].split(" ")[1];
                const pokemon = parts[1].split(";")[0].trim();
                if (parsingGrass) {
                    encounterData.grass.push({ level, pokemon });
                } else if (parsingWater) {
                    encounterData.water.push({ level, pokemon });
                }
            } catch (e) {
                console.error("Error parsing line: ", line, e);
            }
        }
    });

    return encounterData;
}

async function fetchEncounters() {
    const mapName = document.getElementById('map-select').value;
    const url = `${GITHUB_REPO_URL}${mapName}.asm`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            document.getElementById('output').textContent = "Map file not found.";
            return;
        }

        const content = await response.text();
        const data = parseAsmFile(content);

        let output = `Map: ${mapName}\n\nGrass Encounters:\n`;
        if (data.grass.length > 0) {
            data.grass.forEach((encounter, idx) => {
                const rate = encounterRateSequence[idx] || 0;
                const percentage = calculatePercentage(rate).toFixed(2);
                output += `Level ${encounter.level} - ${encounter.pokemon} (${percentage}%)\n`;
            });
        } else {
            output += "No grass encounters found.\n";
        }

        output += "\nWater Encounters:\n";
        if (data.water.length > 0) {
            data.water.forEach((encounter, idx) => {
                const rate = encounterRateSequence[idx] || 0;
                const percentage = calculatePercentage(rate).toFixed(2);
                output += `Level ${encounter.level} - ${encounter.pokemon} (${percentage}%)\n`;
            });
        } else {
            output += "No water encounters found.\n";
        }

        document.getElementById('output').textContent = output;
    } catch (error) {
        console.error('Error fetching encounters:', error);
        document.getElementById('output').textContent = "Error fetching encounters.";
    }
}
