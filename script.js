document.addEventListener('DOMContentLoaded', () => {
    const openSystemRadio = document.getElementById('openSystem');
    const closedSystemRadio = document.getElementById('closedSystem');
    const openSystemPrompts = document.getElementById('openSystemPrompts');
    const closedSystemPrompts = document.getElementById('closedSystemPrompts');
    const calculateButton = document.getElementById('calculateButton');
    const resultsArea = document.getElementById('resultsArea');

    const recircRateInput = document.getElementById('recircRate');
    const openSystemTonnageInput = document.getElementById('openSystemTonnage'); // Changed ID
    const openElectricalCostInput = document.getElementById('openElectricalCost');
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const closedElectricalCostInput = document.getElementById('closedElectricalCost');

    // CSV Database URL from your prompt
    const dbUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';
    let database = [];

    // Fetch and parse CSV data using PapaParse
    async function fetchData() {
        try {
            const response = await fetch(dbUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const csvText = await response.text();
            // Papa.parse returns an object with a 'data' array
            const parseResult = Papa.parse(csvText, {
                header: true,        // Uses the first row as header names
                dynamicTyping: true, // Automatically converts numbers and booleans
                skipEmptyLines: true // Skips empty lines
            });
            database = parseResult.data;
            console.log('Database loaded:', database);
            if (parseResult.errors.length > 0) {
                console.warn('CSV parsing errors:', parseResult.errors);
            }
        } catch (error) {
            console.error('Error fetching or parsing database:', error);
            resultsArea.innerHTML = `<p style="color: red;">Error loading database: ${error.message}. Please check the console and ensure the CSV URL is correct and publicly accessible.</p>`;
            resultsArea.classList.remove('hidden');
        }
    }

    fetchData(); // Load data when the page loads

    function validateAndGetElectricalCost(inputElement) {
        const cost = parseFloat(inputElement.value);
        if (isNaN(cost) || cost < 0) { // Allow 0 as a valid cost, though unlikely
            alert('Please enter a valid, non-negative Electrical Cost.');
            inputElement.focus();
            return null;
        }
        return cost;
    }


    function togglePrompts() {
        const openSelected = openSystemRadio.checked;
        const closedSelected = closedSystemRadio.checked;

        openSystemPrompts.classList.toggle('hidden', !openSelected);
        closedSystemPrompts.classList.toggle('hidden', !closedSelected);

        // Enable calculate button only if a system type is selected AND prompts are visible
        if (openSelected || closedSelected) {
            calculateButton.disabled = false;
        } else {
            calculateButton.disabled = true;
        }
        resultsArea.classList.add('hidden'); // Hide results when selection changes
        clearResults(); // Clear out old results
    }

    openSystemRadio.addEventListener('change', togglePrompts);
    closedSystemRadio.addEventListener('change', togglePrompts);

    calculateButton.addEventListener('click', () => {
        if (database.length === 0) {
            alert('Database is not loaded or is empty. Please wait or try refreshing.');
            return;
        }

        resultsArea.classList.remove('hidden');
        clearResults();

        const systemType = openSystemRadio.checked ? 'open' : 'closed';
        let electricalCost = null;
        let selectedSeparator = null;
        let selectedVaf = null;
        let selectedVortisand = null;

        if (systemType === 'open') {
            electricalCost = validateAndGetElectricalCost(openElectricalCostInput);
            if (electricalCost === null) return;

            const recircRate = parseFloat(recircRateInput.value);
            const openTonnageOrVolume = parseFloat(openSystemTonnageInput.value); // Using the combined field

            if (isNaN(recircRate) && isNaN(openTonnageOrVolume)) {
                alert('For Open Systems, please enter either "Recirc Rate" or "Tonnage / System Volume".');
                return;
            }

            // Find matching items
            database.forEach(item => {
                if (item['System Type']?.trim().toLowerCase() !== 'open') return;

                let match = false;
                // Check Recirc Rate condition if input is provided
                if (!isNaN(recircRate) && recircRate >= item['Recirc Rate Min'] && recircRate <= item['Recirc Rate Max']) {
                    match = true;
                }
                // Check Tonnage condition if input is provided (as an OR condition)
                if (!match && !isNaN(openTonnageOrVolume) && openTonnageOrVolume >= item['TONNAGE Min'] && openTonnageOrVolume <= item['TONNAGE Max']) {
                    match = true;
                }

                if (match) {
                    const itemType = item.Type?.trim().toLowerCase();
                    if (itemType === 'separator' && !selectedSeparator) selectedSeparator = item;
                    else if (itemType === 'vaf' && !selectedVaf) selectedVaf = item;
                    else if (itemType === 'vortisand' && !selectedVortisand) selectedVortisand = item;
                }
            });

        } else if (systemType === 'closed') {
            electricalCost = validateAndGetElectricalCost(closedElectricalCostInput);
            if (electricalCost === null) return;

            const systemVolumeClosed = parseFloat(closedSystemVolumeInput.value);

            if (isNaN(systemVolumeClosed) || systemVolumeClosed <= 0) {
                alert('Please enter a valid System Volume for the Closed System.');
                closedSystemVolumeInput.focus();
                return;
            }

            // Find matching items
            database.forEach(item => {
                if (item['System Type']?.trim().toLowerCase() !== 'closed') return;

                if (systemVolumeClosed >= item['Loop Min GPM'] && systemVolumeClosed <= item['Loop Max GPM']) {
                    const itemType = item.Type?.trim().toLowerCase();
                    if (itemType === 'separator' && !selectedSeparator) selectedSeparator = item;
                    else if (itemType === 'vaf' && !selectedVaf) selectedVaf = item;
                    else if (itemType === 'vortisand' && !selectedVortisand) selectedVortisand = item;
                }
            });
        }

        displayResults(selectedSeparator, selectedVaf, selectedVortisand, electricalCost);
    });

    function displayResults(separator, vaf, vortisand, elecCost) {
        const calculateOpCost = (item, cost) => {
            if (!item || item['Electrical Usage (kWh)'] === undefined || item['Electrical Usage (kWh)'] === null || isNaN(parseFloat(item['Electrical Usage (kWh)'])) || cost === null || isNaN(cost)) {
                return 'N/A';
            }
            // Ensure electrical usage is treated as a number
            const usage = parseFloat(item['Electrical Usage (kWh)']);
            return (usage * cost).toFixed(2);
        };

        // Helper to populate a single column
        const populateColumn = (item, type, elecCostToUse) => {
            const modelEl = document.getElementById(`${type}Model`);
            const flowrateEl = document.getElementById(`${type}Flowrate`);
            const descriptionEl = document.getElementById(`${type}Description`);
            const opCostEl = document.getElementById(`${type}OpCost`);

            if (item) {
                modelEl.textContent = item.Model || 'N/A';
                flowrateEl.textContent = item['Flow Rate (GPM)'] !== undefined && item['Flow Rate (GPM)'] !== null ? item['Flow Rate (GPM)'] : 'N/A';
                descriptionEl.textContent = item.Description || 'N/A';
                opCostEl.textContent = calculateOpCost(item, elecCostToUse);
            } else {
                modelEl.textContent = 'No suitable model';
                flowrateEl.textContent = '-';
                descriptionEl.textContent = '-';
                opCostEl.textContent = '-';
            }
        };

        populateColumn(separator, 'separator', elecCost);
        populateColumn(vaf, 'vaf', elecCost);
        populateColumn(vortisand, 'vortisand', elecCost);
    }

     function clearResults() {
        const types = ['separator', 'vaf', 'vortisand'];
        types.forEach(type => {
            document.getElementById(`${type}Model`).textContent = '-';
            document.getElementById(`${type}Flowrate`).textContent = '-';
            document.getElementById(`${type}Description`).textContent = '-';
            document.getElementById(`${type}OpCost`).textContent = '-';
        });
    }

    // Initial setup
    togglePrompts(); // Ensure correct prompts are shown/hidden on load
});