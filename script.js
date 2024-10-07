async function loadMap() {
    const mapSelect = document.getElementById('mapSelect');
    const selectedMap = mapSelect.value;
    const outputDiv = document.getElementById('output');

    // Clear previous output
    outputDiv.innerHTML = '';

    // Fetch the selected map's ASM file
    const fileUrl = `https://raw.githubusercontent.com/RainbowMetalPigeon/ExtremeYellow/main/data/wild/maps/${selectedMap}.asm`;
    try {
        const response = await fetch(fileUrl);
        const data = await response.text();

        // Display the raw data (for now, just to show it's working)
        outputDiv.innerHTML = `<pre>${data}</pre>`;

        // TODO: Parse the .asm file contents like in the Python script
        // Apply the encounter rate sequencing logic and display formatted output
    } catch (error) {
        outputDiv.innerHTML = `Error loading map: ${error.message}`;
    }
}
