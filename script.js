document.addEventListener('DOMContentLoaded', () => {
    let database = [];

    const equipmentCheckboxes = document.querySelectorAll('input[name="equipmentGroup"]');
    const filterCheckbox = document.getElementById('radioFilter');
    const pumpCheckbox = document.getElementById('radioPump');
    const uvCheckbox = document.getElementById('radioUV');
    
    const filterOptions = document.getElementById('filterOptions');
    const pumpOptions = document.getElementById('pumpOptions');
    const uvOptions = document.getElementById('uvOptions');
    
    const poolVolumeInput = document.getElementById('poolVolume');
    const circulationRateInput = document.getElementById('circulationRate');
    const turnoverResultSection = document.getElementById('turnoverResultSection');
    const turnoverResultText = document.getElementById('turnoverResultText');
    
    const calculateButton = document.getElementById('calculateButton');
    const resetButton = document.getElementById('resetButton');
    const resultsSection = document.getElementById('resultsSection');
    const resultsBody = document.getElementById('results-body');
    const addToCartButton = document.getElementById('addToCartButton');
    const selectAllBOM = document.getElementById('selectAllBOM');

    async function loadDatabase() {
        try {
            const response = await fetch('product.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            database = await response.json();
        } catch (error) {
            console.error("Database error:", error);
        }
    }

    function toggleSecondaryOptions() {
        filterOptions.classList.toggle('hidden', !filterCheckbox.checked);
        pumpOptions.classList.toggle('hidden', !pumpCheckbox.checked);
        uvOptions.classList.toggle('hidden', !uvCheckbox.checked);
    }

    resetButton.addEventListener('click', () => {
        equipmentCheckboxes.forEach(cb => cb.checked = false);
        poolVolumeInput.value = '';
        circulationRateInput.value = '';
        selectAllBOM.checked = false;
        resultsSection.classList.add('hidden');
        turnoverResultSection.classList.add('hidden');
        resultsBody.innerHTML = '';
        toggleSecondaryOptions();
    });

    selectAllBOM.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.bom-checkbox');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
    });

    equipmentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            toggleSecondaryOptions();
            resultsSection.classList.add('hidden');
            turnoverResultSection.classList.add('hidden');
            resultsBody.innerHTML = '';
        });
    });

    calculateButton.addEventListener('click', () => {
        resultsBody.innerHTML = ''; 
        resultsSection.classList.add('hidden');
        selectAllBOM.checked = false;
        
        const poolVolume = parseFloat(poolVolumeInput.value);
        const circRate = parseFloat(circulationRateInput.value);

        if (isNaN(poolVolume) || isNaN(circRate) || poolVolume <= 0) {
            alert("Please enter a valid Volume and Flow Rate.");
            return;
        }

        const turnoversPerDay = (circRate * 1440) / poolVolume;
        turnoverResultText.textContent = `${turnoversPerDay.toFixed(2)} Turnovers per Day`;
        turnoverResultSection.classList.remove('hidden');

        // NEW: Health Standard Validation
        if (turnoversPerDay < 4.0) {
            turnoverResultText.style.color = "red";
            alert("Warning: The calculated turnover rate is below the 4.0 turnovers per day health standard.");
        } else {
            turnoverResultText.style.color = "#007DA3";
        }

        const checkedGroups = Array.from(equipmentCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        let allMatchingModels = [];

        for (const selectedGroup of checkedGroups) {
            let groupModels = database.filter(item => item.Grouping === selectedGroup);

            if (selectedGroup === 'Filter') {
                groupModels = groupModels.filter(item => item["Equipment Type"] === document.getElementById('filterType').value);
            } else if (selectedGroup === 'Pump') {
                groupModels = groupModels.filter(item => item.Power === document.getElementById('pumpVoltage').value);
            } else if (selectedGroup === 'UV') {
                const nema = document.getElementById('nemaRating').value;
                groupModels = groupModels.filter(item => 
                    item["Equipment Type"] === "Medium Pressure UV" && 
                    item["Nema Rating"] === nema
                );
            }

            const flowMatched = groupModels.filter(item => {
                const min = parseFloat(item["Min Flow"]);
                const max = parseFloat(item["Max Flow"]);
                return circRate >= min && (isNaN(max) || max === null || circRate <= max);
            });
            allMatchingModels = allMatchingModels.concat(flowMatched);
        }

        displayResults(allMatchingModels);
    });

    function displayResults(models) {
        if (models.length === 0) return;
        resultsSection.classList.remove('hidden');

        models.forEach((model) => {
            const tr = document.createElement('tr');
            const partNum = model["Part Number"] || 'N/A';
            const footprint = model["Footprint"] || 'N/A';
            const desc = model["Nema Rating"] ? `${model["Equipment Type"]} (${model["Nema Rating"]})` : (model["Equipment Type"] || 'N/A');

            const buildLink = (file, label) => file ? `<a href="product/${file}" target="_blank" class="download-link">${label}</a>` : '';

            // Corrected Mapping
            const linksHtml = [
                buildLink(model['Cut Sheet'], 'Product Sheet'),
                buildLink(model['GA'], 'Additional Info/ Pump Curve'),
                buildLink(model['Written Specification'], 'Written Specification')
            ].filter(l => l).join(' ');

            tr.innerHTML = `
                <td><input type="checkbox" class="bom-checkbox" value="${partNum}"></td>
                <td data-label="Equipment Type">${desc}</td>
                <td data-label="Part Number">${partNum}</td>
                <td data-label="Model Name">${model.Model || 'N/A'}</td>
                <td data-label="Flow Range">${model["Min Flow"]} - ${model["Max Flow"] || '+'}</td>
                <td data-label="Footprint">${footprint}</td>
                <td data-label="Technical Docs">${linksHtml || 'N/A'}</td>
            `;
            resultsBody.appendChild(tr);
        });
    }

    addToCartButton.addEventListener('click', () => {
        const checkedRows = Array.from(document.querySelectorAll('.bom-checkbox:checked')).map(cb => {
            const row = cb.closest('tr');
            return {
                partNumber: cb.value,
                modelName: row.querySelector('[data-label="Model Name"]').textContent
            };
        }).filter(item => item.partNumber !== 'N/A');

        if (checkedRows.length === 0) {
            alert('Please select at least one product with a part number to request a quote.');
            return;
        }

        const emailRecipient = 'kenneth.roche@xylem.com';
        const subject = encodeURIComponent('Quote Request: Pump Room Equipment Selection');
        
        let bodyText = 'I would like to request a quote for the following equipment:\n\n';
        checkedRows.forEach((item, index) => {
            bodyText += `${index + 1}. Model: ${item.modelName} (Part #: ${item.partNumber})\n`;
        });
        
        const mailtoUrl = `mailto:${emailRecipient}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
        window.location.href = mailtoUrl;
    });

    loadDatabase();
});
