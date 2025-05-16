document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    const openSystemRadio = document.getElementById('openSystem');
    const closedSystemRadio = document.getElementById('closedSystem');

    const conditionalPromptsDiv = document.getElementById('conditionalPrompts');
    const openInputsSection = document.getElementById('openInputsSection');
    const closedInputsSection = document.getElementById('closedInputsSection');
    const electricalCostSection = document.getElementById('electricalCostSection');
    const calculateButton = document.getElementById('calculateButton');

    const outputSection = document.getElementById('outputSection');
    const outputSeparator = document.getElementById('outputSeparator');

    if (!openSystemRadio) console.error("Error: openSystemRadio not found!");
    // ... (other element checks can remain)

    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';
    let database = [];

    async function fetchData() {
        console.log("fetchData called");
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
        const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
        console.log("[parseCSV] Detected CSV Headers from Sheet:", headers);

        const data = [];
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            const values = lines[i].split(',').map(value => {
                let V = value.trim();
                if (V.startsWith('"') && V.endsWith('"')) {
                    V = V.substring(1, V.length - 1);
                }
                return V.replace(/""/g, '"');
            });
            
            if (values.length === headers.length) {
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index];
                });
                data.push(entry);
            } else {
                console.warn(`[parseCSV] Row ${i+1} (data line ${i}) has incorrect column count. Expected ${headers.length}, got ${values.length}. Line: "${lines[i]}"`);
            }
        }
        return data;
    }

    function handleSystemTypeChange() {
        // ... (this function remains the same as the last version)
        console.log("handleSystemTypeChange called");
        console.log("Open radio checked:", openSystemRadio.checked);
        console.log("Closed radio checked:", closedSystemRadio.checked);
        outputSection.style.display = 'none';
        outputSeparator.style.display = 'none';
        openInputsSection.style.display = 'none';
        closedInputsSection.style.display = 'none';
        electricalCostSection.style.display = 'none';
        if (openSystemRadio.checked) {
            console.log("Open system selected. Showing relevant sections.");
            conditionalPromptsDiv.style.display = 'block';
            openInputsSection.style.display = 'block';
            electricalCostSection.style.display = 'block';
        } else if (closedSystemRadio.checked) {
            console.log("Closed system selected. Showing relevant sections.");
            conditionalPromptsDiv.style.display = 'block';
            closedInputsSection.style.display = 'block';
            electricalCostSection.style.display = 'block';
        } else {
            conditionalPromptsDiv.style.display = 'none';
        }
        console.log("conditionalPromptsDiv display:", conditionalPromptsDiv.style.display);
        console.log("openInputsSection display:", openInputsSection.style.display);
        console.log("closedInputsSection display:", closedInputsSection.style.display);
        console.log("electricalCostSection display:", electricalCostSection.style.display);
    }

    if (openSystemRadio && closedSystemRadio) {
        openSystemRadio.addEventListener('change', handleSystemTypeChange);
        closedSystemRadio.addEventListener('change', handleSystemTypeChange);
        console.log("Event listeners attached to radio buttons.");
    } else {
        console.error("Could not attach event listeners: radio button element(s) not found.");
    }

    const recircRateInput = document.getElementById('recircRate');
    const openSystemVolumeInput = document.getElementById('openSystemVolume');
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const electricalCostInput = document.getElementById('electricalCost');

    if (calculateButton) {
        calculateButton.addEventListener('click', () => {
            // ... (Calculate button click handler setup is the same)
            // ... (Input validation for systemType, electricalCost is the same)
            // ... (Logic for getting inputValue and inputType from user inputs is the same)
            console.log("Calculate button clicked");
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
            let inputType; // 'recirc' or 'volume'

            if (systemType === 'open') {
                const recircRate = parseFloat(recircRateInput.value);
                const openVolume = parseFloat(openSystemVolumeInput.value);
                if (!isNaN(recircRate) && recircRate > 0) {
                    inputValue = recircRate;
                    inputType = 'recirc';
                    if(openSystemVolumeInput) openSystemVolumeInput.value = '';
                } else if (!isNaN(openVolume) && openVolume > 0) {
                    inputValue = openVolume;
                    inputType = 'volume'; // For open system, using volume input
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
                inputType = 'volume'; // Closed system only has volume input in this design
            }

            const results = findMatchingModels(systemType, inputType, inputValue, electricalCostVal);
            displayResults(results);
            if(outputSeparator) outputSeparator.style.display = 'block';
            if(outputSection) {
                outputSection.style.display = 'block';
                outputSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
        console.log("Event listener attached to calculate button.");
    } else {
        console.error("Could not attach event listener: calculateButton not found.");
    }


    // =================================================================================
    // MODIFIED findMatchingModels for OPTION A
    // =================================================================================
    function findMatchingModels(systemType, inputType, value, electricalCost) {
        const matchedModels = {
            separator: null,
            vaf: null,
            vortisand: null // Assuming these are the 'Filter Type' values you want to separate outputs for
        };

        // CSV Headers from repo:
        // ['Model', 'Filter Type', 'hp', 'Flow Rate', 'Min Recirc (gallons)', 'Max Recirc (gallons)', 
        // 'Tonnage Min', 'Tonnage Max', 'Loop Min', 'Loop Max', 'OPEX']

        console.log(`[findMatchingModels] Option A Logic. Searching for: UserSelectedSystem=${systemType}, UserInputType=${inputType}, UserValue=${value}, ElecCost=${electricalCost}`);
        console.log(`[findMatchingModels] Total database entries: ${database.length}`);

        database.forEach((model, index) => {
            const modelName = model['Model']?.trim();
            console.log(`\n[findMatchingModels] --- Entry ${index + 1} / ${database.length}: Model Name = ${modelName} ---`);

            const modelFilterTypeRaw = model['Filter Type'];
            const modelFilterType = modelFilterTypeRaw?.trim().toLowerCase();

            console.log(`[findMatchingModels]   Raw Sheet Data: FilterType='${modelFilterTypeRaw}'`);
            console.log(`[findMatchingModels]   Parsed Values:  FilterType='${modelFilterType}'`);

            const parseNumericValue = (str) => {
                if (str === undefined || str === null || String(str).trim() === "") return NaN;
                if (typeof str === 'number' && !isNaN(str)) return str;
                if (typeof str === 'string') return parseFloat(String(str).replace(/,/g, ''));
                return parseFloat(str);
            };

            // Get raw values from the model object for logging alongside parsed values
            const rawMinRecirc = model['Min Recirc (gallons)'];
            const rawMaxRecirc = model['Max Recirc (gallons)'];
            const rawLoopMin = model['Loop Min'];
            const rawLoopMax = model['Loop Max'];
            const rawHP = model['hp']; // Using 'hp' from CSV
            const rawFlowRate = model['Flow Rate']; // Using 'Flow Rate' from CSV

            const minRecirc = parseNumericValue(rawMinRecirc);
            const maxRecirc = parseNumericValue(rawMaxRecirc);
            const loopMin = parseNumericValue(rawLoopMin);
            const loopMax = parseNumericValue(rawLoopMax);
            const hp = parseNumericValue(rawHP);
            const flowRate = parseNumericValue(rawFlowRate); // This is model's own flow rate for display

            console.log(`[findMatchingModels]   Numeric Values for ${modelName} (Parsed vs Raw from Sheet):`);
            console.log(`     MinRecirc (gallons): ${minRecirc} (Raw: '${rawMinRecirc}')`);
            console.log(`     MaxRecirc (gallons): ${maxRecirc} (Raw: '${rawMaxRecirc}')`);
            console.log(`     Loop Min: ${loopMin} (Raw: '${rawLoopMin}')`);
            console.log(`     Loop Max: ${loopMax} (Raw: '${rawLoopMax}')`);
            console.log(`     hp: ${hp} (Raw: '${rawHP}')`);
            console.log(`     Flow Rate: ${flowRate} (Raw: '${rawFlowRate}')`);

            let isMatch = false; // Reset for each model

            if (systemType === 'open') {
                console.log(`[findMatchingModels]   User selected 'open' system.`);
                if (inputType === 'recirc') {
                    console.log(`[findMatchingModels]     Checking RECIRC input: UserValue=${value} against ModelRange ('Min/Max Recirc (gallons)')=[${minRecirc} - ${maxRecirc}]`);
                    if (isNaN(minRecirc) || isNaN(maxRecirc)) {
                        console.log(`[findMatchingModels]       WARN: Recirc range for ${modelName} has NaN value(s). Cannot compare.`);
                    } else if (value >= minRecirc && value <= maxRecirc) {
                        isMatch = true;
                        console.log(`[findMatchingModels]       !!! RECIRC MATCH for OPEN system on ${modelName} !!!`);
                    } else {
                        console.log(`[findMatchingModels]       Recirc no match for OPEN system: ${value} is NOT within [${minRecirc} - ${maxRecirc}]`);
                    }
                } else if (inputType === 'volume') { // Open system, volume input
                    console.log(`[findMatchingModels]     Checking VOLUME input for OPEN system: UserValue=${value}.`);
                    console.log(`[findMatchingModels]       ASSUMPTION: Comparing UserValue against ModelRange ('Min/Max Recirc (gallons)')=[${minRecirc} - ${maxRecirc}]`);
                    if (isNaN(minRecirc) || isNaN(maxRecirc)) {
                        console.log(`[findMatchingModels]       WARN: Range for ${modelName} (using Min/Max Recirc) has NaN value(s). Cannot compare.`);
                    } else if (value >= minRecirc && value <= maxRecirc) {
                        isMatch = true;
                        console.log(`[findMatchingModels]       !!! VOLUME MATCH for OPEN system on ${modelName} (using Min/Max Recirc) !!!`);
                    } else {
                        console.log(`[findMatchingModels]       Volume no match for OPEN system: ${value} is NOT within [${minRecirc} - ${maxRecirc}] (using Min/Max Recirc)`);
                    }
                }
            } else if (systemType === 'closed') {
                console.log(`[findMatchingModels]   User selected 'closed' system.`);
                if (inputType === 'volume') { // Closed systems only take volume input in this design
                    console.log(`[findMatchingModels]     Checking VOLUME input for CLOSED system: UserValue=${value} against ModelRange ('Loop Min/Max')=[${loopMin} - ${loopMax}]`);
                    if (isNaN(loopMin) || isNaN(loopMax)) {
                        console.log(`[findMatchingModels]       WARN: Loop range for ${modelName} has NaN value(s). Cannot compare.`);
                    } else if (value >= loopMin && value <= loopMax) {
                        isMatch = true;
                        console.log(`[findMatchingModels]       !!! VOLUME MATCH for CLOSED system on ${modelName} !!!`);
                    } else {
                        console.log(`[findMatchingModels]       Volume no match for CLOSED system: ${value} is NOT within [${loopMin} - ${loopMax}]`);
                    }
                } else {
                     console.log(`[findMatchingModels]     WARN: Closed system selected but inputType is not 'volume' (it's '${inputType}'). No matching logic defined for this combination.`);
                }
            }

            if (isMatch) {
                const description = model['Description']?.trim(); // 'Description' is NOT in the repo's CSV headers. Will be undefined.
                const kw = !isNaN(hp) ? hp * 0.7457 : 0;
                const annualHours = 8760;
                const annualElectricalCost = kw * annualHours * electricalCost;

                const modelData = {
                    model: modelName || 'N/A',
                    flowrate: !isNaN(flowRate) ? flowRate : 'N/A', // Using 'Flow Rate' from CSV
                    description: description || 'N/A (Description column likely missing)',
                    annualElectricalCost: annualElectricalCost.toFixed(2)
                };

                // Assign to output columns based on 'Filter Type'
                // Ensure 'separator', 'vaf', 'vortisand' are lowercase matches for modelFilterType
                if (modelFilterType === 'separator' && !matchedModels.separator) {
                    matchedModels.separator = modelData;
                    console.log(`[findMatchingModels]     --> Assigned ${modelName} to SEPARATOR output.`);
                } else if (modelFilterType === 'vaf' && !matchedModels.vaf) {
                    matchedModels.vaf = modelData;
                    console.log(`[findMatchingModels]     --> Assigned ${modelName} to VAF output.`);
                } else if (modelFilterType === 'vortisand' && !matchedModels.vortisand) {
                    matchedModels.vortisand = modelData;
                    console.log(`[findMatchingModels]     --> Assigned ${modelName} to VORTISAND output.`);
                } else if (isMatch) {
                    console.log(`[findMatchingModels]     --> Match for ${modelName} (FilterType: ${modelFilterType}), but SEPARATOR/VAF/VORTISAND slot for this type was already found or type not recognized for output.`);
                }
            }
        });

        console.log("\n[findMatchingModels] Final Matched models after loop:", matchedModels);
        return matchedModels;
    }
    // =================================================================================

    function displayResults(results) {
        // ... (displayResults function remains the same, it uses the output from findMatchingModels)
        console.log("Displaying results:", results);
        const updateColumn = (type, data) => {
            const modelEl = document.getElementById(`${type}Model`);
            const flowrateEl = document.getElementById(`${type}Flowrate`);
            const descriptionEl = document.getElementById(`${type}Description`);
            const annualCostEl = document.getElementById(`${type}AnnualCost`);

            if (modelEl) modelEl.textContent = data ? data.model : 'N/A';
            if (flowrateEl) flowrateEl.textContent = data ? data.flowrate : 'N/A'; // Will show 'Flow Rate'
            if (descriptionEl) descriptionEl.textContent = data ? data.description : 'No matching model found.'; // Will show N/A if Description col missing
            if (annualCostEl) annualCostEl.textContent = data ? data.annualElectricalCost : 'N/A';
        };
        updateColumn('separator', results.separator);
        updateColumn('vaf', results.vaf);
        updateColumn('vortisand', results.vortisand);
    }

    // Initial setup
    fetchData();
});