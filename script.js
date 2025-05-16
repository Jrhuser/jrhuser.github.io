document.addEventListener('DOMContentLoaded', () => {
    const openSystemRadio = document.getElementById('openSystem');
    const closedSystemRadio = document.getElementById('closedSystem');

    const conditionalPromptsDiv = document.getElementById('conditionalPrompts');
    const openInputsSection = document.getElementById('openInputs');
    const closedInputsSection = document.getElementById('closedInputs');
    const electricalCostSection = document.getElementById('electricalCostSection'); // Get the section itself
    const calculateButton = document.getElementById('calculateButton');

    const outputSection = document.getElementById('outputSection');
    const outputSeparator = document.getElementById('outputSeparator');

    const recircRateInput = document.getElementById('recircRate');
    const openSystemVolumeInput = document.getElementById('openSystemVolume');
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const electricalCostInput = document.getElementById('electricalCost');

    // --- Google Sheet Configuration ---
    // IMPORTANT: Make sure your Google Sheet is published to the web as a CSV.
    // File > Share > Publish to web > Select the relevant sheet > CSV > Publish
    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR5t5nZzFh8bL7jA6U8jW5fP3kY9vX_cM0bN7sA5fG6hJ8kL9oP7sQ4wZ1xR3cY_tI2pK_sS/pub?output=csv'; // **REPLACE WITH YOUR PUBLISHED CSV URL (ensure it's the one for gid=0 or your specific sheet if different)**
    let database = [];

    // Function to fetch and parse CSV data
    async function fetchData() {
        try {
            const response = await fetch(SPREADSHEET_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}. Check SPREADSHEET_URL and ensure sheet is published.`);
            }
            const csvText = await response.text();
            database = parseCSV(csvText);
            if (database.length === 0) {
                console.warn("Database loaded but is empty. Check CSV format and content.");
                alert("Database is empty or could not be parsed correctly. Please check the console and the Google Sheet.");
            } else {
                console.log("Database loaded:", database.length, "entries.");
            }
        } catch (error) {
            console.error("Error fetching or parsing spreadsheet data:", error);
            alert("Could not load the database. Please check the console for errors, ensure the Google Sheet is published correctly as a CSV, and the URL is correct.");
        }
    }

    // Function to parse CSV text into an array of objects
    function parseCSV(csvText) {
        const lines = csvText.trim().split(/\r?\n/); // Handles both LF and CRLF line endings
        if (lines.length < 2) return []; // No data or only headers

        const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, '')); // Remove quotes from headers
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue; // Skip empty lines

            // Basic CSV parsing - may need improvement for complex CSVs (e.g., commas within quoted fields)
            const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
            
            if (values.length === headers.length) {
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index];
                });
                data.push(entry);
            } else {
                console.warn(`Row ${i+1} has incorrect number of columns. Expected ${headers.length}, got ${values.length}. Line: "${lines[i]}"`);
            }
        }
        return data;
    }

    // Event listeners for system type change
    openSystemRadio.addEventListener('change', handleSystemTypeChange);
    closedSystemRadio.addEventListener('change', handleSystemTypeChange);

    function handleSystemTypeChange() {
        outputSection.style.display = 'none'; // Hide results when selection changes
        outputSeparator.style.display = 'none';

        if (openSystemRadio.checked) {
            conditionalPromptsDiv.style.display = 'block';
            openInputsSection.style.display = 'block';
            closedInputsSection.style.display = 'none';
            electricalCostSection.style.display = 'block'; // Show electrical cost for open
        } else if (closedSystemRadio.checked) {
            conditionalPromptsDiv.style.display = 'block';
            openInputsSection.style.display = 'none';
            closedInputsSection.style.display = 'block';
            electricalCostSection.style.display = 'block'; // Show electrical cost for closed
        } else {
            conditionalPromptsDiv.style.display = 'none'; // Should not happen if one is always selected
        }
    }

    // Event listener for the calculate button
    calculateButton.addEventListener('click', () => {
        if (database.length === 0) {
            alert("Database is not loaded yet or is empty. Please wait or try refreshing. Check console for errors.");
            return;
        }

        const systemType = openSystemRadio.checked ? 'open' : (closedSystemRadio.checked ? 'closed' : null);
        if (!systemType) {
            alert("Please select a system type (Open or Closed).");
            return;
        }

        const electricalCost = parseFloat(electricalCostInput.value);
        if (isNaN(electricalCost) || electricalCost < 0) { // Allow 0 cost
            alert("Please enter a valid electrical cost (e.g., 0.10).");
            return;
        }

        let inputValue;
        let inputType; // 'recirc' or 'volume'

        if (systemType === 'open') {
            const recircRate = parseFloat(recircRateInput.value);
            const openVolume = parseFloat(openSystemVolumeInput.value);

            // Clear the other open input field if one is filled, to avoid confusion
            if (!isNaN(recircRate) && recircRate > 0) {
                inputValue = recircRate;
                inputType = 'recirc';
                openSystemVolumeInput.value = ''; // Clear the other field
            } else if (!isNaN(openVolume) && openVolume > 0) {
                inputValue = openVolume;
                inputType = 'volume';
                recircRateInput.value = ''; // Clear the other field
            } else {
                alert("For Open systems, please enter a valid Recirc Rate OR System Volume.");
                return;
            }
        } else { // Closed system
            const closedVolume = parseFloat(closedSystemVolumeInput.value);
            if (isNaN(closedVolume) || closedVolume <= 0) {
                alert("For Closed systems, please enter a valid System Volume.");
                return;
            }
            inputValue = closedVolume;
            inputType = 'volume';
        }

        const results = findMatchingModels(systemType, inputType, inputValue, electricalCost);
        displayResults(results);
        outputSeparator.style.display = 'block';
        outputSection.style.display = 'block';
        outputSection.scrollIntoView({ behavior: 'smooth' }); // Scroll to results
    });

    function findMatchingModels(systemType, inputType, value, electricalCost) {
        const matchedModels = {
            separator: null,
            vaf: null,
            vortisand: null
        };

        console.log(`Searching for: System=${systemType}, InputType=${inputType}, Value=${value}`);

        database.forEach(model => {
            // Normalize column names from CSV if needed (e.g. remove extra spaces or quotes)
            const modelType = model['Type']?.trim().toLowerCase();
            const modelSystem = model['System']?.trim().toLowerCase();
            const modelName = model['Model']?.trim();
            const description = model['Description']?.trim();
            const flowrateGPM = parseFloat(model['Flowrate (GPM)']); // Or whatever your column is named for model's flowrate
            const hp = parseFloat(model['HP']);

            // Ensure numeric fields are numbers, default to NaN if not convertible
            const minRecirc = parseFloat(model['Min Recirc (GPM)']);
            const maxRecirc = parseFloat(model['Max Recirc (GPM)']);
            const minVolume = parseFloat(model['Min System Volume (Gal)']);
            const maxVolume = parseFloat(model['Max System Volume (Gal)']);

            let isMatch = false;

            if (modelSystem === systemType) {
                if (inputType === 'recirc' && systemType === 'open') {
                    if (!isNaN(minRecirc) && !isNaN(maxRecirc) && value >= minRecirc && value <= maxRecirc) {
                        isMatch = true;
                    }
                } else if (inputType === 'volume') { // Applies to both 'open' (if volume chosen) and 'closed'
                    if (!isNaN(minVolume) && !isNaN(maxVolume) && value >= minVolume && value <= maxVolume) {
                        isMatch = true;
                    }
                }
            }

            if (isMatch) {
                const kw = !isNaN(hp) ? hp * 0.7457 : 0; // Convert HP to kW, default to 0 if HP is not a number
                const annualHours = 8760; // Hours in a year
                const annualElectricalCost = kw * annualHours * electricalCost;

                const modelData = {
                    model: modelName || 'N/A',
                    flowrate: !isNaN(flowrateGPM) ? flowrateGPM : 'N/A',
                    description: description || 'No description available.',
                    annualElectricalCost: annualElectricalCost.toFixed(2)
                };

                if (modelType === 'separator' && !matchedModels.separator) {
                    matchedModels.separator = modelData;
                } else if (modelType === 'vaf' && !matchedModels.vaf) {
                    matchedModels.vaf = modelData;
                } else if (modelType === 'vortisand' && !matchedModels.vortisand) {
                    matchedModels.vortisand = modelData;
                }
                // This logic takes the FIRST match. Refine if multiple models of the same type match.
            }
        });
        console.log("Matched models:", matchedModels);
        return matchedModels;
    }

    function displayResults(results) {
        const updateColumn = (type, data) => {
            document.getElementById(`${type}Model`).textContent = data ? data.model : 'N/A';
            document.getElementById(`${type}Flowrate`).textContent = data ? data.flowrate : 'N/A';
            document.getElementById(`${type}Description`).textContent = data ? data.description : 'No matching model found.';
            document.getElementById(`${type}AnnualCost`).textContent = data ? data.annualElectricalCost : 'N/A';
        };

        updateColumn('separator', results.separator);
        updateColumn('vaf', results.vaf);
        updateColumn('vortisand', results.vortisand);
    }

    // Initial setup
    fetchData(); // Load data from Google Sheet on page load
});