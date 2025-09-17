document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed - using script with downloads and learn more logic.");

    // --- Element Selection ---
    const radioOpen = document.getElementById('radioOpen');
    const radioClosed = document.getElementById('radioClosed');
    const radioTech = document.getElementById('radioTech');
    const openSystemInputs = document.getElementById('openSystemInputs');
    const closedSystemInputs = document.getElementById('closedSystemInputs');
    const techSystemInputs = document.getElementById('techSystemInputs');
    const electricalCostSection = document.getElementById('electricalCostSection');
    const calculateButton = document.getElementById('calculateButton');
    const resultsSection = document.getElementById('resultsSection');
    const noResultsMessage = document.getElementById('noResultsMessage');

    const separatorRow = document.getElementById('separatorRow');
    const vafRow = document.getElementById('vafRow');
    const vortisandRow = document.getElementById('vortisandRow');
    const costColumnElements = document.querySelectorAll('.cost-column');

    const recircRateInput = document.getElementById('recircRate');
    const tonnageInput = document.getElementById('tonnage');
    const closedSystemVolumeInput = document.getElementById('closedSystemVolume');
    const techFlowRateInput = document.getElementById('techFlowRate');
    
    const electricalCostInput = document.getElementById('electricalCost');
    const hoursPerDayInput = document.getElementById('hoursPerDay');
    const daysPerYearInput = document.getElementById('daysPerYear');

    const downloadsSection = document.getElementById('downloadsSection');
    const specLink = document.getElementById('specLink');
    const cutSheetLink = document.getElementById('cutSheetLink');
    const gaLink = document.getElementById('gaLink');
    const cadLink = document.getElementById('cadLink');
    const radioButtons = document.querySelectorAll('input[name="selectedModel"]');
    const learnMoreBtn = document.getElementById('learnMoreBtn');

    let database = [];
    let separatorModel, vafModel, vortisandModel;

    async function loadDatabase() {
        try {
            const response = await fetch('selection-database.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            database = jsonData.filter(row => row.Model);
            console.log("Database successfully loaded and processed.");
        } catch (error) {
            console.error("Failed to load or process database:", error);
            noResultsMessage.textContent = `Error: Could not load or parse filtration database. ${error.message}`;
            noResultsMessage.classList.remove('hidden');
            calculateButton.disabled = true;
            calculateButton.textContent = "DB Load Error";
        }
    }

    loadDatabase();

    function toggleInputs() {
        openSystemInputs.classList.add('hidden');
        closedSystemInputs.classList.add('hidden');
        techSystemInputs.classList.add('hidden');
        electricalCostSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        downloadsSection.classList.add('hidden');
        learnMoreBtn.classList.add('hidden');
        noResultsMessage.classList.add('hidden');

        separatorRow.classList.remove('hidden');
        vafRow.classList.remove('hidden');
        vortisandRow.classList.remove('hidden');
        costColumnElements.forEach(el => el.classList.remove('hidden'));

        if (radioOpen.checked || radioClosed.checked) {
            radioOpen.checked ? openSystemInputs.classList.remove('hidden') : closedSystemInputs.classList.remove('hidden');
            electricalCostSection.classList.remove('hidden');
        } else if (radioTech.checked) {
            techSystemInputs.classList.remove('hidden');
            separatorRow.classList.add('hidden');
            vortisandRow.classList.add('hidden');
            costColumnElements.forEach(el => el.classList.add('hidden'));
        }
    }

    radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedValue = document.querySelector('input[name="selectedModel"]:checked').value;
            let selectedModelData = null;

            if (selectedValue === 'separator') selectedModelData = separatorModel;
            else if (selectedValue === 'vaf') selectedModelData = vafModel;
            else if (selectedValue === 'vortisand') selectedModelData = vortisandModel;

            updateDownloads(selectedModelData);
        });
    });

    function updateDownloads(modelData) {
        const setupLink = (linkElement, filename) => {
            if (filename) {
                linkElement.href = `product/${filename}`;
                linkElement.classList.remove('hidden');
                return true;
            } else {
                linkElement.classList.add('hidden');
                return false;
            }
        };

        if (modelData) {
            const hasSpec = setupLink(specLink, modelData['Written Specification']);
            const hasCut = setupLink(cutSheetLink, modelData['Cut Sheet']);
            const hasGa = setupLink(gaLink, modelData['GA']);
            const hasCad = setupLink(cadLink, modelData['CAD']);
            
            if (hasSpec || hasCut || hasGa || hasCad) {
                downloadsSection.classList.remove('hidden');
                learnMoreBtn.classList.remove('hidden');
                const subject = `Inquiry about ${modelData.Model}`;
                learnMoreBtn.href = `mailto:James.Huser@Xylem.com?subject=${encodeURIComponent(subject)}`;
            } else {
                downloadsSection.classList.add('hidden');
                learnMoreBtn.classList.add('hidden');
            }
        } else {
            downloadsSection.classList.add('hidden');
            learnMoreBtn.classList.add('hidden');
        }
    }
    
    radioOpen.addEventListener('change', toggleInputs);
    radioClosed.addEventListener('change', toggleInputs);
    radioTech.addEventListener('change', toggleInputs);

    calculateButton.addEventListener('click', () => {
        if (!database || database.length === 0) {
            noResultsMessage.textContent = "Database is not loaded or is empty.";
            noResultsMessage.classList.remove('hidden');
            return;
        }
        
        resultsSection.classList.add('hidden');
        downloadsSection.classList.add('hidden');
        learnMoreBtn.classList.add('hidden');
        radioButtons.forEach(radio => radio.checked = false);

        const systemType = document.querySelector('input[name="systemType"]:checked').value;
        
        let costParams = {};
        if (systemType === 'open' || systemType === 'closed') {
            const electricalCost = parseFloat(electricalCostInput.value);
            const hoursPerDay = parseFloat(hoursPerDayInput.value);
            const daysPerYear = parseFloat(daysPerYearInput.value);
            if (isNaN(electricalCost) || electricalCost < 0) { alert("Please enter a valid Electrical Cost."); return; }
            if (isNaN(hoursPerDay) || hoursPerDay < 0 || hoursPerDay > 24) { alert("Please enter valid Operating Hours per Day (0-24)."); return; }
            if (isNaN(daysPerYear) || daysPerYear < 0 || daysPerYear > 365) { alert("Please enter valid Operating Days per Year (0-365)."); return; }
            costParams = { electricalCost, hoursPerDay, daysPerYear };
        }
        
        let recircRateVal = NaN, tonnageVal = NaN, closedSystemVolumeVal = NaN, techFlowRateVal = NaN;

        if (systemType === 'open') {
            recircRateVal = parseFloat(recircRateInput.value);
            tonnageVal = parseFloat(tonnageInput.value);
            if (isNaN(recircRateVal) && isNaN(tonnageVal)) { alert("For Open systems, please enter either Recirculation Rate or Tonnage."); return; }
        } else if (systemType === 'closed') {
            closedSystemVolumeVal = parseFloat(closedSystemVolumeInput.value);
            if (isNaN(closedSystemVolumeVal) || closedSystemVolumeVal <= 0) { alert("For Closed systems, please enter a valid, positive System Volume."); return; }
        } else if (systemType === 'technology') {
            techFlowRateVal = parseFloat(techFlowRateInput.value);
            if (isNaN(techFlowRateVal) || techFlowRateVal <= 0) { alert("For Technology Cooling Systems, please enter a valid, positive Flow Rate."); return; }
        }

        findAndDisplayModels(systemType, recircRateVal, tonnageVal, closedSystemVolumeVal, techFlowRateVal, costParams);
    });

    function findAndDisplayModels(systemType, recircRate, tonnage, closedVolume, techFlowRate, costParams) {
        separatorModel = null;
        vafModel = null;
        vortisandModel = null;

        if (systemType === 'technology') {
            const potentialModels = database.filter(row =>
                row['Application'] === 'Technology Cooling Filtration' &&
                parseFloat(row['Flow Rate']) >= techFlowRate
            );
            if (potentialModels.length > 0) {
                potentialModels.sort((a, b) => parseFloat(a['Flow Rate']) - parseFloat(b['Flow Rate']));
                vafModel = potentialModels[0];
            }
        } else {
            const sideStreamModels = database.filter(row => row['Application'] === 'Side stream');
            for (const row of sideStreamModels) {
                let match = false;
                if (systemType === 'open') {
                    const useRecirc = !isNaN(recircRate) && recircRate > 0;
                    const useTonnageInput = !isNaN(tonnage) && tonnage > 0;
                    if (useRecirc && (recircRate >= parseFloat(row["Min Recirc Rate (gpm)"]) && recircRate <= parseFloat(row["Max Recirc Rate (gpm)"]))) match = true;
                    if (!match && useTonnageInput && (tonnage >= parseFloat(row["Tonnage Min"]) && tonnage <= parseFloat(row["Tonnage Max"]))) match = true;
                } else {
                    if (closedVolume >= parseFloat(row["Loop Min (gallons)"]) && closedVolume <= parseFloat(row["Loop Max (gallons)"])) match = true;
                }
                if (match) {
                    const typeFromRow = row['Filter Type'] || '';
                    if (typeFromRow.toLowerCase() === 'separator' && !separatorModel) separatorModel = row;
                    else if (typeFromRow.toLowerCase() === 'vaf' && !vafModel) vafModel = row;
                    else if (typeFromRow.toLowerCase() === 'vortisand' && !vortisandModel) vortisandModel = row;
                }
            }
        }
        
        displayResults(separatorModel, vafModel, vortisandModel, costParams);
    }
    
    const calculateAnnualKwh = (hp, hoursPerDay, daysPerYear) => {
        const numHp = parseFloat(hp);
        if (isNaN(numHp)) return NaN;
        return numHp * 0.746 * hoursPerDay * daysPerYear;
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
                flowrateEl.textContent = modelData['Flow Rate'] != null ? modelData['Flow Rate'] : 'N/A';
                descriptionEl.textContent = modelData.Description || 'N/A';
                
                let annualCost = NaN;
                if (costParams.electricalCost !== undefined && !isNaN(parseFloat(modelData.hp))) {
                    const annualKwh = calculateAnnualKwh(modelData.hp, costParams.hoursPerDay, costParams.daysPerYear);
                    annualCost = annualKwh * costParams.electricalCost;
                }
                
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
