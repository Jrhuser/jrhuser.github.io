document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed - using CORRECTED SCRIPT for local JSON.");

    // --- Element Selection ---
    const radioOpen = document.getElementById('radioOpen');
    const radioClosed = document.getElementById('radioClosed');
    const openSystemInputs = document.getElementById('openSystemInputs');
    const closedSystemInputs = document.getElementById('closedSystemInputs');
    const electricalCostSection = document.getElementById('electricalCostSection');
    const calculateButton = document.getElementById('calculateButton');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');

    const recircRateInput = document.getElementById('recircRate');
    const tonnageInput = document.getElementById('tonnage');
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    
    // New elements for cost calculation
    const electricalCostInput = document.getElementById('electricalCost');
    const hoursPerDayInput = document.getElementById('hoursPerDay');
    const daysPerYearInput = document.getElementById('daysPerYear');


    let database = [];

    async function loadDatabase() {
        try {
            const response = await fetch('selection_database.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();

            database = jsonData.map(row => {
                if (!row.Model) return null;

                const newRow = {};

                const getFilterType = (model) => {
                    if (model.startsWith('LCS') || model.startsWith('CTS')) return 'Separator';
                    if (model.startsWith('CTF')) return 'VAF';
                    if (model.startsWith('VC')) return 'Vortisand';
                    return 'Unknown';
                };
                
                newRow.Model = row.Model;
                newRow.Type = getFilterType(row.Model);
                newRow.Description = row['Unnamed: 9'];
                newRow['Flowrate (GPM)'] = parseFloat(row['Flow Rate']);
                newRow.hp = parseFloat(row.hp); // Store horsepower for later calculation

                newRow['Min Recirc Rate (GPM)'] = parseFloat(row['Min Recirc (gallons)']);
                newRow['Max Recirc Rate (GPM)'] = parseFloat(row[' Max Recirc (gallons)']);
                newRow['Tonnage Min'] = parseFloat(row['Tonnage Min']);
                newRow['Tonnage Max'] = parseFloat(row['Tonnage Max']);
                
                newRow['Loop Min (gal)'] = parseFloat(row[' Loop Min']);
                newRow['Loop Max (gal)'] = parseFloat(row['Loop Max']);

                return newRow;
            }).filter(row => row !== null);

            console.log("Database successfully loaded and processed from JSON.");
            if (database.length === 0) {
                 throw new Error("Database is empty after processing.");
            }

        } catch (error) {
            console.error("Failed to load or process database:", error);
            if(noResultsMessage) {
                noResultsMessage.textContent = `Error: Could not load or parse filtration database. ${error.message}`;
                noResultsMessage.classList.remove('hidden');
            }
            if(resultsSection) resultsSection.classList.add('hidden');
            if(calculateButton) { calculateButton.disabled = true; calculateButton.textContent = "DB Load Error"; }
        }
    }

    loadDatabase();

    function toggleInputs() {
        openSystemInputs.classList.add('hidden');
        closedSystemInputs.classList.add('hidden');
        resultsSection.classList.add('hidden');
        noResultsMessage.classList.add('hidden');

        if (radioOpen.checked) {
            openSystemInputs.classList.remove('hidden');
        } else if (radioClosed.checked) {
            closedSystemInputs.classList.remove('hidden');
        }
    }

    radioOpen.addEventListener('change', toggleInputs);
    radioClosed.addEventListener('change', toggleInputs);

    calculateButton.addEventListener('click', () => {
        if (!database || database.length === 0) {
            noResultsMessage.textContent = "Database is not loaded or is empty. Please wait or check console for errors.";
            noResultsMessage.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            return;
        }

        const systemType = radioOpen.checked ? 'open' : (radioClosed.checked ? 'closed' : null);
        
        // Read new operating cost parameters
        const electricalCost = parseFloat(electricalCostInput.value);
        const hoursPerDay = parseFloat(hoursPerDayInput.value);
        const daysPerYear = parseFloat(daysPerYearInput.value);


        if (!systemType) { alert("Please select a system type (Open or Closed)."); return; }
        if (isNaN(electricalCost) || electricalCost < 0) { alert("Please enter a valid Electrical Cost."); return; }
        if (isNaN(hoursPerDay) || hoursPerDay < 0 || hoursPerDay > 24) { alert("Please enter valid Operating Hours per Day (0-24)."); return; }
        if (isNaN(daysPerYear) || daysPerYear < 0 || daysPerYear > 365) { alert("Please enter valid Operating Days per Year (0-365)."); return; }


        let recircRateVal = NaN;
        let tonnageVal = NaN;
        let closedSystemVolumeVal = NaN;

        if (systemType === 'open') {
            recircRateVal = parseFloat(recircRateInput.value);
            tonnageVal = parseFloat(tonnageInput.value);
            if (isNaN(recircRateVal) && isNaN(tonnageVal)) { alert("For Open systems, please enter either Recirculation Rate or Tonnage."); return; }
            if (!isNaN(recircRateVal) && recircRateVal <= 0) { alert("Recirculation Rate must be a positive number if entered."); return; }
            if (!isNaN(tonnageVal) && tonnageVal <= 0) { alert("Tonnage must be a positive number if entered."); return; }
        } else {
            closedSystemVolumeVal = parseFloat(closedSystemVolumeInput.value);
            if (isNaN(closedSystemVolumeVal) || closedSystemVolumeVal <= 0) { alert("For Closed systems, please enter a valid, positive System Volume."); return; }
        }

        const costParams = { electricalCost, hoursPerDay, daysPerYear };
        findAndDisplayModels(systemType, recircRateVal, tonnageVal, closedSystemVolumeVal, costParams);
    });

    function findAndDisplayModels(systemType, recircRate, tonnage, closedVolume, costParams) {
        let separatorModel = null;
        let vafModel = null;
        let vortisandModel = null;

        for (const row of database) {
            let match = false;
            
            if (systemType === 'open') {
                const useRecirc = !isNaN(recircRate) && recircRate > 0;
                const useTonnageInput = !isNaN(tonnage) && tonnage > 0;

                const rowMinRecirc = row["Min Recirc Rate (GPM)"];
                const rowMaxRecirc = row["Max Recirc Rate (GPM)"];
                const rowTonnageMin = row["Tonnage Min"];
                const rowTonnageMax = row["Tonnage Max"];
                
                if (useRecirc) {
                    if (recircRate >= rowMinRecirc && recircRate <= rowMaxRecirc) {
                        match = true;
                    }
                }

                if (!match && useTonnageInput) {
                    if (tonnage >= rowTonnageMin && tonnage <= rowTonnageMax) {
                        match = true;
                    }
                }
            } else {
                const rowLoopMin = row["Loop Min (gal)"];
                const rowLoopMax = row["Loop Max (gal)"];
                if (closedVolume >= rowLoopMin && closedVolume <= rowLoopMax) {
                    match = true;
                }
            }

            if (match) {
                const typeFromRow = row.Type || '';
                if (typeFromRow === 'Separator' && !separatorModel) {
                    separatorModel = row;
                } else if (typeFromRow === 'VAF' && !vafModel) {
                    vafModel = row;
                } else if (typeFromRow === 'Vortisand' && !vortisandModel) {
                    vortisandModel = row;
                }
            }
        }
        displayResults(separatorModel, vafModel, vortisandModel, costParams);
    }
    
    // Helper function to calculate annual kWh based on operating schedule
    const calculateAnnualKwh = (hp, hoursPerDay, daysPerYear) => {
        if (isNaN(hp)) return NaN;
        // Formula: HP * 0.746 kW/HP * hours/day * days/year
        return hp * 0.746 * hoursPerDay * daysPerYear;
    };


    function displayResults(separator, vaf, vortisand, costParams) {
        resultsSection.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
        let anyModelFound = false;

        function updateColumn(typeKey, modelData) {
            const modelEl = document.getElementById(`${typeKey}Model`);
            const flowrateEl = document.getElementById(`${typeKey}Flowrate`);
            const descriptionEl = document.getElementById(`${typeKey}Description`);
            const opCostEl = document.getElementById(`${typeKey}OpCost`);

            if (modelData) {
                anyModelFound = true;
                modelEl.textContent = modelData.Model || 'N/A';
                flowrateEl.textContent = modelData['Flowrate (GPM)'] != null ? modelData['Flowrate (GPM)'] : 'N/A';
                descriptionEl.textContent = modelData.Description || 'N/A';
                
                // Calculate cost using the new parameters
                const annualKwh = calculateAnnualKwh(modelData.hp, costParams.hoursPerDay, costParams.daysPerYear);
                const annualCost = annualKwh * costParams.electricalCost;

                // **THIS IS THE CORRECTED LINE**
                // It formats the number as U.S. currency, which includes the $ sign and commas.
                opCostEl.textContent = !isNaN(annualCost) ? annualCost.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : 'N/A';
            } else {
                modelEl.textContent = '-';
                flowrateEl.textContent = '-';
                descriptionEl.textContent = 'No suitable model found.';
                opCostEl.textContent = '-';
            }
        }

        updateColumn('separator', separator);
        updateColumn('vaf', vaf);
        updateColumn('vortisand', vortisand);

        if (!anyModelFound) {
            resultsSection.classList.add('hidden');
            noResultsMessage.textContent = "No suitable models found for the given criteria across all categories.";
            noResultsMessage.classList.remove('hidden');
        }
    }

    // Initialize the view
    toggleInputs();
});
