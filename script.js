document.addEventListener('DOMContentLoaded', () => {
    const openSystemRadio = document.getElementById('openSystem');
    const closedSystemRadio = document.getElementById('closedSystem');
    const openSystemPrompts = document.getElementById('openSystemPrompts');
    const closedSystemPrompts = document.getElementById('closedSystemPrompts');
    const calculateButton = document.getElementById('calculateButton');
    const resultsArea = document.getElementById('resultsArea');

    const recircRateInput = document.getElementById('recircRate');
    const openSystemTonnageInput = document.getElementById('openSystemTonnage');
    const openElectricalCostInput = document.getElementById('openElectricalCost');
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const closedElectricalCostInput = document.getElementById('closedElectricalCost');

    const dbUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT216WTQadamMw4sIIFvBuWNWe69BCz3GedD5Ahcy3i187k9XGtiBve_yUiDc7jtqYZjtB4mrgDPnbK/pub?gid=0&single=true&output=csv';
    let database = [];

    async function fetchData() {
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
                console.log('First row of database:', database[0]); // Log first row to see headers
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
        const cost = parseFloat(inputElement.value);
        if (isNaN(cost) || cost < 0) {
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

        calculateButton.disabled = !(openSelected || closedSelected);
        resultsArea.classList.add('hidden');
        clearResults();
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

            const inputRecircRate = parseFloat(recircRateInput.value);
            const inputOpenTonnageOrVolume = parseFloat(openSystemTonnageInput.value);

            if (isNaN(inputRecircRate) && isNaN(inputOpenTonnageOrVolume)) {
                alert('For Open Systems, please enter either "Recirc Rate" or "Tonnage / System Volume".');
                return;
            }
            console.log(`[DEBUG] Open System Input - Recirc Rate: ${inputRecircRate}, Tonnage/Volume: ${inputOpenTonnageOrVolume}`);


            database.forEach((item, index) => {
                // Corrected CSV Header Names
                const itemRecircMin = item['Min Recirc Rate (gpm)'];
                const itemRecircMax = item['Max Recirc Rate (gpm)'];
                const itemTonnageMin = item['TONNAGE Min'];
                const itemTonnageMax = item['TONNAGE Max'];
                const itemTypeRaw = item.Type; // Original 'Type' from CSV
                const itemSystemTypeRaw = item['System Type']; // Original 'System Type' from CSV

                // console.log(`[DEBUG] Processing Row ${index}:`, item); // Log the whole item
                // console.log(`[DEBUG] Row ${index} Raw Values - RecircMin: ${itemRecircMin} (type: ${typeof itemRecircMin}), RecircMax: ${itemRecircMax} (type: ${typeof itemRecircMax}), TonnageMin: ${itemTonnageMin} (type: ${typeof itemTonnageMin}), TonnageMax: ${itemTonnageMax} (type: ${typeof itemTonnageMax})`);


                if (itemSystemTypeRaw?.trim().toLowerCase() !== 'open') return;

                let recircMatch = false;
                let tonnageMatch = false;

                // Check Recirc Rate condition if input is provided
                if (!isNaN(inputRecircRate) && typeof itemRecircMin === 'number' && typeof itemRecircMax === 'number') {
                    if (inputRecircRate >= itemRecircMin && inputRecircRate <= itemRecircMax) {
                        recircMatch = true;
                    }
                }
                // else if (!isNaN(inputRecircRate)) {
                //     console.log(`[DEBUG] Row ${index} Recirc Check: Input (${inputRecircRate}) vs Row Min (${itemRecircMin}), Row Max (${itemRecircMax}). Min/Max not numbers or input NaN.`);
                // }


                // Check Tonnage condition if input is provided
                if (!isNaN(inputOpenTonnageOrVolume) && typeof itemTonnageMin === 'number' && typeof itemTonnageMax === 'number') {
                    if (inputOpenTonnageOrVolume >= itemTonnageMin && inputOpenTonnageOrVolume <= itemTonnageMax) {
                        tonnageMatch = true;
                    }
                }
                // else if (!isNaN(inputOpenTonnageOrVolume)) {
                //      console.log(`[DEBUG] Row ${index} Tonnage Check: Input (${inputOpenTonnageOrVolume}) vs Row Min (${itemTonnageMin}), Row Max (${itemTonnageMax}). Min/Max not numbers or input NaN.`);
                // }

                // console.log(`[DEBUG] Row ${index} Matches - Recirc: ${recircMatch}, Tonnage: ${tonnageMatch}`);


                if (recircMatch || tonnageMatch) { // OR condition as per requirement
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

                // console.log(`[DEBUG] Processing Closed Row ${index}:`, item);
                // console.log(`[DEBUG] Row ${index} Closed Values - LoopMin: ${itemLoopMin} (type: ${typeof itemLoopMin}), LoopMax: ${itemLoopMax} (type: ${typeof itemLoopMax})`);


                if (itemSystemTypeRaw?.trim().toLowerCase() !== 'closed') return;

                let loopMatch = false;
                if (typeof itemLoopMin === 'number' && typeof itemLoopMax === 'number') {
                    if (systemVolumeClosed >= itemLoopMin && systemVolumeClosed <= itemLoopMax) {
                        loopMatch = true;
                    }
                }
                // else {
                //     console.log(`[DEBUG] Row ${index} Loop Check: Input (${systemVolumeClosed}) vs Row Min (${itemLoopMin}), Row Max (${itemLoopMax}). Min/Max not numbers.`);
                // }

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
        const types = ['separator', 'vaf', 'vortisand'];
        types.forEach(type => {
            document.getElementById(`${type}Model`).textContent = '-';
            document.getElementById(`${type}Flowrate`).textContent = '-';
            document.getElementById(`${type}Description`).textContent = '-';
            document.getElementById(`${type}OpCost`).textContent = '-';
        });
    }

    togglePrompts();
});