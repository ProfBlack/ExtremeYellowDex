// Function to load the map index from the mapIndex.json file in the root folder
async function loadMapList() {
    console.log("Fetching map list from mapIndex.json...");
    
    try {
        const response = await fetch("mapIndex.json");
        if (!response.ok) {
            throw new Error(`Failed to load map index: ${response.statusText}`);
        }
        const data = await response.json();
        const mapList = data.maps;
        console.log("Maps found: ", mapList);

        if (mapList.length === 0) {
            console.log("No .asm files found!");
            alert("No .asm files found in the maps folder.");
            return;
        }

        // Populate the dropdown with the map names (remove ".asm" extension)
        const mapDropdown = document.getElementById("mapDropdown");
        mapDropdown.innerHTML = "";  // Clear existing options
        mapList.forEach(map => {
            const option = document.createElement("option");
            option.text = map.replace(".asm", "");
            option.value = map;
            mapDropdown.add(option);
        });

        // Automatically load the first map when the page loads
        loadMap(mapList[0]);
    } catch (error) {
        console.error("Error loading map index:", error);
        alert("Failed to load map list. Please check console for details.");
    }
}

// Function to load and display data from a specific .asm map file
async function loadMap(mapName) {
    console.log(`Loading map: ${mapName}...`);

    try {
        const response = await fetch(`maps/${mapName}`);
        if (!response.ok) {
            throw new Error(`Failed to load map: ${response.statusText}`);
        }
        const mapData = await response.text();
        parseMapData(mapName, mapData);
    } catch (error) {
        console.error("Error loading map file:", error);
        alert(`Failed to load map file: ${mapName}. Please check console for details.`);
    }
}

// Function to parse the map data and display it in the result area
function parseMapData(mapName, mapData) {
    const resultArea = document.getElementById("resultArea");
    resultArea.innerHTML = `<h2>Map: ${mapName.replace(".asm", "")}</h2>`;
    
    const grassEncounters = [];
    const waterEncounters = [];
    let parsingGrass = false;
    let parsingWater = false;

    const lines = mapData.split("\n");
    lines.forEach(line => {
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
            const parts = line.split(",");
            const level = parts[0].split(" ")[1].trim();
            const pokemon = parts[1].split(";")[0].trim();

            if (parsingGrass) {
                grassEncounters.push({ level, pokemon });
            } else if (parsingWater) {
                waterEncounters.push({ level, pokemon });
            }
        }
    });

    displayEncounters(resultArea, "Grass", grassEncounters);
    displayEncounters(resultArea, "Water", waterEncounters);
}

// Function to display encounters in the result area
function displayEncounters(resultArea, encounterType, encounters) {
    resultArea.innerHTML += `<h3>${encounterType} Encounters</h3>`;
    
    if (encounters.length === 0) {
        resultArea.innerHTML += `<p>No ${encounterType.toLowerCase()} encounters found.</p>`;
        return;
    }

    encounters.forEach((encounter, index) => {
        const encounterRate = calculateEncounterRate(index + 1);
        resultArea.innerHTML += `<p>Level ${encounter.level} - ${encounter.pokemon} (${encounterRate}%)</p>`;
    });
}

// Function to calculate encounter rate based on the encounter index (same logic as before)
function calculateEncounterRate(index) {
    const encounterRates = [51, 51, 39, 25, 25, 25, 13, 10, 10, 3, 1, 1, 1, 1];  // Predefined sequence
    return encounterRates[index - 1] || 0;  // Return 0 if out of bounds
}

// Function to handle the search for a specific Pokémon across all maps
async function searchPokemon() {
    const searchTerm = document.getElementById("searchInput").value.trim().toUpperCase();
    console.log(`Searching for: ${searchTerm}`);

    if (!searchTerm) {
        alert("Please enter a Pokémon name to search for.");
        return;
    }

    try {
        const response = await fetch("mapIndex.json");
        if (!response.ok) {
            throw new Error(`Failed to load map index: ${response.statusText}`);
        }
        const data = await response.json();
        const mapList = data.maps;
        const resultArea = document.getElementById("resultArea");
        resultArea.innerHTML = `<h2>Search Results for: ${searchTerm}</h2>`;

        let foundAny = false;

        for (const mapName of mapList) {
            const mapResponse = await fetch(`maps/${mapName}`);
            if (!mapResponse.ok) {
                throw new Error(`Failed to load map: ${mapName}`);
            }
            const mapData = await mapResponse.text();

            let foundInMap = false;
            const lines = mapData.split("\n");

            lines.forEach(line => {
                if (line.includes(searchTerm)) {
                    if (!foundInMap) {
                        resultArea.innerHTML += `<h3>Map: ${mapName.replace(".asm", "")}</h3>`;
                        foundInMap = true;
                        foundAny = true;
                    }
                    resultArea.innerHTML += `<p>${line.trim()}</p>`;
                }
            });
        }

        if (!foundAny) {
            resultArea.innerHTML += "<p>No Pokémon found matching your search term.</p>";
        }
    } catch (error) {
        console.error("Error during search:", error);
        alert("Failed to search. Please check console for details.");
    }
}

// Event listeners for dropdown selection and search button
document.getElementById("mapDropdown").addEventListener("change", function() {
    const selectedMap = this.value;
    loadMap(selectedMap);
});

document.getElementById("searchButton").addEventListener("click", searchPokemon);

// Load the map list when the page loads
window.onload = loadMapList;
