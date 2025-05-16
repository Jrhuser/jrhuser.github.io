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
    // MODIFIED findMatchingModels fromjayjhill
    // =================================================================================
function findMatchingModels(systemType, inputType, value, electricalCost) {
    const matchedModels = {
        separator: null,
        vaf: null,
        vortisand: null
    };

    console.log(`[findMatchingModels] Adapted from JayHill Logic. UserSelectedSystem=${systemType}, UserInputType=${inputType}, UserValue=${value}`);
    console.log(`[findMatchingModels] Total database entries: ${database.length}`);

    let potentialFilters = []; // To hold all models that meet the criteria before picking one of each type

    database.forEach((model, index) => {
        const modelName = model['Model']?.trim();
        // console.log(`\n[findMatchingModels] --- Entry ${index + 1}: Model Name = ${modelName} ---`); // Can be verbose

        const modelFilterTypeRaw = model['Filter Type'];
        const modelFilterType = modelFilterTypeRaw?.trim().toLowerCase();

        const parseNumericValue = (str) => {
            if (str === undefined || str === null || String(str).trim() === "") return NaN;
            if (typeof str === 'number' && !isNaN(str)) return str;
            if (typeof str === 'string') return parseFloat(String(str).replace(/,/g, ''));
            return parseFloat(str);
        };

        const minRecirc = parseNumericValue(model['Min Recirc (gallons)']);
        const maxRecirc = parseNumericValue(model['Max Recirc (gallons)']);
        const loopMin = parseNumericValue(model['Loop Min (gallons)']); // Ensure your sheet has this header now
        const loopMax = parseNumericValue(model['Loop Max (gallons)']); // Ensure your sheet has this header now
        const hp = parseNumericValue(model['hp']);
        const flowRate = parseNumericValue(model['Flowrate']); // Using 'Flowrate'
        const description = model['Description']?.trim(); // Assuming 'Description' is now a header

        // Log processed numeric values for a specific model if debugging is needed:
        // if (modelName === 'CTS950') { // Example: Log specific model details
        //     console.log(`[findMatchingModels] Details for ${modelName}: FilterType='${modelFilterType}', MinRecirc=${minRecirc}, MaxRecirc=${maxRecirc}, LoopMin=${loopMin}, LoopMax=${loopMax}, HP=${hp}, FlowRate=${flowRate}`);
        // }

        let isMatch = false;

        if (systemType === 'open') {
            if (inputType === 'recirc') { // User provided "Recirc Rate"
                // console.log(`[findMatchingModels] OPEN/RECIRC: UserValue=${value} vs ModelRange MinRecirc/MaxRecirc=[${minRecirc}-${maxRecirc}] for ${modelName}`);
                if (!isNaN(minRecirc) && !isNaN(maxRecirc) && value >= minRecirc && value <= maxRecirc) {
                    isMatch = true;
                }
            } else if (inputType === 'volume') { // User provided "System Volume" for Open system
                // Assumption: Compare open system volume against Min/Max Recirc (gallons) ranges
                // console.log(`[findMatchingModels] OPEN/VOLUME: UserValue=${value} vs ModelRange MinRecirc/MaxRecirc=[${minRecirc}-${maxRecirc}] for ${modelName} (by assumption)`);
                if (!isNaN(minRecirc) && !isNaN(maxRecirc) && value >= minRecirc && value <= maxRecirc) {
                    isMatch = true;
                }
            }
        } else if (systemType === 'closed') {
            if (inputType === 'volume') { // User provided "System Volume" for Closed system
                if (modelFilterType === 'vortisand') {
                    // console.log(`[findMatchingModels] CLOSED/VOLUME (Vortisand): UserValue=${value} vs ModelRange LoopMin/LoopMax=[${loopMin}-${loopMax}] for ${modelName}`);
                    // Check for NaN explicitly, similar to JayHill's non-null check
                    if (!isNaN(loopMin) && !isNaN(loopMax) && value >= loopMin && value <= loopMax) {
                        isMatch = true;
                    } else if (isNaN(loopMin) || isNaN(loopMax)) {
                         console.log(`[findMatchingModels] WARN: Loop Min/Max is NaN for Vortisand ${modelName}. Cannot compare.`);
                    }
                } else { // For other filter types (Separator, VAF) in a closed system
                    // console.log(`[findMatchingModels] CLOSED/VOLUME (Non-Vortisand): UserValue=${value} vs ModelRange MinRecirc/MaxRecirc=[${minRecirc}-${maxRecirc}] for ${modelName}`);
                    if (!isNaN(minRecirc) && !isNaN(maxRecirc) && value >= minRecirc && value <= maxRecirc) {
                        isMatch = true;
                    }
                }
            }
        }

        if (isMatch) {
            // console.log(`[findMatchingModels] !!! MATCH FOUND for ${modelName} !!!`);
            const kw = !isNaN(hp) ? hp * 0.7457 : 0;
            const annualHours = 8760;
            const annualElectricalCost = kw * annualHours * electricalCost;

            potentialFilters.push({
                modelName: modelName || 'N/A',
                filterType: modelFilterType || 'unknown',
                flowRate: !isNaN(flowRate) ? flowRate : 'N/A',
                description: description || 'N/A',
                annualElectricalCost: annualElectricalCost.toFixed(2),
                hp: !isNaN(hp) ? hp : 'N/A' // Store hp for sorting if needed
            });
        }
    });

    // Select one of each type from potentialFilters
    const filterTypesToSelect = ['separator', 'vaf', 'vortisand'];

    filterTypesToSelect.forEach(type => {
        let candidatesForType = potentialFilters.filter(f => f.filterType === type);
        if (candidatesForType.length > 0) {
            // Sort candidates: JayHill sorts Open by Flow Rate, Closed by HP.
            // We can implement a simple sort here, e.g., by HP for all for now, or flow rate.
            // Or adapt to JayHill's specific sort if systemType is available here.
            // For simplicity, let's sort by HP (ascending) for all matched types for now.
            candidatesForType.sort((a, b) => {
                const hpA = parseFloat(a.hp); // Ensure numeric comparison
                const hpB = parseFloat(b.hp);
                if (isNaN(hpA) && isNaN(hpB)) return 0;
                if (isNaN(hpA)) return 1; // Put NaNs last
                if (isNaN(hpB)) return -1;
                return hpA - hpB;
            });

            const bestCandidate = candidatesForType[0];
            const modelData = {
                model: bestCandidate.modelName,
                flowrate: bestCandidate.flowRate,
                description: bestCandidate.description,
                annualElectricalCost: bestCandidate.annualElectricalCost
            };

            if (type === 'separator') matchedModels.separator = modelData;
            else if (type === 'vaf') matchedModels.vaf = modelData;
            else if (type === 'vortisand') matchedModels.vortisand = modelData;
        }
    });

    console.log("[findMatchingModels] Final Matched models after loop:", matchedModels);
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