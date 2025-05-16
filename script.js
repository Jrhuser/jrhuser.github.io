document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed'); // 1. Check if DOMContentLoaded fires

    const openSystemRadio = document.getElementById('openSystem');
    const closedSystemRadio = document.getElementById('closedSystem');
    const openSystemPrompts = document.getElementById('openSystemPrompts');
    const closedSystemPrompts = document.getElementById('closedSystemPrompts');
    const calculateButton = document.getElementById('calculateButton');
    const resultsArea = document.getElementById('resultsArea');

    // 2. Check if elements are found
    console.log('openSystemRadio element:', openSystemRadio);
    console.log('closedSystemRadio element:', closedSystemRadio);
    console.log('openSystemPrompts element:', openSystemPrompts);
    console.log('closedSystemPrompts element:', closedSystemPrompts);


    const dbUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';
    let database = [];

    async function fetchData() {
        // ... (fetchData function remains the same as the previous version)
        try {
            const response = await fetch(dbUrl);
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const csvText = await response.text();
            const parseResult = Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });
            database = parseResult.data;
            console.log('Database loaded. Number of rows:', database.length);
            if (database.length > 0) {
                console.log('First row of database:', database[0]);
            }
            if (parseResult.errors.length > 0) {
                console.warn('CSV parsing errors:', parseResult.errors);
            }
        } catch (error) {
            console.error('Error fetching or parsing database:', error);
            resultsArea.innerHTML = `<p style="color: red;">Error loading database: ${error.message}. Please check the console and ensure the CSV URL is correct and publicly accessible.</p>`;
            resultsArea.classList.remove('hidden');
        }
    }

    fetchData();

    function validateAndGetElectricalCost(inputElement) {
        // ... (validateAndGetElectricalCost function remains the same)
        const cost = parseFloat(inputElement.value);
        if (isNaN(cost) || cost < 0) {
            alert('Please enter a valid, non-negative Electrical Cost.');
            inputElement.focus();
            return null;
        }
        return cost;
    }

    function togglePrompts() {
        console.log('togglePrompts function called.'); // 4. Check if togglePrompts is called

        const openSelected = openSystemRadio.checked;
        const closedSelected = closedSystemRadio.checked;

        console.log('In togglePrompts - Open selected:', openSelected, 'Closed selected:', closedSelected); // 5. Check radio state

        if (openSystemPrompts && closedSystemPrompts) { // Ensure elements exist before trying to modify classList
            console.log('openSystemPrompts classList before:', openSystemPrompts.classList.toString());
            openSystemPrompts.classList.toggle('hidden', !openSelected);
            console.log('openSystemPrompts classList after:', openSystemPrompts.classList.toString());

            console.log('closedSystemPrompts classList before:', closedSystemPrompts.classList.toString());
            closedSystemPrompts.classList.toggle('hidden', !closedSelected);
            console.log('closedSystemPrompts classList after:', closedSystemPrompts.classList.toString());
        } else {
            console.error('Error in togglePrompts: openSystemPrompts or closedSystemPrompts element not found!');
        }


        if (calculateButton) {
            calculateButton.disabled = !(openSelected || closedSelected);
        } else {
            console.error('Error in togglePrompts: calculateButton element not found!');
        }

        if (resultsArea) {
            resultsArea.classList.add('hidden');
        } else {
            console.error('Error in togglePrompts: resultsArea element not found!');
        }
        clearResults();
    }

    if (openSystemRadio && closedSystemRadio) {
        console.log('Adding event listeners to radio buttons.'); // 3. Check if listeners are being added
        openSystemRadio.addEventListener('change', togglePrompts);
        closedSystemRadio.addEventListener('change', togglePrompts);
    } else {
        console.error('Could not add event listeners: openSystemRadio or closedSystemRadio element not found!');
    }


    calculateButton.addEventListener('click', () => {
        // ... (calculateButton click listener remains the same as the previous version)
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

            const inputRecircRate = parseFloat(recircRateInput.value);
            const inputOpenTonnageOrVolume = parseFloat(openSystemTonnageInput.value);

            if (isNaN(inputRecircRate) && isNaN(inputOpenTonnageOrVolume)) {
                alert('For Open Systems, please enter either "Recirc Rate" or "Tonnage / System Volume".');
                return;
            }
            console.log(`[DEBUG] Open System Input - Recirc Rate: ${inputRecircRate}, Tonnage/Volume: ${inputOpenTonnageOrVolume}`);


            database.forEach((item, index) => {
                const itemRecircMin = item['Min Recirc Rate (gpm)'];
                const itemRecircMax = item['Max Recirc Rate (gpm)']; //  MAKE SURE THIS HEADER IS 100% CORRECT
                const itemTonnageMin = item['TONNAGE Min'];
                const itemTonnageMax = item['TONNAGE Max'];
                const itemTypeRaw = item.Type;
                const itemSystemTypeRaw = item['System Type'];

                if (itemSystemTypeRaw?.trim().toLowerCase() !== 'open') return;

                let recircMatch = false;
                let tonnageMatch = false;

                if (!isNaN(inputRecircRate) && typeof itemRecircMin === 'number' && typeof itemRecircMax === 'number') {
                    if (inputRecircRate >= itemRecircMin && inputRecircRate <= itemRecircMax) {
                        recircMatch = true;
                    }
                }

                if (!isNaN(inputOpenTonnageOrVolume) && typeof itemTonnageMin === 'number' && typeof itemTonnageMax === 'number') {
                    if (inputOpenTonnageOrVolume >= itemTonnageMin && inputOpenTonnageOrVolume <= itemTonnageMax) {
                        tonnageMatch = true;
                    }
                }

                if (recircMatch || tonnageMatch) {
                    const currentItemType = itemTypeRaw?.trim().toLowerCase();
                    if (currentItemType === 'separator' && !selectedSeparator) selectedSeparator = item;
                    else if (currentItemType === 'vaf' && !selectedVaf) selectedVaf = item;
                    else if (currentItemType === 'vortisand' && !selectedVortisand) selectedVortisand = item;
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
            console.log(`[DEBUG] Closed System Input - Volume: ${systemVolumeClosed}`);

            database.forEach((item, index) => {
                const itemLoopMin = item['Loop Min GPM'];
                const itemLoopMax = item['Loop Max GPM'];
                const itemTypeRaw = item.Type;
                const itemSystemTypeRaw = item['System Type'];

                if (itemSystemTypeRaw?.trim().toLowerCase() !== 'closed') return;

                let loopMatch = false;
                if (typeof itemLoopMin === 'number' && typeof itemLoopMax === 'number') {
                    if (systemVolumeClosed >= itemLoopMin && systemVolumeClosed <= itemLoopMax) {
                        loopMatch = true;
                    }
                }

                if (loopMatch) {
                    const currentItemType = itemTypeRaw?.trim().toLowerCase();
                    if (currentItemType === 'separator' && !selectedSeparator) selectedSeparator = item;
                    else if (currentItemType === 'vaf' && !selectedVaf) selectedVaf = item;
                    else if (currentItemType === 'vortisand' && !selectedVortisand) selectedVortisand = item;
                }
            });
        }
        console.log(`[DEBUG] Final Found Equipment - Separator: ${selectedSeparator ? selectedSeparator.Model : 'None'}, VAF: ${selectedVaf ? selectedVaf.Model : 'None'}, Vortisand: ${selectedVortisand ? selectedVortisand.Model : 'None'}`);
        displayResults(selectedSeparator, selectedVaf, selectedVortisand, electricalCost);
    });

    function displayResults(separator, vaf, vortisand, elecCost) {
        // ... (displayResults function remains the same)
        const calculateOpCost = (item, cost) => {
            if (!item || item['Electrical Usage (kWh)'] === undefined || item['Electrical Usage (kWh)'] === null || isNaN(parseFloat(item['Electrical Usage (kWh)'])) || cost === null || isNaN(cost)) {
                return 'N/A';
            }
            const usage = parseFloat(item['Electrical Usage (kWh)']);
            return (usage * cost).toFixed(2);
        };

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
        // ... (clearResults function remains the same)
        const types = ['separator', 'vaf', 'vortisand'];
        types.forEach(type => {
            if (document.getElementById(`${type}Model`)) { // Check if element exists
                document.getElementById(`${type}Model`).textContent = '-';
                document.getElementById(`${type}Flowrate`).textContent = '-';
                document.getElementById(`${type}Description`).textContent = '-';
                document.getElementById(`${type}OpCost`).textContent = '-';
            }
        });
    }

    // Initial call to set up the page correctly
    console.log('Initial call to togglePrompts.'); // 6. Check if togglePrompts is called initially
    togglePrompts();
});