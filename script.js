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
        resultsSection.classList.add('hidden');
        turnoverResultSection.classList.add('hidden');
        resultsBody.innerHTML = '';
        toggleSecondaryOptions();
    });

    calculateButton.addEventListener('click', () => {
        resultsBody.innerHTML = ''; 
        const poolVolume = parseFloat(poolVolumeInput.value);
        const circRate = parseFloat(circulationRateInput.value);

        if (isNaN(circRate) || circRate <= 0) {
            alert("Please enter a valid Recirculation Rate (GPM).");
            return;
        }

        if (!isNaN(poolVolume) && poolVolume > 0) {
            const turnoversPerDay = (circRate * 1440) / poolVolume;
            turnoverResultText.textContent = `${turnoversPerDay.toFixed(2)} Turnovers per Day`;
            turnoverResultSection.classList.remove('hidden');

            if (turnoversPerDay < 4.0) {
                turnoverResultText.style.color = "red";
                alert("Warning: The calculated turnover rate is below the 4.0 turnovers per day health standard.");
            } else {
                turnoverResultText.style.color = "#007DA3";
            }
        } else {
            turnoverResultSection.classList.add('hidden');
        }

        const checkedGroups = Array.from(equipmentCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        let allMatchingModels = [];

        for (const selectedGroup of checkedGroups) {
            let groupModels = database.filter(item => item.Grouping === selectedGroup);

            if (selectedGroup === 'Filter') {
                groupModels = groupModels.filter(item => item["Equipment Type"] === document.getElementById('filterType').value);
            } else if (selectedGroup === 'Pump') {
                const selectedVoltage = document.getElementById('pumpVoltage').value;
                groupModels = groupModels.filter(item => item.Power === selectedVoltage);
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
        if (models.length === 0) {
            alert("No matching equipment found for this Recirculation Rate/Configuration.");
            return;
        }
        resultsSection.classList.remove('hidden');

        models.forEach((model) => {
            const tr = document.createElement('tr');
            const partNum = model["Part Number"] || 'N/A';
            const buildLink = (file, label) => file ? `<a href="product/${file}" target="_blank" class="download-link">${label}</a>` : '';

            const linksHtml = [
                buildLink(model['Product Sheet'], 'Product Sheet'),
                buildLink(model['Additional Info/Pump Curve'], 'Additional Info/ Pump Curve'),
                buildLink(model['Written Specification'], 'Written Specification')
            ].filter(l => l).join(' ');

            tr.innerHTML = `
                <td><input type="checkbox" class="bom-checkbox" value="${partNum}"></td>
                <td>${model["Equipment Type"] || 'N/A'}</td>
                <td>${partNum}</td>
                <td data-label="Model Name">${model.Model || 'N/A'}</td>
                <td>${model["Min Flow"]} - ${model["Max Flow"] || '+'}</td>
                <td>${model["Footprint"] || 'N/A'}</td>
                <td>${linksHtml || 'N/A'}</td>
            `;
            resultsBody.appendChild(tr);
        });
    }

    addToCartButton.addEventListener('click', () => {
        const checkedRows = Array.from(document.querySelectorAll('.bom-checkbox:checked')).map(cb => {
            const row = cb.closest('tr');
            return `- Model: ${row.querySelector('[data-label="Model Name"]').textContent} (Part #: ${cb.value})`;
        });

        if (checkedRows.length === 0) return alert('Please select products first.');
        
        const body = `I would like to request a quote for:\n\n${checkedRows.join('\n')}`;
        const mailtoUrl = `mailto:kenneth.roche@xylem.com?subject=Quote Request&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    });

    loadDatabase();
    equipmentCheckboxes.forEach(checkbox => checkbox.addEventListener('change', toggleSecondaryOptions));
});
