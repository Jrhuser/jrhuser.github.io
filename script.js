document.addEventListener('DOMContentLoaded', () => {
    let database = { "product-DB": [] };

    // DOM Selectors
    const equipmentCheckboxes = document.querySelectorAll('input[name="equipmentGroup"]');
    const filterCheckbox = document.getElementById('radioFilter');
    const pumpCheckbox = document.getElementById('radioPump');
    const uvCheckbox = document.getElementById('radioUV');
    
    const filterOptions = document.getElementById('filterOptions');
    const pumpOptions = document.getElementById('pumpOptions');
    const uvOptions = document.getElementById('uvOptions');
    
    const poolVolumeInput = document.getElementById('poolVolume');
    const turnoverMinutesInput = document.getElementById('turnoverMinutes');
    const circulationRateInput = document.getElementById('circulationRate');
    
    const calculateButton = document.getElementById('calculateButton');
    const resetButton = document.getElementById('resetButton');
    const resultsSection = document.getElementById('resultsSection');
    const resultsBody = document.getElementById('results-body');
    const addToCartButton = document.getElementById('addToCartButton');
    const selectAllBOM = document.getElementById('selectAllBOM');

    // Load Database
    async function loadDatabase() {
        try {
            const response = await fetch('product.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            database = await response.json();
        } catch (error) {
            console.error("Database error:", error);
        }
    }

    // Live Calculation: Flow Rate = Volume / Turnover Minutes
    [poolVolumeInput, turnoverMinutesInput].forEach(input => {
        input.addEventListener('input', () => {
            const volume = parseFloat(poolVolumeInput.value);
            const minutes = parseFloat(turnoverMinutesInput.value);

            if (volume > 0 && minutes > 0) {
                const calculatedFlow = Math.ceil(volume / minutes);
                circulationRateInput.value = calculatedFlow;
            } else {
                circulationRateInput.value = '';
            }
        });
    });

    function toggleSecondaryOptions() {
        filterOptions.classList.toggle('hidden', !filterCheckbox.checked);
        pumpOptions.classList.toggle('hidden', !pumpCheckbox.checked);
        uvOptions.classList.toggle('hidden', !uvCheckbox.checked);
    }

    resetButton.addEventListener('click', () => {
        equipmentCheckboxes.forEach(cb => cb.checked = false);
        poolVolumeInput.value = '';
        turnoverMinutesInput.value = '';
        circulationRateInput.value = '';
        resultsSection.classList.add('hidden');
        resultsBody.innerHTML = '';
        if (selectAllBOM) selectAllBOM.checked = false;
        toggleSecondaryOptions();
    });

    if (selectAllBOM) {
        selectAllBOM.addEventListener('change', () => {
            const checkboxes = document.querySelectorAll('.bom-checkbox');
            checkboxes.forEach(cb => cb.checked = selectAllBOM.checked);
        });
    }

    calculateButton.addEventListener('click', () => {
        resultsBody.innerHTML = ''; 
        const circRate = parseFloat(circulationRateInput.value);

        if (isNaN(circRate) || circRate <= 0) {
            alert("Please enter a valid Pool Volume and Turnover Time to calculate the Flow Rate.");
            return;
        }

        const checkedGroups = Array.from(equipmentCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        let allMatchingModels = [];
        const products = database["product-DB"] || [];

        for (const selectedGroup of checkedGroups) {
            let groupModels = products.filter(item => item.Grouping === selectedGroup);

            // Group-specific filtering
            if (selectedGroup === 'Filter') {
                groupModels = groupModels.filter(item => item["Equipment Type"] === document.getElementById('filterType').value);
            } else if (selectedGroup === 'Pump') {
                const selectedVoltage = document.getElementById('pumpVoltage').value;
                groupModels = groupModels.filter(item => String(item.Power) === selectedVoltage);
            } else if (selectedGroup === 'UV') {
                const nema = document.getElementById('nemaRating').value;
                groupModels = groupModels.filter(item => item["Nema Rating"] === nema);
            }

            // Global Flow Matching
            const flowMatched = groupModels.filter(item => {
                const min = parseFloat(item["Min Flow (gpm)"]) || 0;
                const max = parseFloat(item["Max Flow"]);
                return circRate >= min && (isNaN(max) || max === null || circRate <= max);
            });
            allMatchingModels = allMatchingModels.concat(flowMatched);
        }

        displayResults(allMatchingModels);
    });

    function displayResults(models) {
        if (models.length === 0) {
            alert("No matching equipment found for this Flow Rate.");
            resultsSection.classList.add('hidden');
            return;
        }
        resultsSection.classList.remove('hidden');

        models.forEach((model) => {
            const tr = document.createElement('tr');
            const partNum = model["Part Number"] || 'N/A';
            const buildLink = (file, label) => file ? `<a href="product/${file}" target="_blank" class="download-link">${label}</a>` : '';

            tr.innerHTML = `
                <td><input type="checkbox" class="bom-checkbox" value="${partNum}"></td>
                <td>${model["Equipment Type"]}</td>
                <td>${partNum}</td>
                <td data-label="Model Name">${model.Model || 'N/A'}</td>
                <td>${model["Min Flow (gpm)"]} - ${model["Max Flow"] || '+'}</td>
                <td>${model["Footprint LxWxH (Inches)"] || 'N/A'}</td>
                <td>${buildLink(model['Product Sheet'], 'Docs')}</td>
            `;
            resultsBody.appendChild(tr);
        });
    }

    addToCartButton.addEventListener('click', () => {
        const checkedRows = Array.from(document.querySelectorAll('.bom-checkbox:checked')).map(cb => {
            const row = cb.closest('tr');
            const modelName = row.querySelector('[data-label="Model Name"]').textContent;
            return `- ${modelName} (Part #: ${cb.value})`;
        });

        if (checkedRows.length === 0) return alert('Select items first.');

        const emailBody = `I would like a quote for the following equipment selection:

SYSTEM PARAMETERS:
- Pool Volume: ${poolVolumeInput.value} Gallons
- Turnover Rate: ${turnoverMinutesInput.value} Minutes
- Design Flow Rate: ${circulationRateInput.value} GPM

SELECTED PRODUCTS:
${checkedRows.join('\n')}

Please provide technical submittals and a price quotation.`;

        const mailtoUrl = `mailto:kenneth.roche@xylem.com?subject=Quote Request - ${circulationRateInput.value} GPM System&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoUrl;
    });

    loadDatabase();
    equipmentCheckboxes.forEach(checkbox => checkbox.addEventListener('change', toggleSecondaryOptions));
});
