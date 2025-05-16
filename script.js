document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed"); // Debug: Check if script starts

    const openSystemRadio = document.getElementById('openSystem');
    const closedSystemRadio = document.getElementById('closedSystem');

    const conditionalPromptsDiv = document.getElementById('conditionalPrompts');
    const openInputsSection = document.getElementById('openInputsSection');
    const closedInputsSection = document.getElementById('closedInputsSection');
    const electricalCostSection = document.getElementById('electricalCostSection');
    const calculateButton = document.getElementById('calculateButton');

    const outputSection = document.getElementById('outputSection');
    const outputSeparator = document.getElementById('outputSeparator');

    // --- Check if main elements are found ---
    if (!openSystemRadio) console.error("Error: openSystemRadio not found!");
    if (!closedSystemRadio) console.error("Error: closedSystemRadio not found!");
    if (!conditionalPromptsDiv) console.error("Error: conditionalPromptsDiv not found!");
    if (!openInputsSection) console.error("Error: openInputsSection not found!");
    if (!closedInputsSection) console.error("Error: closedInputsSection not found!");
    if (!electricalCostSection) console.error("Error: electricalCostSection not found!");


    // --- Google Sheet Configuration ---
    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';
    let database = [];

    async function fetchData() {
        console.log("fetchData called"); // Debug
        try {
            const response = await fetch(SPREADSHEET_URL);
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}. URL: ${SPREADSHEET_URL}`);
                throw new Error(`HTTP error! status: ${response.status}. Check SPREADSHEET_URL and ensure sheet is published.`);
            }
            const csvText = await response.text();
            database = parseCSV(csvText);
            if (database.length === 0) {
                console.warn("Database loaded but is empty. Check CSV format and content.");
                // alert("Database is empty or could not be parsed correctly. Please check the console and the Google Sheet."); // Potentially too intrusive early
            } else {
                console.log("Database loaded:", database.length, "entries.");
            }
        } catch (error) {
            console.error("Error fetching or parsing spreadsheet data:", error);
            alert("Could not load the database. Please check the console for errors, ensure the Google Sheet is published correctly as a CSV, and the URL is correct.");
        }
    }

function parseCSV(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) {
        console.warn("CSV data has less than 2 lines (no data or only headers).");
        return [];
    }
    // THIS IS THE LINE WHERE HEADERS ARE DETERMINED:
    const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));

    console.log("[parseCSV] Detected CSV Headers from Sheet:", headers); // <-- ADD THIS LINE

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        // A more robust way to split CSV lines, especially if some fields might be quoted and contain commas
        // This is a basic version; for truly complex CSVs, a library might be better
        const values = lines[i].split(',').map(value => {
            let V = value.trim();
            // Remove quotes only if they are at the very start and end
            if (V.startsWith('"') && V.endsWith('"')) {
                V = V.substring(1, V.length - 1);
            }
            return V.replace(/""/g, '"'); // Handle escaped quotes within quoted fields
        });

        if (values.length === headers.length) {
            const entry = {};
            headers.forEach((header, index) => {
                entry[header] = values[index]; // Property names on 'entry' will be exactly what's in 'headers'
            });
            data.push(entry);
        } else {
            console.warn(`[parseCSV] Row ${i+1} (data line ${i}) has incorrect column count. Expected ${headers.length}, got <span class="math-inline">\{values\.length\}\. Line\: "</span>{lines[i]}"`);
        }
    }
    return data;
}

    function handleSystemTypeChange() {
        console.log("handleSystemTypeChange called"); // Debug: Check if function is triggered
        console.log("Open radio checked:", openSystemRadio.checked);
        console.log("Closed radio checked:", closedSystemRadio.checked);

        // Always hide these first to reset the state before showing the relevant ones
        outputSection.style.display = 'none';
        outputSeparator.style.display = 'none';

        // Also ensure child sections are explicitly hidden before parent is potentially shown
        openInputsSection.style.display = 'none';
        closedInputsSection.style.display = 'none';
        electricalCostSection.style.display = 'none'; // Ensure this is reset too

        if (openSystemRadio.checked) {
            console.log("Open system selected. Showing relevant sections.");
            conditionalPromptsDiv.style.display = 'block';
            openInputsSection.style.display = 'block';
            // closedInputsSection is already set to 'none'
            electricalCostSection.style.display = 'block';
        } else if (closedSystemRadio.checked) {
            console.log("Closed system selected. Showing relevant sections.");
            conditionalPromptsDiv.style.display = 'block';
            // openInputsSection is already set to 'none'
            closedInputsSection.style.display = 'block';
            electricalCostSection.style.display = 'block';
        } else {
            console.log("No system type selected (this state should ideally not be reached if a radio was just clicked). Hiding conditional prompts.");
            conditionalPromptsDiv.style.display = 'none';
        }
        // Log the display state of key elements AFTER attempting to change them
        console.log("conditionalPromptsDiv display:", conditionalPromptsDiv.style.display);
        console.log("openInputsSection display:", openInputsSection.style.display);
        console.log("closedInputsSection display:", closedInputsSection.style.display);
        console.log("electricalCostSection display:", electricalCostSection.style.display);
    }

    // Event listeners for system type change
    // Ensure radio buttons exist before adding listeners
    if (openSystemRadio && closedSystemRadio) {
        openSystemRadio.addEventListener('change', handleSystemTypeChange);
        closedSystemRadio.addEventListener('change', handleSystemTypeChange);
        console.log("Event listeners attached to radio buttons."); // Debug
    } else {
        console.error("Could not attach event listeners: radio button element(s) not found.");
    }

    // Event listener for the calculate button (calculateButton related consts are defined above)
    // Ensure calculateButton exists
    const recircRateInput = document.getElementById('recircRate');
    const openSystemVolumeInput = document.getElementById('openSystemVolume');
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const electricalCostInput = document.getElementById('electricalCost');

    if (calculateButton) {
        calculateButton.addEventListener('click', () => {
            console.log("Calculate button clicked"); // Debug
            // ... (rest of calculate button logic remains the same as previously provided)
            if (database.length === 0) {
                alert("Database is not loaded yet or is empty. Please wait or try refreshing. Check console for errors.");
                return;
            }

            const systemType = openSystemRadio.checked ? 'open' : (closedSystemRadio.checked ? 'closed' : null);
            if (!systemType) {
                alert("Please select a system type (Open or Closed).");
                return;
            }

            const electricalCostVal = parseFloat(electricalCostInput.value);
            if (isNaN(electricalCostVal) || electricalCostVal < 0) {
                alert("Please enter a valid electrical cost (e.g., 0.10).");
                return;
            }

            let inputValue;
            let inputType;

            if (systemType === 'open') {
                const recircRate = parseFloat(recircRateInput.value);
                const openVolume = parseFloat(openSystemVolumeInput.value);

                if (!isNaN(recircRate) && recircRate > 0) {
                    inputValue = recircRate;
                    inputType = 'recirc';
                    if(openSystemVolumeInput) openSystemVolumeInput.value = '';
                } else if (!isNaN(openVolume) && openVolume > 0) {
                    inputValue = openVolume;
                    inputType = 'volume';
                    if(recircRateInput) recircRateInput.value = '';
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

            const results = findMatchingModels(systemType, inputType, inputValue, electricalCostVal);
            displayResults(results);
            if(outputSeparator) outputSeparator.style.display = 'block';
            if(outputSection) {
                outputSection.style.display = 'block';
                outputSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        console.log("Event listener attached to calculate button."); // Debug
    } else {
        console.error("Could not attach event listener: calculateButton not found.");
    }


function findMatchingModels(systemType, inputType, value, electricalCost) {
    const matchedModels = {
        separator: null,
        vaf: null,
        vortisand: null
    };

    console.log(`[findMatchingModels] Searching for: System=${systemType}, InputType=${inputType}, UserValue=${value}, ElecCost=${electricalCost}`);
    console.log(`[findMatchingModels] Total database entries: ${database.length}`);

    database.forEach((model, index) => {
        const modelName = model['Model']?.trim(); // Get model name early for logging
        console.log(`\n[findMatchingModels] --- Entry ${index + 1} / ${database.length}: Model Name = ${modelName} ---`);

        const modelTypeRaw = model['Type']; // Raw value from sheet
        const modelSystemRaw = model['System']; // Raw value from sheet

        const modelType = modelTypeRaw?.trim().toLowerCase();
        const modelSystem = modelSystemRaw?.trim().toLowerCase();

        // Log raw and parsed Type/System for debugging potential trimming/casing issues from sheet
        console.log(`[findMatchingModels]   Raw Sheet Data: Type='${modelTypeRaw}', System='${modelSystemRaw}'`);
        console.log(`[findMatchingModels]   Parsed Values:  Type='${modelType}', System='${modelSystem}'`);

        const parseNumericValue = (str) => {
            // Explicitly return NaN for empty strings, null, or undefined after trimming
            if (str === undefined || str === null || String(str).trim() === "") {
                return NaN;
            }
            // If it's already a number (though CSV usually gives strings), pass it to parseFloat
            if (typeof str === 'number' && !isNaN(str)) { // Ensure it's not already NaN if it's a number type
                return str;
            }
            // For strings, remove commas and then parse
            if (typeof str === 'string') {
                return parseFloat(str.replace(/,/g, ''));
            }
            return parseFloat(str); // Fallback for other types, likely to be NaN
        };

        // Get raw values from the model object for logging alongside parsed values
        const rawMinRecirc = model['Min Recirc (GPM)'];
        const rawMaxRecirc = model['Max Recirc (GPM)'];
        const rawMinVolume = model['Min System Volume (Gal)'];
        const rawMaxVolume = model['Max System Volume (Gal)'];
        const rawHP = model['HP'];
        const rawFlowrate = model['Flowrate (GPM)'];


        const minRecirc = parseNumericValue(rawMinRecirc);
        const maxRecirc = parseNumericValue(rawMaxRecirc);
        const minVolume = parseNumericValue(rawMinVolume);
        const maxVolume = parseNumericValue(rawMaxVolume);
        const hp = parseNumericValue(rawHP);
        const flowrateGPM = parseNumericValue(rawFlowrate); // For output

        console.log(`[findMatchingModels]   Numeric Values for ${modelName} (Parsed vs Raw from Sheet):`);
        console.log(`     MinRecirc: ${minRecirc} (Raw: '${rawMinRecirc}')`);
        console.log(`     MaxRecirc: ${maxRecirc} (Raw: '${rawMaxRecirc}')`);
        console.log(`     MinVolume: ${minVolume} (Raw: '${rawMinVolume}')`);
        console.log(`     MaxVolume: ${maxVolume} (Raw: '${rawMaxVolume}')`);
        console.log(`     HP: ${hp} (Raw: '${rawHP}')`);
        console.log(`     Flowrate: ${flowrateGPM} (Raw: '${rawFlowrate}')`);

        let isMatch = false;

        if (modelSystem !== systemType) {
            console.log(`[findMatchingModels]   System type mismatch: Model is '${modelSystem}', user selected '${systemType}'. Skipping this model.`);
            return; // Acts like 'continue' in forEach: skips to the next model
        }
        console.log(`[findMatchingModels]   System type match: ModelSystem='${modelSystem}' and UserSystem='${systemType}'. Proceeding to value check.`);

        if (inputType === 'recirc') {
            console.log(`[findMatchingModels]   Checking RECIRC: UserValue=${value} against ModelRange=[${minRecirc} - ${maxRecirc}]`);
            if (isNaN(minRecirc) || isNaN(maxRecirc)) {
                console.log(`[findMatchingModels]     WARN: Recirc range for ${modelName} has NaN value(s). Cannot compare.`);
            } else if (value >= minRecirc && value <= maxRecirc) {
                isMatch = true;
                console.log(`[findMatchingModels]     !!! RECIRC MATCH on ${modelName} !!!`);
            } else {
                console.log(`[findMatchingModels]     Recirc no match: ${value} is NOT within [${minRecirc} - ${maxRecirc}]`);
            }
        } else if (inputType === 'volume') {
            console.log(`[findMatchingModels]   Checking VOLUME: UserValue=${value} against ModelRange=[${minVolume} - ${maxVolume}]`);
            if (isNaN(minVolume) || isNaN(maxVolume)) {
                console.log(`[findMatchingModels]     WARN: Volume range for ${modelName} has NaN value(s). Cannot compare.`);
            } else if (value >= minVolume && value <= maxVolume) {
                isMatch = true;
                console.log(`[findMatchingModels]     !!! VOLUME MATCH on ${modelName} !!!`);
            } else {
                console.log(`[findMatchingModels]     Volume no match: ${value} is NOT within [${minVolume} - ${maxVolume}]`);
            }
        }

        if (isMatch) {
            const description = model['Description']?.trim();
            // const flowrateGPM is already parsed above
            const kw = !isNaN(hp) ? hp * 0.7457 : 0;
            const annualHours = 8760;
            const annualElectricalCost = kw * annualHours * electricalCost;

            const modelData = {
                model: modelName || 'N/A',
                flowrate: !isNaN(flowrateGPM) ? flowrateGPM : 'N/A',
                description: description || 'No description available.',
                annualElectricalCost: annualElectricalCost.toFixed(2)
            };

            // Logic to assign only one model of each type (takes the first match encountered)
            if (modelType === 'separator' && !matchedModels.separator) {
                matchedModels.separator = modelData;
                console.log(`[findMatchingModels]     --> Assigned ${modelName} to SEPARATOR output.`);
            } else if (modelType === 'vaf' && !matchedModels.vaf) {
                matchedModels.vaf = modelData;
                console.log(`[findMatchingModels]     --> Assigned ${modelName} to VAF output.`);
            } else if (modelType === 'vortisand' && !matchedModels.vortisand) {
                matchedModels.vortisand = modelData;
                console.log(`[findMatchingModels]     --> Assigned ${modelName} to VORTISAND output.`);
            } else if (isMatch) { // If it was a match but the slot for its type was already taken
                console.log(`[findMatchingModels]     --> Match for ${modelName} (type: ${modelType}), but a model for this type was already found.`);
            }
        }
    });

    console.log("\n[findMatchingModels] Final Matched models after loop:", matchedModels);
    return matchedModels;
}

    function displayResults(results) {
        // ... (displayResults function remains the same)
        console.log("Displaying results:", results); // Debug
        const updateColumn = (type, data) => {
            const modelEl = document.getElementById(`${type}Model`);
            const flowrateEl = document.getElementById(`${type}Flowrate`);
            const descriptionEl = document.getElementById(`${type}Description`);
            const annualCostEl = document.getElementById(`${type}AnnualCost`);

            if (modelEl) modelEl.textContent = data ? data.model : 'N/A';
            if (flowrateEl) flowrateEl.textContent = data ? data.flowrate : 'N/A';
            if (descriptionEl) descriptionEl.textContent = data ? data.description : 'No matching model found.';
            if (annualCostEl) annualCostEl.textContent = data ? data.annualElectricalCost : 'N/A';
        };
        updateColumn('separator', results.separator);
        updateColumn('vaf', results.vaf);
        updateColumn('vortisand', results.vortisand);
    }

    // Initial setup
    fetchData(); // Load data from Google Sheet on page load
});