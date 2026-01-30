// Main Calculation and Filtering Logic
    calculateButton.addEventListener('click', () => {
        resultsBody.innerHTML = ''; 
        const poolVolume = parseFloat(poolVolumeInput.value);
        const circRate = parseFloat(circulationRateInput.value);

        // Logic Change: Only Design Flow Rate (circRate) is strictly required to filter equipment
        if (isNaN(circRate) || circRate <= 0) {
            alert("Please enter a valid Design Flow Rate (GPM).");
            return;
        }

        // Turnover Calculation only runs if Volume is provided
        if (!isNaN(poolVolume) && poolVolume > 0) {
            const turnoversPerDay = (circRate * 1440) / poolVolume;
            turnoverResultText.textContent = `${turnoversPerDay.toFixed(2)} Turnovers per Day`;
            turnoverResultSection.classList.remove('hidden');

            if (turnoversPerDay < 4.0) {
                turnoverResultText.style.color = "red";
            } else {
                turnoverResultText.style.color = "#007DA3";
            }
        } else {
            // Hide turnover results if volume is missing
            turnoverResultSection.classList.add('hidden');
        }

        const checkedGroups = Array.from(equipmentCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        let allMatchingModels = [];
        const products = database["product-DB"] || [];

        for (const selectedGroup of checkedGroups) {
            let groupModels = products.filter(item => item.Grouping === selectedGroup);

            if (selectedGroup === 'Filter') {
                const type = document.getElementById('filterType').value;
                groupModels = groupModels.filter(item => item["Equipment Type"] === type);
            } else if (selectedGroup === 'Pump') {
                const selectedVoltage = document.getElementById('pumpVoltage').value;
                groupModels = groupModels.filter(item => String(item.Power) === selectedVoltage);
            } else if (selectedGroup === 'UV') {
                const nema = document.getElementById('nemaRating').value;
                groupModels = groupModels.filter(item => item["Nema Rating"] === nema);
            }

            const flowMatched = groupModels.filter(item => {
                const min = parseFloat(item["Min Flow (gpm)"]) || 0;
                const max = parseFloat(item["Max Flow"]);
                return circRate >= min && (isNaN(max) || max === null || circRate <= max);
            });
            allMatchingModels = allMatchingModels.concat(flowMatched);
        }

        displayResults(allMatchingModels);
    });
