document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const openSystemRadio = document.getElementById('open-system');
    const closedSystemRadio = document.getElementById('closed-system');
    const openSystemInputsSection = document.getElementById('open-system-inputs');
    const closedSystemInputsSection = document.getElementById('closed-system-inputs');
    const commonInputsSection = document.getElementById('common-inputs');
    const resultsSection = document.getElementById('results');
    const calculateButton = document.getElementById('calculate-button');

    const recircRateInput = document.getElementById('recirc-rate');
    const openSystemTonnageInput = document.getElementById('open-system-tonnage');
    const closedSystemVolumeInput = document.getElementById('closed-system-volume');
    const electricalCostInput = document.getElementById('electrical-cost');

    // Result display elements
    const separatorModel = document.getElementById('separator-model');
    const separatorFlowrate = document.getElementById('separator-flowrate');
    const separatorDescription = document.getElementById('separator-description');
    const separatorOpCost = document.getElementById('separator-op-cost');

    const vafModel = document.getElementById('vaf-model');
    const vafFlowrate = document.getElementById('vaf-flowrate');
    const vafDescription = document.getElementById('vaf-description');
    const vafOpCost = document.getElementById('vaf-op-cost');

    const vortisandModel = document.getElementById('vortisand-model');
    const vortisandFlowrate = document.getElementById('vortisand-flowrate');
    const vortisandDescription = document.getElementById('vortisand-description');
    const vortisandOpCost = document.getElementById('vortisand-op-cost');

    // Set current year in the footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    /**
     * Updates the visibility of input sections based on the selected system type.
     * Hides or shows input fields relevant to "Open" or "Closed" systems.
     */
    function updateSectionVisibility() {
        resultsSection.classList.add('hidden'); // Always hide results when system type changes
        if (openSystemRadio.checked) {
            openSystemInputsSection.classList.remove('hidden');
            closedSystemInputsSection.classList.add('hidden');
            commonInputsSection.classList.remove('hidden');
        } else if (closedSystemRadio.checked) {
            closedSystemInputsSection.classList.remove('hidden');
            openSystemInputsSection.classList.add('hidden');
            commonInputsSection.classList.remove('hidden');
        } else { // No radio button selected (initial state)
            openSystemInputsSection.classList.add('hidden');
            closedSystemInputsSection.classList.add('hidden');
            commonInputsSection.classList.add('hidden');
        }
    }

    // Add event listeners to radio buttons to trigger visibility updates
    openSystemRadio.addEventListener('change', updateSectionVisibility);
    closedSystemRadio.addEventListener('change', updateSectionVisibility);

    // --- Google Sheet URL ---
    // This URL points to the published CSV data from the Google Sheet.
    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';

    let dbData = []; // Array to store the parsed data from the spreadsheet

    /**
     * Asynchronously fetches data from the Google Sheet URL and parses it.
     * Handles potential errors during fetching or parsing.
     */
    async function fetchData() {
        try {
            const response = await fetch(SPREADSHEET_URL);
            if (!response.ok) {
                // If the HTTP response is not 'ok' (e.g., 404, 500), throw an error
                throw new Error(`HTTP error! status: ${response.status}, URL: ${SPREADSHEET_URL}`);
            }
            const csvText = await response.text(); // Get the CSV data as text
            dbData = parseCSV(csvText); // Parse the CSV text into structured data

            if (dbData.length === 0) {
                console.warn('Database is empty or only contains headers. Check CSV format and content.');
                // Optionally, alert the user if the database is critical and empty
                // alert("Warning: The equipment database is currently empty or could not be loaded. Please check the spreadsheet.");
            }
        } catch (error) {
            console.error('Error fetching or parsing spreadsheet data:', error);
            alert(`Failed to load data from the spreadsheet. Error: ${error.message}. Please check the console for more details, ensure the Google Sheet is published to the web as a CSV, and the URL is correct.`);
            calculateButton.disabled = true; // Disable the calculate button if data load fails
            calculateButton.textContent = "Data Load Failed";
        }
    }

    /**
     * Parses CSV text into an array of objects.
     * Each object represents a row, with keys corresponding to CSV headers.
     * @param {string} csvText - The CSV data as a string.
     * @returns {Array<Object>} An array of objects representing the CSV data.
     */
    function parseCSV(csvText) {
        // Split CSV text into lines, filtering out any empty lines
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) { // Check for at least a header row and one data row
            console.warn("CSV data has less than 2 lines (expected header + data).");
            return [];
        }

        // Extract headers from the first line, trimming whitespace
        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        // Process each subsequent line as a data row
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            // Ensure the row has at least as many columns as there are headers
            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    const value = values[index] ? values[index].trim() : '';
                    // Define which column headers should be treated as numeric
                    const numericHeaders = [
                        'Recirc Min', 'Recirc Max', 'Tonnage Min', 'Tonnage Max', 'Loop Min', 'Loop Max',
                        'SEP Flowrate (GPM)', 'VAF Flowrate (GPM)', 'Vortisand Flowrate (GPM)',
                        'SEP HP', 'VAF HP', 'Vortisand HP',
                        'SEP Hours/Year', 'VAF Hours/Year', 'Vortisand Hours/Year'
                    ];
                    if (numericHeaders.includes(header)) {
                        // Convert to float; store as null if empty or not a valid number
                        row[header] = (value === '' || isNaN(parseFloat(value))) ? null : parseFloat(value);
                    } else {
                        row[header] = value; // Store as string for non-numeric columns
                    }
                });
                data.push(row);
            } else {
                console.warn(`Skipping malformed CSV line ${i + 1} (incorrect number of columns): ${lines[i]}`);
            }
        }
        return data;
    }

    /**
     * Handles the calculation logic when the "Calculate Selection" button is clicked.
     * Validates inputs, searches the database, and triggers result display.
     */
    calculateButton.addEventListener('click', () => {
        if (dbData.length === 0) {
            alert("Equipment data is not loaded or is empty. Cannot perform calculation. Please check the Google Sheet or refresh the page.");
            return;
        }

        const electricalCost = parseFloat(electricalCostInput.value);
        if (isNaN(electricalCost) || electricalCost < 0) {
            alert('Please enter a valid (non-negative) Electrical Cost.');
            electricalCostInput.focus();
            return;
        }

        let foundSeparator = null;
        let foundVAF = null;
        let foundVortisand = null;

        // Logic for Open Systems
        if (openSystemRadio.checked) {
            const recircRate = parseFloat(recircRateInput.value);
            const tonnage = parseFloat(openSystemTonnageInput.value);

            // Validate inputs for Open Systems: at least one must be a positive number
            if ((isNaN(recircRate) || recircRate <= 0) && (isNaN(tonnage) || tonnage <= 0)) {
                alert('For Open Systems, please enter a positive Recirc Rate or a positive System Tonnage.');
                if (isNaN(recircRate) || recircRate <= 0) recircRateInput.focus();
                else openSystemTonnageInput.focus();
                return;
            }

            // Iterate through the database to find matching equipment
            for (const row of dbData) {
                let matches = false; // Initialize matches to false for each row
                const rowRecircMin = row['Recirc Min']; // Already parsed as float or null
                const rowRecircMax = row['Recirc Max'];
                const rowTonnageMin = row['Tonnage Min'];
                const rowTonnageMax = row['Tonnage Max'];

                // Check Recirc Rate condition if Recirc Rate input is valid
                if (!isNaN(recircRate) && recircRate > 0) {
                    if (rowRecircMin !== null && rowRecircMax !== null &&
                        recircRate >= rowRecircMin && recircRate <= rowRecircMax) {
                        matches = true;
                    }
                }

                // Check Tonnage condition if Tonnage input is valid
                // This 'if' is separate from the Recirc Rate 'if' to implement OR logic
                if (!isNaN(tonnage) && tonnage > 0) {
                    if (rowTonnageMin !== null && rowTonnageMax !== null &&
                        tonnage >= rowTonnageMin && tonnage <= rowTonnageMax) {
                        matches = true; // If tonnage matches, set matches to true, regardless of recirc outcome
                    }
                }

                if (matches) {
                    // Assign equipment if a match is found for the row based on EITHER Recirc OR Tonnage
                    // It will take the first matching row for each equipment type.
                    if (row['SEP Model'] && !foundSeparator) foundSeparator = row;
                    if (row['VAF Model'] && !foundVAF) foundVAF = row;
                    if (row['Vortisand Model'] && !foundVortisand) foundVortisand = row;
                }
            }
        }
        // Logic for Closed Systems
        else if (closedSystemRadio.checked) {
            const systemVolume = parseFloat(closedSystemVolumeInput.value);
            if (isNaN(systemVolume) || systemVolume <= 0) {
                alert('Please enter a valid positive System Volume for Closed Systems.');
                closedSystemVolumeInput.focus();
                return;
            }

            for (const row of dbData) {
                const rowLoopMin = row['Loop Min']; // Already parsed as float or null
                const rowLoopMax = row['Loop Max'];

                if (rowLoopMin !== null && rowLoopMax !== null &&
                    systemVolume >= rowLoopMin && systemVolume <= rowLoopMax) {
                    // For closed systems, a single condition match is enough for the row
                    if (row['SEP Model'] && !foundSeparator) foundSeparator = row;
                    if (row['VAF Model'] && !foundVAF) foundVAF = row;
                    if (row['Vortisand Model'] && !foundVortisand) foundVortisand = row;
                }
            }
        } else {
            alert('Please select a system type (Open or Closed).');
            return;
        }

        // Display the results or a message if no equipment is found
        displayResults(foundSeparator, foundVAF, foundVortisand, electricalCost);
        if (foundSeparator || foundVAF || foundVortisand) {
            resultsSection.classList.remove('hidden'); // Show results section
        } else {
            resultsSection.classList.add('hidden'); // Keep results section hidden
            alert("No matching equipment found for the provided parameters. Please check your input values or the database ranges.");
        }
    });

    /**
     * Displays the selected equipment data in the results section of the HTML.
     * Calculates and displays operating costs.
     * @param {Object|null} separatorData - Data for the selected separator, or null if none found.
     * @param {Object|null} vafData - Data for the selected VAF, or null if none found.
     * @param {Object|null} vortisandData - Data for the selected Vortisand, or null if none found.
     * @param {number} elecCost - The electrical cost in $/kWh.
     */
    function displayResults(separatorData, vafData, vortisandData, elecCost) {
        // Helper function to update a single equipment column in the results table
        const updateColumn = (data, type, modelEl, flowEl, descEl, costEl) => {
            if (data && data[`${type} Model`]) { // Check if data exists for this type and a model name is present
                modelEl.textContent = data[`${type} Model`] || 'N/A';

                const flowrateVal = data[`${type} Flowrate (GPM)`]; // Already parsed as float or null
                flowEl.textContent = (flowrateVal !== null && !isNaN(flowrateVal)) ? flowrateVal : 'N/A';

                descEl.textContent = data[`${type} Description`] || 'N/A';

                const hp = data[`${type} HP`]; // Already parsed as float or null
                const hoursPerYear = data[`${type} Hours/Year`] || 8760; // Default to 8760 hours if null or invalid

                // Calculate operating cost if HP and other parameters are valid
                if (hp !== null && !isNaN(hp) && hp > 0 &&
                    !isNaN(elecCost) && elecCost >= 0 &&
                    hoursPerYear !== null && !isNaN(hoursPerYear) && hoursPerYear > 0) {
                    const opCost = hp * 0.746 * hoursPerYear * elecCost; // 0.746 kW/HP
                    costEl.textContent = `$${opCost.toFixed(2)}`;
                } else if (hp === 0) { // If HP is explicitly 0, cost is $0.00
                    costEl.textContent = '$0.00';
                } else {
                    // If HP is missing, invalid, or other cost components are invalid
                    costEl.textContent = 'N/A';
                }
            } else { // No data found or no model specified for this equipment type
                modelEl.textContent = 'Not Applicable / Found';
                flowEl.textContent = '-';
                descEl.textContent = '-';
                costEl.textContent = '-';
            }
        };

        // Update each equipment column in the results display
        updateColumn(separatorData, 'SEP', separatorModel, separatorFlowrate, separatorDescription, separatorOpCost);
        updateColumn(vafData, 'VAF', vafModel, vafFlowrate, vafDescription, vafOpCost);
        updateColumn(vortisandData, 'Vortisand', vortisandModel, vortisandFlowrate, vortisandDescription, vortisandOpCost);
    }

    // Initial actions on page load:
    fetchData(); // Load data from the spreadsheet when the DOM is ready
    updateSectionVisibility(); // Set initial visibility of input sections based on no selection
});
