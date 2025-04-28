document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'http://localhost:3000'; // Adjust if backend runs elsewhere

    // --- DOM Elements ---
    const entryForm = document.getElementById('entry-form');
    const entryType = document.getElementById('entry-type');
    const entryName = document.getElementById('entry-name');
    const entryCategory = document.getElementById('entry-category');
    const entryDescription = document.getElementById('entry-description');
    const entryAmount = document.getElementById('entry-amount');
    const recordVoiceBtn = document.getElementById('record-voice-btn');
    const voiceStatus = document.getElementById('voice-status');

    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const filterBtn = document.getElementById('filter-btn');
    const clearFilterBtn = document.getElementById('clear-filter-btn');

    const entriesTbody = document.getElementById('entries-tbody');
    const tableStatus = document.getElementById('table-status');
    const chartsStatus = document.getElementById('charts-status');

    const categoryPieCtx = document.getElementById('category-pie-chart').getContext('2d');
    const categoryBarCtx = document.getElementById('category-bar-chart').getContext('2d');

    // --- Chart Instances ---
    let categoryPieChart = null;
    let categoryBarChart = null;

    // --- Web Speech API Setup ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        // Set language to Spanish (Spain)
        // You can change this to other Spanish locales like 'es-MX' (Mexico), 'es-AR' (Argentina), etc.
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            voiceStatus.textContent = `Heard: "${transcript}". Analyzing...`;
            analyzeVoiceTranscript(transcript);
            recordVoiceBtn.disabled = false;
            recordVoiceBtn.textContent = 'Add via Voice';
        };

        recognition.onspeechend = () => {
            recognition.stop();
            // voiceStatus.textContent = 'Finished recording.'; // Keep analyzing message
        };

        recognition.onerror = (event) => {
            voiceStatus.textContent = `Speech recognition error: ${event.error}`;
            console.error('Speech recognition error:', event);
            recordVoiceBtn.disabled = false;
            recordVoiceBtn.textContent = 'Add via Voice';
        };

        recognition.onnomatch = () => {
            voiceStatus.textContent = 'Speech not recognized. Please try again.';
            recordVoiceBtn.disabled = false;
            recordVoiceBtn.textContent = 'Add via Voice';
        };

    } else {
        recordVoiceBtn.disabled = true;
        recordVoiceBtn.title = "Web Speech API not supported in this browser.";
        voiceStatus.textContent = 'Voice input not supported.';
        console.warn('Web Speech API not supported.');
    }

    // --- API Functions ---
    async function fetchEntries(startDate = null, endDate = null) {
        let url = `${API_BASE_URL}/entries`;
        if (startDate && endDate) {
            url += `?start=${startDate}&end=${endDate}`;
        }
        tableStatus.textContent = 'Loading entries...';
        chartsStatus.textContent = 'Loading analysis...';
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const entries = await response.json();
            tableStatus.textContent = '';
            chartsStatus.textContent = '';
            return entries;
        } catch (error) {
            console.error('Error fetching entries:', error);
            tableStatus.textContent = 'Error loading entries.';
            chartsStatus.textContent = 'Error loading analysis.';
            return []; // Return empty array on error
        }
    }

    async function addEntry(entryData) {
        try {
            const response = await fetch(`${API_BASE_URL}/entries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entryData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error adding entry:', error);
            alert(`Error adding entry: ${error.message}`); // Show error to user
            return null;
        }
    }

    async function analyzeVoiceTranscript(transcript) {
        voiceStatus.textContent = 'Analyzing transcript with AI...';
        try {
            const response = await fetch(`${API_BASE_URL}/analyze-voice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ transcript }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            if (data.error) {
                 throw new Error(`AI Analysis Error: ${data.error}`);
            }

            // Populate form with analyzed data
            populateForm(data);
            voiceStatus.textContent = 'Voice analysis complete. Please review and submit.';

        } catch (error) {
            console.error('Error analyzing voice:', error);
            voiceStatus.textContent = `Error: ${error.message}`; // Show specific error
            recordVoiceBtn.disabled = false;
            recordVoiceBtn.textContent = 'Add via Voice';
        }
    }

    // --- UI Update Functions ---
    function renderTable(entries) {
        entriesTbody.innerHTML = ''; // Clear existing rows
        if (entries.length === 0) {
            entriesTbody.innerHTML = '<tr><td colspan="6">No entries found.</td></tr>';
            return;
        }

        entries.forEach(entry => {
            const row = entriesTbody.insertRow();
            const formattedDate = new Date(entry.date_created).toLocaleDateString();
            const formattedAmount = entry.amount.toFixed(2);

            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${entry.type}</td>
                <td>${entry.name}</td>
                <td>${entry.category || '-'}</td>
                <td>${formattedAmount}</td>
                <td>${entry.description || '-'}</td>
            `;
        });
    }

    function updateCharts(entries) {
        if (categoryPieChart) categoryPieChart.destroy();
        if (categoryBarChart) categoryBarChart.destroy();

        if (entries.length === 0) {
            chartsStatus.textContent = 'No data available for charts.';
            return;
        }
        chartsStatus.textContent = '';

        // Aggregate data by category (only expenses for pie/bar charts)
        const expenses = entries.filter(e => e.type === 'expense');
        const categoryTotals = expenses.reduce((acc, entry) => {
            const category = entry.category || 'Uncategorized';
            acc[category] = (acc[category] || 0) + entry.amount;
            return acc;
        }, {});

        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);

        if (labels.length === 0) {
             chartsStatus.textContent = 'No expense data available for charts.';
             return;
        }

        // Generate random colors for charts
        const backgroundColors = labels.map(() => `hsl(${Math.random() * 360}, 70%, 70%)`);

        // Pie Chart: Percentage per category
        categoryPieChart = new Chart(categoryPieCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expenses by Category',
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Expense Distribution by Category'
                    }
                }
            }
        });

        // Bar Chart: Total amount per category
        categoryBarChart = new Chart(categoryBarCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Expenses',
                    data: data,
                    backgroundColor: backgroundColors,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Total Expenses per Category'
                    },
                    legend: {
                        display: false // Hide legend as labels are on axis
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount'
                        }
                    }
                }
            }
        });
    }

    function populateForm(data) {
        entryType.value = data.type || 'expense';
        entryName.value = data.name || '';
        entryCategory.value = data.category || '';
        entryDescription.value = data.description || '';
        entryAmount.value = data.amount || '';
    }

    function clearForm() {
        entryForm.reset();
        voiceStatus.textContent = ''; // Clear voice status too
    }

    // --- Event Listeners ---
    entryForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(entryForm);
        const entryData = {
            type: formData.get('type'),
            name: formData.get('name'),
            category: formData.get('category') || null, // Send null if empty
            description: formData.get('description') || null, // Send null if empty
            amount: parseFloat(formData.get('amount')),
        };

        // Basic client-side validation (complementary to backend)
        if (isNaN(entryData.amount) || entryData.amount <= 0) {
            alert('Please enter a valid positive amount.');
            return;
        }

        const addedEntry = await addEntry(entryData);
        if (addedEntry) {
            clearForm();
            loadAndRenderData(); // Refresh data after adding
        }
    });

    recordVoiceBtn.addEventListener('click', () => {
        if (!recognition) return;

        try {
            recordVoiceBtn.disabled = true;
            recordVoiceBtn.textContent = 'Listening...';
            voiceStatus.textContent = 'Recording... Speak now.';
            recognition.start();
        } catch (error) {
            // Handle cases where recognition might already be running (though continuous is false)
            console.error("Error starting recognition:", error);
            voiceStatus.textContent = 'Could not start voice recording.';
            recordVoiceBtn.disabled = false;
            recordVoiceBtn.textContent = 'Add via Voice';
        }
    });

    filterBtn.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        if (startDate && endDate) {
            loadAndRenderData(startDate, endDate);
        } else {
            alert('Please select both a start and end date for filtering.');
        }
    });

    clearFilterBtn.addEventListener('click', () => {
        startDateInput.value = '';
        endDateInput.value = '';
        loadAndRenderData(); // Load all data
    });

    // --- Initial Load ---
    async function loadAndRenderData(startDate = null, endDate = null) {
        const entries = await fetchEntries(startDate, endDate);
        renderTable(entries);
        updateCharts(entries);
    }

    loadAndRenderData(); // Load initial data when the page loads

});
