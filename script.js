document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed - using CORRECTED SCRIPT (vSept4).");

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
    const electricalCostInput = document.getElementById('electricalCost');

    // --- CORRECTED DATA SOURCE ---
    // The data from your selection_database.json file is included here directly.
    // This removes the need to fetch from an external URL.
    const jsonData = [{
        "Model": "LCS120",
        "hp": 3.0,
        "Flow Rate": 120.0,
        "Min Recirc (gallons)": 0.0,
        "Max Recirc (gallons)": 600.0,
        "Tonnage Min": 0.0,
        "Tonnage Max": 200.0,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "VHS-120 Hydrocyclone Separator, 3HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a 304SS formed base."
    }, {
        "Model": "LCS180",
        "hp": 5.0,
        "Flow Rate": 180.0,
        "Min Recirc (gallons)": 601.0,
        "Max Recirc (gallons)": 900.0,
        "Tonnage Min": 201.0,
        "Tonnage Max": 300.0,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "VHS-180 Hydrocyclone Separator, 5HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a 304SS formed base."
    }, {
        "Model": "LCS260",
        "hp": 7.5,
        "Flow Rate": 260.0,
        "Min Recirc (gallons)": 901.0,
        "Max Recirc (gallons)": 1300.0,
        "Tonnage Min": 301.0,
        "Tonnage Max": 433.3333333333,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "VHS-260 Hydrocyclone Separator, 7.5HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a 304SS formed base."
    }, {
        "Model": "LCS340",
        "hp": 7.5,
        "Flow Rate": 340.0,
        "Min Recirc (gallons)": 1301.0,
        "Max Recirc (gallons)": 1700.0,
        "Tonnage Min": 434.3333333333,
        "Tonnage Max": 566.6666666667,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "VHS-340 Hydrocyclone Separator, 7.5HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a 304SS formed base."
    }, {
        "Model": "CTS400",
        "hp": 15.0,
        "Flow Rate": 400.0,
        "Min Recirc (gallons)": 1701.0,
        "Max Recirc (gallons)": 2000.0,
        "Tonnage Min": 567.6666666667,
        "Tonnage Max": 666.6666666667,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "VHS-400A Hydrocyclone Separator, 15HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a polyurethane coated channel frame base."
    }, {
        "Model": "CTS700",
        "hp": 20.0,
        "Flow Rate": 700.0,
        "Min Recirc (gallons)": 2001.0,
        "Max Recirc (gallons)": 3500.0,
        "Tonnage Min": 667.6666666667,
        "Tonnage Max": 1166.6666666667,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "VHS-700A Hydrocyclone Separator, 20HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a polyurethane coated channel frame base."
    }, {
        "Model": "CTS950",
        "hp": 20.0,
        "Flow Rate": 950.0,
        "Min Recirc (gallons)": 3501.0,
        "Max Recirc (gallons)": 4750.0,
        "Tonnage Min": 1167.6666666667,
        "Tonnage Max": 1583.3333333333,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "VHS-950A Hydrocyclone Separator, 20HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a polyurethane coated channel frame base."
    }, {
        "Model": "CTS1600",
        "hp": 60.0,
        "Flow Rate": 1600.0,
        "Min Recirc (gallons)": 4751.0,
        "Max Recirc (gallons)": 8000.0,
        "Tonnage Min": 1584.3333333333,
        "Tonnage Max": 2666.6666666667,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "VHS-1600A Hydrocyclone Separator, 60HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a polyurethane coated channel frame base."
    }, {
        "Model": "CTS2300",
        "hp": 60.0,
        "Flow Rate": 2300.0,
        "Min Recirc (gallons)": 8001.0,
        "Max Recirc (gallons)": 11500.0,
        "Tonnage Min": 2667.6666666667,
        "Tonnage Max": 3833.3333333333,
        "Loop Min": null,
        "Loop Max": null,
        "Description": " VHS-2300A Hydrocyclone Separator, 60HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a polyurethane coated channel frame base."
    }, {
        "Model": "CTS3400",
        "hp": 100.0,
        "Flow Rate": 3400.0,
        "Min Recirc (gallons)": 11501.0,
        "Max Recirc (gallons)": 17000.0,
        "Tonnage Min": 3834.3333333333,
        "Tonnage Max": 5666.6666666667,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "VHS-3400A Hydrocyclone Separator, 100HP bronze fitted DPPE pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, 2” Auto-purge valve, outlet throttle bronze gate valve, SCH80 PVC piping.  Mounted, wired, plumbed and tested on a polyurethane coated channel frame base."
    }, {
        "Model": "CTF200",
        "hp": 5.0,
        "Flow Rate": 100.0,
        "Min Recirc (gallons)": 0.0,
        "Max Recirc (gallons)": 2000.0,
        "Tonnage Min": 0.0,
        "Tonnage Max": 666.6666666667,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "V200PA Self-Cleaning Screen Filter, 25 micron screen, 140gpm Pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, Aquamatic 1.5\" NPT Spring Assist w/ ASCO 24vac Solenoid, NEMA 3S MF 4 station AC 120/220VAC 1PH with DP gage/switch, setpoint of 6-8 psid, 24VAC steady Output, V42 Series cast Iron diaphragm valve, 1/4\" NPT drill-tap of ports 1 & 3."
    }, {
        "Model": "CTF250",
        "hp": 7.5,
        "Flow Rate": 150.0,
        "Min Recirc (gallons)": 2001.0,
        "Max Recirc (gallons)": 3000.0,
        "Tonnage Min": 667.6666666667,
        "Tonnage Max": 1000.0,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "V250 Self-Cleaning Screen Filter, 25 micron screen, 180gpm Pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, Aquamatic 1.5\" NPT Spring Assist w/ ASCO 24vac Solenoid, NEMA 3S MF 4 station AC 120/220VAC 1PH with DP gage/switch, setpoint of 6-8 psid, 24VAC steady Output, V42 Series cast Iron diaphragm valve, 1/4\" NPT drill-tap of ports 1 & 3."
    }, {
        "Model": "CTF500",
        "hp": 15.0,
        "Flow Rate": 300.0,
        "Min Recirc (gallons)": 3001.0,
        "Max Recirc (gallons)": 6000.0,
        "Tonnage Min": 1001.0,
        "Tonnage Max": 2000.0,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "V500 Self-Cleaning Screen Filter, 25 micron screen, 360gpm Pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, Aquamatic 1.5\" NPT Spring Assist w/ ASCO 24vac Solenoid, NEMA 3S MF 4 station AC 120/220VAC 1PH with DP gage/switch, setpoint of 6-8 psid, 24VAC steady Output, V42 Series cast Iron diaphragm valve, 1/4\" NPT drill-tap of ports 1 & 3."
    }, {
        "Model": "CTF1000",
        "hp": 30.0,
        "Flow Rate": 700.0,
        "Min Recirc (gallons)": 6001.0,
        "Max Recirc (gallons)": 14000.0,
        "Tonnage Min": 2001.0,
        "Tonnage Max": 4666.6666666667,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "V1000 Self-Cleaning Screen Filter, 25 micron screen, 700gpm Pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, Aquamatic 1.5\" NPT Spring Assist w/ ASCO 24vac Solenoid, NEMA 3S MF 4 station AC 120/220VAC 1PH with DP gage/switch, setpoint of 6-8 psid, 24VAC steady Output, V42 Series cast Iron diaphragm valve, 1/4\" NPT drill-tap of ports 1 & 3."
    }, {
        "Model": "CTF1500",
        "hp": 50.0,
        "Flow Rate": 1100.0,
        "Min Recirc (gallons)": 14001.0,
        "Max Recirc (gallons)": 22000.0,
        "Tonnage Min": 4667.6666666667,
        "Tonnage Max": 7333.3333333333,
        "Loop Min": null,
        "Loop Max": null,
        "Description": "V1500 Self-Cleaning Screen Filter, 25 micron screen, 1050gpm Pump, 460VAC/3PH/60Hz NEMA 4X basic pump starter with green power available light, Aquamatic 1.5\" NPT Spring Assist w/ ASCO 24vac Solenoid, NEMA 3S MF 4 station AC 120/220VAC 1PH with DP gage/switch, setpoint of 6-8 psid, 24VAC steady Output, V42 Series cast Iron diaphragm valve, 1/4\" NPT drill-tap of ports 1 & 3."
    }, {
        "Model": "VC50",
        "hp": 1.5,
        "Flow Rate": 50.0,
        "Min Recirc (gallons)": 0.0,
        "Max Recirc (gallons)": 5000.0,
        "Tonnage Min": 7334.3333333333,
        "Tonnage Max": 1666.6666666667,
        "Loop Min": 0.0,
        "Loop Max": 190000.0,
        "Description": "Vortisand VC-50 filter, Filtration capacity 50 gpm,  1.5 HP Filter feed pump included, Filtered or city water used for backwash: 22 gpm, System shall be shipped in two parts (the vessel and the structural steel skid, urethane painted), Media shall be shipped separately, Stainless Steel 304 vessel with ASME, Sec. VIII Div.1, Backwash booster pump is not included, PVC Sch. 80 face piping, PLC included: PLC /w Touchscreen HMI, Metering pump option."
    }, {
        "Model": "VC75",
        "hp": 1.5,
        "Flow Rate": 75.0,
        "Min Recirc (gallons)": 5001.0,
        "Max Recirc (gallons)": 7500.0,
        "Tonnage Min": 1667.6666666667,
        "Tonnage Max": 2500.0,
        "Loop Min": 190001.0,
        "Loop Max": 285000.0,
        "Description": "Vortisand VC-75 filter, Filtration capacity 75 gpm,  1.5 HP Filter feed pump included, Filtered or city water used for backwash: 35 gpm, System shall be shipped in two parts (the vessel and the structural steel skid, urethane painted), Media shall be shipped separately, Stainless Steel 304 vessel with ASME, Sec. VIII Div.1, Backwash booster pump is not included, PVC Sch. 80 face piping, PLC included: PLC /w Touchscreen HMI, Metering pump option."
    }, {
        "Model": "VC100",
        "hp": 3.0,
        "Flow Rate": 100.0,
        "Min Recirc (gallons)": 7501.0,
        "Max Recirc (gallons)": 10000.0,
        "Tonnage Min": 2501.0,
        "Tonnage Max": 3333.3333333333,
        "Loop Min": 285001.0,
        "Loop Max": 380000.0,
        "Description": "Vortisand VC-100 filter, Filtration capacity 100 gpm,  2.0 HP Filter feed pump included, Filtered or city water used for backwash: 50 gpm, System shall be shipped in two parts (the vessel and the structural steel skid, urethane painted), Media shall be shipped separately, Stainless Steel 304 vessel with ASME, Sec. VIII Div.1, Backwash booster pump is not included, PVC Sch. 80 face piping, PLC included: PLC /w Touchscreen HMI, Metering pump option."
    }, {
        "Model": "VC140",
        "hp": 3.0,
        "Flow Rate": 140.0,
        "Min Recirc (gallons)": 10001.0,
        "Max Recirc (gallons)": 14000.0,
        "Tonnage Min": 3334.3333333333,
        "Tonnage Max": 4666.6666666667,
        "Loop Min": 380001.0,
        "Loop Max": 532000.0,
        "Description": "Vortisand VC-140 filter, Filtration capacity 140 gpm,  3.0 HP Filter feed pump included, Filtered or city water used for backwash: 50 gpm, System shall be shipped in two parts (the vessel and the structural steel skid, urethane painted), Media shall be shipped separately, Stainless Steel 304 vessel with ASME, Sec. VIII Div.1, Backwash booster pump is not included, PVC Sch. 80 face piping, PLC included: PLC /w Touchscreen HMI, Metering pump option."
    }, {
        "Model": "VC200",
        "hp": 5.0,
        "Flow Rate": 200.0,
        "Min Recirc (gallons)": 14001.0,
        "Max Recirc (gallons)": 20000.0,
        "Tonnage Min": 4667.6666666667,
        "Tonnage Max": 6666.6666666667,
        "Loop Min": 532001.0,
        "Loop Max": 760000.0,
        "Description": "Vortisand VC-200 filter, Filtration capacity 200 gpm,  5.0 HP Filter feed pump included, Filtered or city water used for backwash: 100 gpm, System shall be shipped in two parts (the vessel and the structural steel skid, urethane painted), Media shall be shipped separately, Stainless Steel 304 vessel with ASME, Sec. VIII Div.1, Backwash booster pump is not included, PVC Sch. 80 face piping, PLC included: PLC /w Touchscreen HMI, Metering pump option."
    }, {
        "Model": "VC280",
        "hp": 7.5,
        "Flow Rate": 280.0,
        "Min Recirc (gallons)": 20001.0,
        "Max Recirc (gallons)": 28000.0,
        "Tonnage Min": 6667.6666666667,
        "Tonnage Max": 9333.3333333333,
        "Loop Min": 760001.0,
        "Loop Max": 1064000.0,
        "Description": "Vortisand VC-240 filter, Filtration capacity 240 gpm,  5.0 HP Filter feed pump included, Filtered or city water used for backwash: 100 gpm, System shall be shipped in two parts (the vessel and the structural steel skid, urethane painted), Media shall be shipped separately, Stainless Steel 304 vessel with ASME, Sec. VIII Div.1, Backwash booster pump is not included, PVC Sch. 80 face piping, PLC included: PLC /w Touchscreen HMI, Metering pump option."
    }, {
        "Model": "VC350",
        "hp": 10.0,
        "Flow Rate": 350.0,
        "Min Recirc (gallons)": 28001.0,
        "Max Recirc (gallons)": 35000.0,
        "Tonnage Min": 9334.3333333333,
        "Tonnage Max": 11666.6666666667,
        "Loop Min": 1064001.0,
        "Loop Max": 1330000.0,
        "Description": "Vortisand VC-280 filter, Filtration capacity 280 gpm,  5.0 HP Filter feed pump included, Filtered or city water used for backwash: 100 gpm, System shall be shipped in two parts (the vessel and the structural steel skid, urethane painted), Media shall be shipped separately, Stainless Steel 304 vessel with ASME, Sec. VIII Div.1, Backwash booster pump is not included, PVC Sch. 80 face piping, PLC included: PLC /w Touchscreen HMI, Metering pump option."
    }, {
        "Model": "VC600",
        "hp": 15.0,
        "Flow Rate": 600.0,
        "Min Recirc (gallons)": 35001.0,
        "Max Recirc (gallons)": 60000.0,
        "Tonnage Min": 11667.6666666667,
        "Tonnage Max": 20000.0,
        "Loop Min": 1330001.0,
        "Loop Max": 2280000.0,
        "Description": "Vortisand VC-350 filter, Filtration capacity 350 gpm,  10 HP Filter feed pump included, Filtered or city water used for backwash: 100 gpm, System shall be shipped in two parts (the vessel and the structural steel skid, urethane painted), Media shall be shipped separately, Stainless Steel 304 vessel with ASME, Sec. VIII Div.1, Backwash booster pump is not included, PVC Sch. 80 face piping, PLC included: PLC /w Touchscreen HMI, Metering pump option."
    }];

    let database = [];

    function processDatabase() {
        // This function processes the raw JSON data and prepares it for the application.
        database = jsonData.filter(row => row.Model).map(row => {
            const newRow = {};

            // --- FIX 1: INFER FILTER TYPE FROM MODEL NAME ---
            if (row.Model.startsWith('LCS') || row.Model.startsWith('CTS')) {
                newRow.Type = 'separator';
            } else if (row.Model.startsWith('CTF')) {
                newRow.Type = 'vaf';
            } else if (row.Model.startsWith('VC')) {
                newRow.Type = 'vortisand';
            } else {
                newRow.Type = 'unknown';
            }
            
            // --- FIX 2: CALCULATE KWH FROM HP ---
            // 1 HP = 0.746 kW. This creates the 'Electrical Usage (kWh)' the script needs.
            const hp = parseFloat(row.hp);
            newRow['Electrical Usage (kWh)'] = isNaN(hp) ? NaN : hp * 0.746;

            // --- FIX 3: MAP JSON FIELDS TO SCRIPT'S EXPECTED FIELDS ---
            // This ensures the rest of the script finds the data it's looking for.
            newRow.Model = row.Model;
            newRow.Description = row.Description || row['Unnamed: 9'] || 'N/A'; // Handle old "Unnamed: 9" key
            newRow['Flowrate (GPM)'] = parseFloat(row['Flow Rate']);
            
            // Open System Parameters
            newRow['Min Recirc Rate (GPM)'] = parseFloat(row['Min Recirc (gallons)']);
            newRow['Max Recirc Rate (GPM)'] = parseFloat(row['Max Recirc (gallons)']); // Corrected key with no leading space
            newRow['Tonnage Min'] = parseFloat(row['Tonnage Min']);
            newRow['Tonnage Max'] = parseFloat(row['Tonnage Max']);

            // Closed System Parameters
            newRow['Loop Min (gal)'] = parseFloat(row['Loop Min']); // Corrected key with no leading space
            newRow['Loop Max (gal)'] = parseFloat(row['Loop Max']);

            return newRow;
        });

        console.log("Database processed successfully. Number of rows:", database.length);
        if (database.length > 0) {
            console.log("First processed row:", database[0]);
        }
    }

    processDatabase();

    function toggleInputs() {
        openSystemInputs.classList.add('hidden');
        closedSystemInputs.classList.add('hidden');
        electricalCostSection.classList.add('hidden');
        resultsSection.classList.add('hidden');
        noResultsMessage.classList.add('hidden');

        if (radioOpen.checked) {
            openSystemInputs.classList.remove('hidden');
            electricalCostSection.classList.remove('hidden');
        } else if (radioClosed.checked) {
            closedSystemInputs.classList.remove('hidden');
            electricalCostSection.classList.remove('hidden');
        }
    }

    radioOpen.addEventListener('change', toggleInputs);
    radioClosed.addEventListener('change', toggleInputs);

    calculateButton.addEventListener('click', () => {
        if (!database || database.length === 0) {
            noResultsMessage.textContent = "Database is not loaded or is empty. Please check for errors.";
            noResultsMessage.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            return;
        }

        const systemType = radioOpen.checked ? 'open' : (radioClosed.checked ? 'closed' : null);
        const electricalCost = parseFloat(electricalCostInput.value);

        if (!systemType) {
            alert("Please select a system type (Open or Closed).");
            return;
        }
        if (isNaN(electricalCost) || electricalCost < 0) {
            alert("Please enter a valid Electrical Cost (must be a non-negative number).");
            return;
        }

        let recircRateVal = NaN;
        let tonnageVal = NaN;
        let closedSystemVolumeVal = NaN;

        if (systemType === 'open') {
            recircRateVal = parseFloat(recircRateInput.value);
            tonnageVal = parseFloat(tonnageInput.value);
            if (isNaN(recircRateVal) && isNaN(tonnageVal)) {
                alert("For Open systems, please enter either Recirculation Rate or Tonnage.");
                return;
            }
            if (!isNaN(recircRateVal) && recircRateVal <= 0) {
                alert("Recirculation Rate must be a positive number if entered.");
                return;
            }
            if (!isNaN(tonnageVal) && tonnageVal <= 0) {
                alert("Tonnage must be a positive number if entered.");
                return;
            }
        } else { // closed system
            closedSystemVolumeVal = parseFloat(closedSystemVolumeInput.value);
            if (isNaN(closedSystemVolumeVal) || closedSystemVolumeVal <= 0) {
                alert("For Closed systems, please enter a valid, positive System Volume.");
                return;
            }
        }
        findAndDisplayModels(systemType, recircRateVal, tonnageVal, closedSystemVolumeVal, electricalCost);
    });

    function findAndDisplayModels(systemType, recircRate, tonnage, closedVolume, elecCost) {
        let separatorModel = null;
        let vafModel = null;
        let vortisandModel = null;
        
        for (const row of database) {
            if (!row || !row.Model) continue;
            
            let match = false;
            
            if (systemType === 'open') {
                const useRecirc = !isNaN(recircRate);
                const useTonnage = !isNaN(tonnage);
                
                const rowMinRecirc = row["Min Recirc Rate (GPM)"];
                const rowMaxRecirc = row["Max Recirc Rate (GPM)"];
                const rowTonnageMin = row["Tonnage Min"];
                const rowTonnageMax = row["Tonnage Max"];
                
                // Match if user's recirc rate is within the model's range
                if (useRecirc && typeof rowMinRecirc === 'number' && typeof rowMaxRecirc === 'number' && recircRate >= rowMinRecirc && recircRate <= rowMaxRecirc) {
                    match = true;
                }
                
                // Or if user's tonnage is within the model's range
                if (!match && useTonnage && typeof rowTonnageMin === 'number' && typeof rowTonnageMax === 'number' && tonnage >= rowTonnageMin && tonnage <= rowTonnageMax) {
                    match = true;
                }
            } else { // systemType === 'closed'
                const rowLoopMin = row["Loop Min (gal)"];
                const rowLoopMax = row["Loop Max (gal)"];

                if (typeof rowLoopMin === 'number' && typeof rowLoopMax === 'number' && closedVolume >= rowLoopMin && closedVolume <= rowLoopMax) {
                    match = true;
                }
            }

            if (match) {
                if (row.Type === 'separator' && !separatorModel) {
                    separatorModel = row;
                } else if (row.Type === 'vaf' && !vafModel) {
                    vafModel = row;
                } else if (row.Type === 'vortisand' && !vortisandModel) {
                    vortisandModel = row;
                }
            }
        }
        displayResults(separatorModel, vafModel, vortisandModel, elecCost);
    }

    function displayResults(separator, vaf, vortisand, elecCost) {
        resultsSection.classList.remove('hidden');
        noResultsMessage.classList.add('hidden');
        let anyModelFound = false;

        function updateColumn(typeKey, modelData) {
            const modelEl = document.getElementById(`${typeKey}Model`);
            const flowrateEl = document.getElementById(`${typeKey}Flowrate`);
            const descriptionEl = document.getElementById(`${typeKey}Description`);
            const opCostEl = document.getElementById(`${typeKey}OpCost`);

            if (modelData) {
                modelEl.textContent = modelData.Model || 'N/A';
                flowrateEl.textContent = modelData["Flowrate (GPM)"] != null && !isNaN(modelData["Flowrate (GPM)"]) ? modelData["Flowrate (GPM)"] : 'N/A';
                descriptionEl.textContent = modelData.Description || 'N/A';
                const usage = modelData["Electrical Usage (kWh)"];
                const cost = !isNaN(usage) && !isNaN(elecCost) ? (usage * elecCost).toFixed(2) : 'N/A';
                opCostEl.textContent = cost;
                return true;
            } else {
                modelEl.textContent = '-';
                flowrateEl.textContent = '-';
                descriptionEl.textContent = 'No suitable model found';
                opCostEl.textContent = '-';
                return false;
            }
        }

        if (updateColumn('separator', separator)) anyModelFound = true;
        if (updateColumn('vaf', vaf)) anyModelFound = true;
        if (updateColumn('vortisand', vortisand)) anyModelFound = true;

        if (!anyModelFound) {
            noResultsMessage.textContent = "No suitable models found for the given criteria across all categories.";
            noResultsMessage.classList.remove('hidden');
        }
    }
    
    // Initialize the view
    toggleInputs();
});
