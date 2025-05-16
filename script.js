document.addEventListener('DOMContentLoaded', () => {
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

    document.getElementById('current-year').textContent = new Date().getFullYear();

    function updateSectionVisibility() {
        resultsSection.classList.add('hidden'); // Always hide results on selection change
        if (openSystemRadio.checked) {
            openSystemInputsSection.classList.remove('hidden');
            closedSystemInputsSection.classList.add('hidden');
            commonInputsSection.classList.remove('hidden');
        } else if (closedSystemRadio.checked) {
            closedSystemInputsSection.classList.remove('hidden');
            openSystemInputsSection.classList.add('hidden');
            commonInputsSection.classList.remove('hidden');
        } else { // No radio button selected
            openSystemInputsSection.classList.add('hidden');
            closedSystemInputsSection.classList.add('hidden');
            commonInputsSection.classList.add('hidden');
        }
    }

    openSystemRadio.addEventListener('change', updateSectionVisibility);
    closedSystemRadio.addEventListener('change', updateSectionVisibility);

    // --- Updated Google Sheet URL ---
    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';

    let dbData = [];

    async function fetchData() {
        // Removed the check for placeholder URL as it's now set.
        try {
            const response = await fetch(SPREADSHEET_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, URL: ${SPREADSHEET_URL}`);
            }
            const csvText = await response.text();
            dbData = parseCSV(csvText);
            if (dbData.length === 0) { // Check if only headers or no data
                console.warn('Database is empty or only contains headers. Check CSV format and content.');
                // You might want to alert the user here if the database is critical for operation and it's empty.
                // alert("Warning: Database is empty. Please check the spreadsheet content.");
            }
        } catch (error) {
            console.error('Error fetching or parsing spreadsheet data:', error);
            alert(`Failed to load data from the spreadsheet. Error: ${error.message}. Check the console for more details and ensure the Google Sheet is published to the web as a CSV and the URL is correct.`);
            calculateButton.disabled = true;
            calculateButton.textContent = "Data Load Failed";
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
            console.warn("CSV data has less than 2 lines (header + data).");
            return []; // Need at least one header and one data line
        }

        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    const value = values[index] ? values[index].trim() : '';
                    // Convert to number if it's a numeric field based on header names, otherwise keep as string
                    // Added more robust checking for numeric conversion
                    if (['Recirc Min', 'Recirc Max', 'Tonnage Min', 'Tonnage Max', 'Loop Min', 'Loop Max',
                         'SEP Flowrate (GPM)', 'VAF Flowrate (GPM)', 'Vortisand Flowrate (GPM)',
                         'SEP HP', 'VAF HP', 'Vortisand HP',
                         'SEP Hours/Year', 'VAF Hours/Year', 'Vortisand Hours/Year'].includes(header)) {
                        row[header] = (value === '' || isNaN(parseFloat(value))) ? null : parseFloat(value);
                    } else {
                        row[header] = value;
                    }
                });
                data.push(row);
            } else {
                console.warn(`Skipping malformed CSV line ${i + 1} (incorrect number of columns): ${lines[i]}`);
            }
        }
        return data;
    }

    calculateButton.addEventListener('click', () => {
        if (dbData.length === 0) {
            alert("Data is not loaded or is empty. Cannot perform calculation. Please check the Google Sheet or refresh the page.");
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

        if (openSystemRadio.checked) {
            const recircRate = parseFloat(recircRateInput.value);
            const tonnage = parseFloat(openSystemTonnageInput.value);

            if ((isNaN(recircRate) || recircRate <= 0) && (isNaN(tonnage) || tonnage <= 0)) {
                alert('For Open Systems, please enter a positive Recirc Rate or a positive System Tonnage.');
                if (isNaN(recircRate) || recircRate <= 0) recircRateInput.focus();
                else openSystemTonnageInput.focus();
                return;
            }

            for (const row of dbData) {
                let matches = false;
                // Ensure row values are numbers before comparison
                const rowRecircMin = parseFloat(row['Recirc Min']);
                const rowRecircMax = parseFloat(row['Recirc Max']);
                const rowTonnageMin = parseFloat(row['Tonnage Min']);
                const rowTonnageMax = parseFloat(row['Tonnage Max']);

                if (!isNaN(recircRate) && recircRate > 0) {
                    if (!isNaN(rowRecircMin) && !isNaN(rowRecircMax) &&
                        recircRate >= rowRecircMin && recircRate <= rowRecircMax) {
                        matches = true;
                    }
                } else if (!isNaN(tonnage) && tonnage > 0) { // Note: "else if" means Tonnage is only checked if Recirc Rate is not primary
                    if (!isNaN(rowTonnageMin) && !isNaN(rowTonnageMax) &&
                        tonnage >= rowTonnageMin && tonnage <= rowTonnageMax) {
                        matches = true;
                    }
                }

                if (matches) {
                    if (row['SEP Model'] && !foundSeparator) foundSeparator = row;
                    if (row['VAF Model'] && !foundVAF) foundVAF = row;
                    if (row['Vortisand Model'] && !foundVortisand) foundVortisand = row;
                }
            }
        } else if (closedSystemRadio.checked) {
            const systemVolume = parseFloat(closedSystemVolumeInput.value);
            if (isNaN(systemVolume) || systemVolume <= 0) {
                alert('Please enter a valid positive System Volume for Closed Systems.');
                closedSystemVolumeInput.focus();
                return;
            }

            for (const row of dbData) {
                 // Ensure row values are numbers before comparison
                const rowLoopMin = parseFloat(row['Loop Min']);
                const rowLoopMax = parseFloat(row['Loop Max']);

                if (!isNaN(rowLoopMin) && !isNaN(rowLoopMax) &&
                    systemVolume >= rowLoopMin && systemVolume <= rowLoopMax) {
                    if (row['SEP Model'] && !foundSeparator) foundSeparator = row;
                    if (row['VAF Model'] && !foundVAF) foundVAF = row;
                    if (row['Vortisand Model'] && !foundVortisand) foundVortisand = row;
                }
            }
        } else {
            alert('Please select a system type (Open or Closed).');
            return;
        }

        displayResults(foundSeparator, foundVAF, foundVortisand, electricalCost);
        if (foundSeparator || foundVAF || foundVortisand) {
            resultsSection.classList.remove('hidden');
        } else {
            resultsSection.classList.add('hidden'); // Keep results hidden if nothing found
            alert("No matching equipment found for the provided parameters. Please check your input values or the database ranges.");
        }
    });

    function displayResults(separatorData, vafData, vortisandData, elecCost) {
        const updateColumn = (data, type, modelEl, flowEl, descEl, costEl) => {
            if (data && data[`${type} Model`]) {
                modelEl.textContent = data[`${type} Model`] || 'N/A';
                // Ensure flowrate is a number or display N/A
                const flowrateVal = parseFloat(data[`${type} Flowrate (GPM)`]);
                flowEl.textContent = !isNaN(flowrateVal) ? flowrateVal : 'N/A';
                descEl.textContent = data[`${type} Description`] || 'N/A';

                const hp = parseFloat(data[`${type} HP`]);
                const hoursPerYear = parseFloat(data[`${type} Hours/Year`]) || 8760;

                if (!isNaN(hp) && hp > 0 && !isNaN(elecCost) && elecCost >= 0 && !isNaN(hoursPerYear) && hoursPerYear > 0) {
                    const opCost = hp * 0.746 * hoursPerYear * elecCost;
                    costEl.textContent = `$${opCost.toFixed(2)}`;
                } else if (!isNaN(hp) && hp === 0) { // If HP is explicitly 0
                    costEl.textContent = '$0.00';
                }
                else {
                    costEl.textContent = 'N/A';
                }
            } else {
                modelEl.textContent = 'Not Applicable / Found';
                flowEl.textContent = '-';
                descEl.textContent = '-';
                costEl.textContent = '-';
            }
        };

        updateColumn(separatorData, 'SEP', separatorModel, separatorFlowrate, separatorDescription, separatorOpCost);
        updateColumn(vafData, 'VAF', vafModel, vafFlowrate, vafDescription, vafOpCost);
        updateColumn(vortisandData, 'Vortisand', vortisandModel, vortisandFlowrate, vortisandDescription, vortisandOpCost);
    }

    fetchData(); // Initial data load
    updateSectionVisibility(); // Set initial visibility of sections based on no selection
});