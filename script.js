// Predefined encounter rate sequence
const encounterRateSequence = [51, 51, 39, 25, 25, 25, 13, 10, 10, 3, 1, 1, 1, 1];

// Function to calculate percentage
function calculatePercentage(rate) {
    const total = encounterRateSequence.reduce((acc, curr) => acc + curr, 0);
    return (rate / total) * 100;
}

// Function to load the map index from the mapIndex.json file in the root folder
async function loadMapFiles() {
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

        const mapSelect = document.getElementById("mapDropdown");
        console.log("mapDropdown element:", mapSelect);  // Check if mapDropdown is found

        if (!mapSelect) {
            console.error("mapDropdown element not found!");
            return;
        }

        // Populate the dropdown with the map names (remove ".asm" extension)
        mapSelect.innerHTML = "";  // Clear existing options
        mapList.forEach(map => {
            const option = document.createElement("option");
            option.text = map.replace(".asm", "");
            option.value = map;
            mapSelect.add(option);
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
    lines.forEach((line, lineNumber) => {
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
        } else if (line.startsWith("db") && (parsingGrass || parsingWater) && line.length > 2) {
            // Remove 'db' and trim
            let encounterData = line.replace('db', '').trim();

            // Split by comma or any amount of whitespace
            let parts = encounterData.split(/[, ]+/);

            // Debugging: Log the line and parts
            console.log(`Parsing line ${lineNumber + 1}: "${line}"`);
            console.log(`Parts:`, parts);

            const level = parts[0] ? parts[0].trim() : null;
            const pokemon = parts[1] ? parts[1].split(";")[0].trim().toUpperCase() : null;

            // Additional Debugging: Log extracted level and pokemon
            console.log(`Extracted level: ${level}, pokemon: ${pokemon}`);

            if (level && pokemon) {
                if (parsingGrass) {
                    grassEncounters.push({ level, pokemon });
                } else if (parsingWater) {
                    waterEncounters.push({ level, pokemon });
                }
            } else {
                console.warn(`Failed to parse line ${lineNumber + 1}: "${line}"`);
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
        const percentage = calculatePercentage(encounterRate);
        resultArea.innerHTML += `<p>Level ${encounter.level} - ${encounter.pokemon} (${percentage.toFixed(2)}%)</p>`;
    });
}

// Function to calculate encounter rate based on the encounter index
function calculateEncounterRate(index) {
    return encounterRateSequence[index - 1] || 0;  // Return 0 if out of bounds
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

            // Parse the map data to extract encounters
            const grassEncounters = [];
            const waterEncounters = [];
            let parsingGrass = false;
            let parsingWater = false;

            const lines = mapData.split("\n");
            lines.forEach((line, lineNumber) => {
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
                } else if (line.startsWith("db") && (parsingGrass || parsingWater) && line.length > 2) {
                    // Remove 'db' and trim
                    let encounterData = line.replace('db', '').trim();

                    // Split by comma or any amount of whitespace
                    let parts = encounterData.split(/[, ]+/);

                    // Debugging: Log the line and parts
                    console.log(`Parsing line ${lineNumber + 1} in ${mapName}: "${line}"`);
                    console.log(`Parts:`, parts);

                    const level = parts[0] ? parts[0].trim() : null;
                    const pokemon = parts[1] ? parts[1].split(";")[0].trim().toUpperCase() : null;

                    // Additional Debugging: Log extracted level and pokemon
                    console.log(`Extracted level: ${level}, pokemon: ${pokemon}`);

                    if (level && pokemon) {
                        if (parsingGrass) {
                            grassEncounters.push({ level, pokemon });
                        } else if (parsingWater) {
                            waterEncounters.push({ level, pokemon });
                        }
                    } else {
                        console.warn(`Failed to parse line ${lineNumber + 1} in ${mapName}: "${line}"`);
                    }
                }
            });

            // Now search through the encounters
            const matchingGrassEncounters = grassEncounters.filter((encounter) => encounter.pokemon === searchTerm);
            const matchingWaterEncounters = waterEncounters.filter((encounter) => encounter.pokemon === searchTerm);

            if (matchingGrassEncounters.length > 0 || matchingWaterEncounters.length > 0) {
                resultArea.innerHTML += `<h3>Map: ${mapName.replace(".asm", "")}</h3>`;
                foundAny = true;

                if (matchingGrassEncounters.length > 0) {
                    resultArea.innerHTML += `<h4>Grass Encounters</h4>`;
                    matchingGrassEncounters.forEach((encounter) => {
                        const encounterIndex = grassEncounters.indexOf(encounter);
                        const encounterRate = calculateEncounterRate(encounterIndex + 1);
                        const percentage = calculatePercentage(encounterRate);
                        resultArea.innerHTML += `<p>Level ${encounter.level} - ${encounter.pokemon} (${percentage.toFixed(2)}%)</p>`;
                    });
                }

                if (matchingWaterEncounters.length > 0) {
                    resultArea.innerHTML += `<h4>Water Encounters</h4>`;
                    matchingWaterEncounters.forEach((encounter) => {
                        const encounterIndex = waterEncounters.indexOf(encounter);
                        const encounterRate = calculateEncounterRate(encounterIndex + 1);
                        const percentage = calculatePercentage(encounterRate);
                        resultArea.innerHTML += `<p>Level ${encounter.level} - ${encounter.pokemon} (${percentage.toFixed(2)}%)</p>`;
                    });
                }
            }
        }

        if (!foundAny) {
            resultArea.innerHTML += "<p>No Pokémon found matching your search term.</p>";
        }
    } catch (error) {
        console.error("Error during search:", error);
        alert("Failed to search. Please check console for details.");
    }
}

// Ensure DOM elements are ready before executing script
window.onload = function() {
    // Load the map list when the page loads
    loadMapFiles();

    // Event listeners for dropdown selection and search button
    const mapDropdownElement = document.getElementById("mapDropdown");
    console.log("mapDropdownElement at onload:", mapDropdownElement);  // Check if mapDropdown is found on window.onload
    if (mapDropdownElement) {
        mapDropdownElement.addEventListener("change", function() {
            const selectedMap = this.value;
            loadMap(selectedMap);
        });
    } else {
        console.error("Dropdown element not found in window.onload");
    }

    const searchButtonElement = document.getElementById("searchButton");
    searchButtonElement.addEventListener("click", searchPokemon);
};
