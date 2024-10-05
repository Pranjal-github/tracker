const lectureContainer = document.getElementById('lectureContainer');
const modal = document.getElementById('chapterModal');
let timerInterval;
let timerType = 'pomodoro';
let startTime;
let elapsedTime = 0;
let isPaused = false;
let currentMode = 'work';
let sessionCount = 0;
let tasks = JSON.parse(localStorage.getItem('tasks')) || {};
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let subjects = JSON.parse(localStorage.getItem('subjects')) || ['math', 'chemistry', 'physics', 'organic', 'inorganic'];

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Function to add a chapter for the selected subject
function addChapter() {
    const chapterName = document.getElementById('chapter-name').value.trim();
    const lectureLink = document.getElementById('lecture-link').value.trim();
    const totalLectures = document.getElementById('total-lectures').value.trim();
    const currentLecture = document.getElementById('current-lecture').value.trim();
    const subject = document.getElementById('subject-select').value;

    if (chapterName && lectureLink && totalLectures) {
        if (confirm(`Are you sure you want to add the chapter: ${chapterName}?`)) {
            const chapterData = {
                name: chapterName,
                link: lectureLink,
                current: currentLecture || 0,
                total: totalLectures
            };

            saveChapterData(subject, chapterData);
            renderChapters(subject);
            clearInputs();
        }
    }
}

// Function to open a lecture link in a new tab
function openLecture(url) {
    window.open(url, '_blank');
}

// Function to save chapter data to local storage
function saveChapterData(subject, chapterData) {
    const existingData = JSON.parse(localStorage.getItem(subject)) || [];
    existingData.push(chapterData);
    localStorage.setItem(subject, JSON.stringify(existingData));
}

// Function to load chapters from specified folders
function loadChapters() {
    const folderPaths = JSON.parse(localStorage.getItem('folderPaths')) || {};
    const subjects = ['math', 'chemistry', 'physics', 'organic', 'inorganic'];

    subjects.forEach(subject => {
        const folderPath = folderPaths[subject];
        if (folderPath) {
            fetchChaptersFromFolder(subject, folderPath);
        } else {
            renderChapters(subject);
        }
    });
}

// Function to fetch chapters from a folder
function fetchChaptersFromFolder(subject, folderPath) {
    console.log(`Fetching chapters for ${subject} from ${folderPath}`);
    fetch(`http://localhost:3000/api/listFolders?path=${encodeURIComponent(folderPath)}`)
        .then(response => response.json())
        .then(data => {
            console.log(`Fetched chapters for ${subject}:`, data);
            const chapters = data.folders.map(folder => ({
                name: folder.name,
                link: folder.path,
                current: 0,
                total: 0
            }));
            localStorage.setItem(subject, JSON.stringify(chapters));
            renderChapters(subject);
        })
        .catch(error => console.error('Error fetching chapters:', error));
}

// Function to render chapters for a specific subject
function renderChapters(subject) {
    const subjectSection = document.getElementById(`${subject}-chapters`);
    if (!subjectSection) {
        console.error(`Subject section for ${subject} not found`);
        return;
    }
    subjectSection.innerHTML = '';
    const chapters = JSON.parse(localStorage.getItem(subject)) || [];
    
    chapters.forEach((chapter, index) => {
        const newChapter = document.createElement('div');
        newChapter.className = 'chapter';
        newChapter.innerHTML = `
            <span class="chapter-name" onclick="openLecture('${chapter.link}')">${chapter.name}</span>
            <div class="lecture-status">
                Current Lecture: <input type="number" value="${chapter.current}" min="0" max="${chapter.total}" onchange="updateCurrentLecture('${subject}', ${index}, this.value)" />
                / ${chapter.total}
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${(chapter.current / chapter.total) * 100}%"></div>
            </div>
            <button onclick="removeChapter('${subject}', ${index})">Remove</button>
        `;
        subjectSection.appendChild(newChapter);
    });
}

// Function to update the current lecture and auto-save it
function updateCurrentLecture(subject, index, newValue) {
    const chapters = JSON.parse(localStorage.getItem(subject)) || [];
    if (chapters[index]) {
        chapters[index].current = parseInt(newValue, 10);
        localStorage.setItem(subject, JSON.stringify(chapters));
        renderChapters(subject); // Re-render to update the progress bar
    }
}

// Function to fetch files in a chapter folder
function fetchFilesInChapter(folderPath, fileListId) {
    console.log(`Fetching files in chapter folder: ${folderPath}`);
    fetch(`http://localhost:3000/api/listFiles?path=${encodeURIComponent(folderPath)}`)
        .then(response => response.json())
        .then(data => {
            console.log(`Fetched files for ${fileListId}:`, data);
            const fileList = document.getElementById(fileListId);
            data.files.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `<a href="${file.path}" target="_blank">${file.name}</a>`;
                fileList.appendChild(fileItem);
            });
        })
        .catch(error => console.error('Error fetching files:', error));
}

// Function to update current lecture count
function updateLecture(subject, index, newCurrent) {
    const chapters = JSON.parse(localStorage.getItem(subject));
    if (chapters) {
        chapters[index].current = newCurrent;
        localStorage.setItem(subject, JSON.stringify(chapters));
    }
}

// Function to remove a chapter
function removeChapter(subject, index) {
    if (confirm('Are you sure you want to remove this chapter?')) {
        const chapters = JSON.parse(localStorage.getItem(subject));
        if (chapters) {
            chapters.splice(index, 1);
            localStorage.setItem(subject, JSON.stringify(chapters));
            renderChapters(subject);
        }
    }
}

// Clear input fields after adding a chapter
function clearInputs() {
    document.getElementById('chapter-name').value = '';
    document.getElementById('lecture-link').value = '';
    document.getElementById('total-lectures').value = '';
    document.getElementById('current-lecture').value = '';
}

// Function to export data to a JSON file
function exportData() {
    const exportData = {
        subjects: subjects, // Include subjects in the export
        todos: JSON.parse(localStorage.getItem('todos')) || [],
        calendarTasks: JSON.parse(localStorage.getItem('tasks')) || {}
    };

    // Export chapters and resources for each subject
    subjects.forEach(subject => {
        exportData[subject] = {
            chapters: JSON.parse(localStorage.getItem(subject)) || [],
            resources: JSON.parse(localStorage.getItem(`${subject}-resources`)) || []
        };
    });

    // Include to-do list data
    exportData['todos'] = JSON.parse(localStorage.getItem('todos')) || [];

    // Include calendar tasks
    exportData['calendarTasks'] = JSON.parse(localStorage.getItem('tasks')) || {};

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lecture-tracker.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Function to import data from a JSON file
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const data = JSON.parse(event.target.result);

            // Import subjects
            if (data.subjects) {
                subjects = data.subjects;
                localStorage.setItem('subjects', JSON.stringify(subjects));
                renderSubjectList();
                updateSubjectOptions();
                renderSubjectContainers();
            }

            // Import chapters and resources for each subject
            subjects.forEach(subject => {
                if (data[subject]) {
                    if (data[subject].chapters) {
                        localStorage.setItem(subject, JSON.stringify(data[subject].chapters));
                        renderChapters(subject);
                    }
                    if (data[subject].resources) {
                        localStorage.setItem(`${subject}-resources`, JSON.stringify(data[subject].resources));
                        renderResources(subject);
                    }
                }
            });

            if (data.todos) {
                localStorage.setItem('todos', JSON.stringify(data.todos));
                loadTodoTasks();
            }

            if (data.calendarTasks) {
                localStorage.setItem('tasks', JSON.stringify(data.calendarTasks));
                renderCalendar();
            }
        };
        reader.readAsText(file);
    }
}

// Function to toggle settings popup
function toggleSettingsPopup() {
    const popupArea = document.getElementById('settings-popup-area');
    popupArea.style.display = popupArea.style.display === 'none' ? 'flex' : 'none'; // Toggle display
}

// Function to toggle to-do popup
function toggleTodoPopup() {
    const popup = document.getElementById('todo-popup');
    popup.style.display = popup.style.display === 'none' ? 'flex' : 'none';
}

// Function to maximize the popup area
function maximizePopup() {
    const popup = document.querySelector('.popuptodo');
    popup.classList.toggle('maximized');
}

// Function to edit a task
function editTask(index) {
    const todoItems = JSON.parse(localStorage.getItem('todos'));
    const task = todoItems[index];

    document.getElementById('todo-input').value = task.taskText;
    document.getElementById('todo-due-date').value = task.dueDate;
    document.getElementById('todo-priority').value = task.priority;

    todoItems.splice(index, 1);
    localStorage.setItem('todos', JSON.stringify(todoItems));
    renderTasks(todoItems);
}

// Function to remove a task
function removeTask(index) {
    const todoItems = JSON.parse(localStorage.getItem('todos'));
    todoItems.splice(index, 1);
    localStorage.setItem('todos', JSON.stringify(todoItems));
    renderTasks(todoItems);
}

// Function to toggle to-do list display format
function toggleTodoDisplay(format) {
    const todoList = document.getElementById('todo-list');
    const todoTable = document.getElementById('todo-table');
    if (format === 'table') {
        todoList.style.display = 'none';
        todoTable.style.display = 'table';
    } else {
        todoList.style.display = 'block';
        todoTable.style.display = 'none';
    }
    localStorage.setItem('todoDisplayFormat', format);
}

// Function to switch theme
function switchTheme(theme) {
    document.body.className = theme;
    document.querySelectorAll('header, .subject-section, button, .modal-content, .popup, .resource-box').forEach(el => {
        el.classList.toggle('dark-mode', theme === 'dark-mode');
    });
    localStorage.setItem('theme', theme);
}

// Function to load theme from local storage
function loadTheme() {
    const theme = localStorage.getItem('theme') || 'default';
    switchTheme(theme);
}

// Function to load tasks from local storage
function loadTasks() {
    const todoItems = JSON.parse(localStorage.getItem('todos')) || [];
    renderTasks(todoItems);
}

// Function to render tasks
function renderTasks(todoItems) {
    const todoList = document.getElementById('todo-list');
    const todoTableBody = document.getElementById('todo-table-body');
    todoList.innerHTML = '';
    todoTableBody.innerHTML = '';

    todoItems.forEach((task, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${task.taskText} - ${task.dueDate} - ${task.priority}</span>
            <button onclick="editTask(${index})">Edit</button>
            <button onclick="removeTask(${index})">Remove</button>
        `;
        todoList.appendChild(listItem);

        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
            <td>${task.taskText}</td>
            <td>${task.dueDate}</td>
            <td>${task.priority}</td>
            <td class="task-actions">
                <button onclick="editTask(${index})">Edit</button>
                <button onclick="removeTask(${index})">Remove</button>
            </td>
        `;
        todoTableBody.appendChild(tableRow);
    });
}

// Function to add a resource for the selected subject
function addResource() {
    const resourceName = document.getElementById('resource-name').value.trim();
    const resourceLink = document.getElementById('resource-link').value.trim();
    const subject = document.getElementById('resource-subject-select').value;

    if (resourceName && resourceLink) {
        const resourceData = {
            name: resourceName,
            link: resourceLink
        };

        // Save resource data to local storage
        saveResourceData(subject, resourceData);
        renderResources(subject);
        clearResourceInputs();
    }
}

// Function to save resource data to local storage
function saveResourceData(subject, resourceData) {
    const existingData = JSON.parse(localStorage.getItem(`${subject}-resources`)) || [];
    existingData.push(resourceData);
    localStorage.setItem(`${subject}-resources`, JSON.stringify(existingData));
}

// Function to load resources from local storage
function loadResources() {
    const subjects = ['math', 'chemistry', 'physics', 'organic', 'inorganic'];
    subjects.forEach(subject => {
        renderResources(subject);
    });
}

// Function to render resources for a specific subject
function renderResources(subject) {
    const resourceSection = document.getElementById(`${subject}-resources`);
    resourceSection.innerHTML = `<h3>${subject.charAt(0).toUpperCase() + subject.slice(1)} Resources</h3>`;
    const resources = JSON.parse(localStorage.getItem(`${subject}-resources`)) || [];
    
    resources.forEach((resource, index) => {
        const newResource = document.createElement('div');
        newResource.className = 'resource';
        newResource.innerHTML = `
            <span class="resource-name" onclick="openResource('${resource.link}')">${resource.name}</span>
            <button onclick="removeResource('${subject}', ${index})">Remove</button>
        `;

        resourceSection.appendChild(newResource);
    });
}

// Function to open a resource link in a new tab
function openResource(url) {
    window.open(url, '_blank');
}

// Function to remove a resource
function removeResource(subject, index) {
    const resources = JSON.parse(localStorage.getItem(`${subject}-resources`));
    if (resources) {
        resources.splice(index, 1);
        localStorage.setItem(`${subject}-resources`, JSON.stringify(resources));
        renderResources(subject);
    }
}

// Clear input fields after adding a resource
function clearResourceInputs() {
    document.getElementById('resource-name').value = '';
    document.getElementById('resource-link').value = '';
}

// Function to toggle PDF Notes popup
function togglePdfNotesPopup() {
    const popup = document.getElementById('pdf-notes-popup');
    popup.style.display = popup.style.display === 'none' ? 'flex' : 'none';
    if (popup.style.display === 'flex') {
        loadPdfNotes();
    }
}

// Function to load PDF notes
function loadPdfNotes() {
    const folderPaths = JSON.parse(localStorage.getItem('folderPaths')) || {};
    const subjects = ['math', 'chemistry', 'physics', 'organic', 'inorganic'];
    const pdfNotesContainer = document.getElementById('pdf-notes-container');
    pdfNotesContainer.innerHTML = '';

    subjects.forEach(subject => {
        const folderPath = folderPaths[subject];
        if (folderPath) {
            fetch(`http://localhost:3000/api/listFiles?path=${encodeURIComponent(folderPath)}`)
                .then(response => response.json())
                .then(data => {
                    const subjectSection = document.createElement('div');
                    subjectSection.className = 'subject-section';
                    subjectSection.innerHTML = `<h3>${subject.charAt(0).toUpperCase() + subject.slice(1)} PDF Notes</h3>`;
                    data.files.forEach(file => {
                        const fileItem = document.createElement('div');
                        fileItem.className = 'file-item';
                        fileItem.innerHTML = `<a href="${file.path}" target="_blank">${file.name}</a>`;
                        subjectSection.appendChild(fileItem);
                    });
                    pdfNotesContainer.appendChild(subjectSection);
                })
                .catch(error => console.error('Error fetching PDF notes:', error));
        }
    });
}

// Load resources on page load
window.onload = function() {
    loadTheme();
    loadChapters();
    loadTasks();
    loadResources();
};

// Update the existing openModal and closeModal calls
document.querySelectorAll('.open-chapter-modal').forEach(button => {
    button.addEventListener('click', () => openModal('chapterModal'));
});

document.querySelectorAll('.open-resource-modal').forEach(button => {
    button.addEventListener('click', () => openModal('resourceModal'));
});

document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', () => closeModal(button.dataset.modalId));
});

// Function to save folder paths to local storage
function saveFolderPaths() {
    const folderPaths = {
        math: document.getElementById('math-folder').value.trim(),
        physics: document.getElementById('physics-folder').value.trim(),
        chemistry: document.getElementById('chemistry-folder').value.trim(),
        organic: document.getElementById('organic-folder').value.trim(),
        inorganic: document.getElementById('inorganic-folder').value.trim()
    };
    localStorage.setItem('folderPaths', JSON.stringify(folderPaths));
    alert('Folder paths saved successfully!');
}

// Function to add a task
function addTask() {
    const title = document.getElementById('todo-input').value.trim();
    const dueDate = document.getElementById('todo-due-date').value;
    const priority = document.getElementById('todo-priority').value;

    if (title) {
        const task = {
            title,
            dueDate,
            priority,
            completed: false
        };

        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        todos.push(task);
        localStorage.setItem('todos', JSON.stringify(todos));
        loadTasks(); // Refresh the task list
        clearTodoInputs(); // Clear input fields after adding
    }
}

function clearTodoInputs() {
    document.getElementById('todo-input').value = '';
    document.getElementById('todo-due-date').value = '';
    document.getElementById('todo-priority').value = 'Medium';
}

function loadTasks() {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';

    todos.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.innerHTML = `
            <div class="task-details">
                <span>${task.title}</span>
                <span>${task.dueDate}</span>
                <span>${task.priority}</span>
            </div>
            <button onclick="toggleTodoComplete(${index})">${task.completed ? 'Uncheck' : 'Check'}</button>
            <button onclick="editTodoTask(${index})">Edit</button>
            <button onclick="removeTodoTask(${index})">Remove</button>
        `;
        todoList.appendChild(li);
    });
}

function toggleTodoComplete(index) {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    todos[index].completed = !todos[index].completed;
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTasks();
}

function editTodoTask(index) {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    const newTitle = prompt('Edit Task Title', todos[index].title);
    const newDueDate = prompt('Edit Due Date', todos[index].dueDate);
    const newPriority = prompt('Edit Priority', todos[index].priority);

    if (newTitle !== null) todos[index].title = newTitle;
    if (newDueDate !== null) todos[index].dueDate = newDueDate;
    if (newPriority !== null) todos[index].priority = newPriority;

    localStorage.setItem('todos', JSON.stringify(todos));
    loadTasks();
}

function removeTodoTask(index) {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    todos.splice(index, 1);
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTasks();
}

// Function to show a popup
function showPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'flex'; // Use flex to center content
    }
}

// Function to hide a popup
function hidePopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.style.display = 'none';
    }
}


document.getElementById('closeAddChapterPopup').addEventListener('click', () => {
    hidePopup('addChapterPopup');
});

// ... similar setup for resources popup ...

// Function to toggle timetable popup
function toggleTimetablePopup() {
    const popup = document.getElementById('timetable-popup');
    popup.style.display = popup.style.display === 'none' ? 'flex' : 'none';
    if (popup.style.display === 'flex') {
        loadCheckboxes();
    }
}

// Pomodoro Timer


function selectTimer(type) {
    timerType = type;
    const pomodoroSettings = document.getElementById('pomodoro-settings');
    const countdownSettings = document.getElementById('countdown-settings');
    const stopwatchSettings = document.getElementById('stopwatch-settings');

    if (pomodoroSettings && countdownSettings && stopwatchSettings) {
        pomodoroSettings.style.display = type === 'pomodoro' ? 'block' : 'none';
        countdownSettings.style.display = type === 'countdown' ? 'block' : 'none';
        stopwatchSettings.style.display = type === 'stopwatch' ? 'block' : 'none';
    } else {
        console.error('One or more timer settings elements are missing.');
    }

    resetAllTimers();
}

function resetAllTimers() {
    clearInterval(timerInterval);
    isPaused = false;
    elapsedTime = 0;
    updateTimerDisplay(0);
    updateCountdownDisplay(0);
    updateStopwatchDisplay(0);
}

function startPomodoro() {
    if (isPaused) {
        isPaused = false;
        startTime = Date.now() - elapsedTime;
    } else {
        const workDurationElement = document.getElementById('work-duration');
        if (workDurationElement) {
            const workDuration = parseInt(workDurationElement.value, 10) * 60 * 1000;
            elapsedTime = workDuration;
            startTime = Date.now();
        } else {
            console.error('Work duration element is missing.');
            return;
        }
    }

    timerInterval = setInterval(() => {
        const currentTime = Date.now();
        elapsedTime = Math.max(0, elapsedTime - (currentTime - startTime));
        startTime = currentTime;
        updateTimerDisplay(elapsedTime / 1000);

        if (elapsedTime <= 0) {
            clearInterval(timerInterval);
            handleSessionCompletion();
        }
    }, 1000);
}

function pausePomodoro() {
    clearInterval(timerInterval);
    isPaused = true;
}

function resetPomodoro() {
    clearInterval(timerInterval);
    isPaused = false;
    elapsedTime = 0;
    updateTimerDisplay(0);
}

function updateTimerDisplay(time) {
    const displayElement = document.getElementById('pomodoro-timer-display');
    if (displayElement) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        displayElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    } else {
        console.error('Pomodoro timer display element is missing.');
    }
}

function handleSessionCompletion() {
    sessionCount++;
    const completedSessionsElement = document.getElementById('completed-sessions');
    if (completedSessionsElement) {
        completedSessionsElement.textContent = `Sessions Completed: ${sessionCount}`;
    } else {
        console.error('Completed sessions element is missing.');
    }
    alert('Session complete!');
    currentMode = 'work';
    startPomodoro();
}

function startCountdown() {
    if (isPaused) {
        isPaused = false;
        startTime = Date.now() - elapsedTime;
    } else {
        const countdownDurationElement = document.getElementById('countdown-duration');
        if (countdownDurationElement) {
            const countdownTime = parseInt(countdownDurationElement.value, 10) * 60 * 1000;
            elapsedTime = countdownTime;
            startTime = Date.now();
        } else {
            console.error('Countdown duration element is missing.');
            return;
        }
    }

    timerInterval = setInterval(() => {
        const currentTime = Date.now();
        elapsedTime = Math.max(0, elapsedTime - (currentTime - startTime));
        startTime = currentTime;
        updateCountdownDisplay(elapsedTime / 1000);

        if (elapsedTime <= 0) {
            clearInterval(timerInterval);
            alert('Countdown complete!');
        }
    }, 1000);
}

function pauseCountdown() {
    clearInterval(timerInterval);
    isPaused = true;
}

function resetCountdown() {
    clearInterval(timerInterval);
    isPaused = false;
    elapsedTime = 0;
    updateCountdownDisplay(0);
}

function updateCountdownDisplay(time) {
    const displayElement = document.getElementById('countdown-timer-display');
    if (displayElement) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        displayElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    } else {
        console.error('Countdown timer display element is missing.');
    }
}

function startStopwatch() {
    if (isPaused) {
        isPaused = false;
        startTime = Date.now() - elapsedTime;
    } else {
        startTime = Date.now();
        elapsedTime = 0;
    }

    timerInterval = setInterval(() => {
        const currentTime = Date.now();
        elapsedTime = currentTime - startTime;
        updateStopwatchDisplay(elapsedTime / 1000);
    }, 1000);
}

function pauseStopwatch() {
    clearInterval(timerInterval);
    isPaused = true;
}

function resetStopwatch() {
    clearInterval(timerInterval);
    isPaused = false;
    elapsedTime = 0;
    updateStopwatchDisplay(0);
}

function updateStopwatchDisplay(time) {
    const displayElement = document.getElementById('stopwatch-timer-display');
    if (displayElement) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        displayElement.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    } else {
        console.error('Stopwatch timer display element is missing.');
    }
}

function togglePomodoroPopup() {
    const popup = document.getElementById('pomodoro-popup');
    if (popup) {
        popup.style.display = popup.style.display === 'none' ? 'flex' : 'none';
        if (popup.style.display === 'flex') {
            loadTimerState();
        } else {
            saveTimerState();
        }
    } else {
        console.error('Pomodoro popup element is missing.');
    }
}

function saveTimerState() {
    const state = {
        timerType,
        elapsedTime,
        isPaused,
        currentMode,
        sessionCount,
        startTime: Date.now() - elapsedTime
    };
    localStorage.setItem('timerState', JSON.stringify(state));
}

function loadTimerState() {
    const state = JSON.parse(localStorage.getItem('timerState'));
    if (state) {
        timerType = state.timerType;
        elapsedTime = state.elapsedTime;
        isPaused = state.isPaused;
        currentMode = state.currentMode;
        sessionCount = state.sessionCount;
        startTime = state.startTime;
        selectTimer(timerType);
        if (!isPaused) {
            switch (timerType) {
                case 'pomodoro':
                    startPomodoro();
                    break;
                case 'countdown':
                    startCountdown();
                    break;
                case 'stopwatch':
                    startStopwatch();
                    break;
            }
        }
    }
}

// Checkbox functionality
function loadCheckboxes() {
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        const task = checkbox.dataset.task;
        checkbox.checked = localStorage.getItem(task) === 'true';
        checkbox.addEventListener('change', () => {
            localStorage.setItem(task, checkbox.checked);
        });
    });
}

function clearCheckboxes() {
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.checked = false;
        localStorage.removeItem(checkbox.dataset.task);
    });
}

function showTaskPopup(date) {
    document.getElementById('taskPopup').style.display = 'block';
    document.getElementById('saveTask').onclick = () => saveTask(date);
}

function hideTaskPopup() {
    document.getElementById('taskPopup').style.display = 'none';
}

function saveTask(date) {
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    if (!tasks[date]) tasks[date] = [];
    tasks[date].push({ title, description });
    hideTaskPopup();
    renderCalendar();
}

function renderCalendar() {
    const calendarBody = document.getElementById('calendarBody');
    calendarBody.innerHTML = ''; // Clear previous calendar days
    // Generate calendar days (simplified for this example)
    for (let i = 1; i <= 30; i++) {
        const day = document.createElement('div');
        day.textContent = i;
        day.onclick = () => showTaskPopup(i);
        calendarBody.appendChild(day);
    }
}

function exportTasks() {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('exportButton').addEventListener('click', exportTasks);
document.getElementById('closeTaskPopup').addEventListener('click', hideTaskPopup);

renderCalendar();

function showCalendarPopup() {
    document.getElementById('calendarPopup').style.display = 'flex';
    renderCalendar();
    renderTodayTasks();
}

function hideCalendarPopup() {
    document.getElementById('calendarPopup').style.display = 'none';
}

function renderCalendar() {
    const monthYear = document.getElementById('monthYear');
    const calendarBody = document.getElementById('calendarBody');
    const date = new Date(currentYear, currentMonth);
    monthYear.textContent = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    calendarBody.innerHTML = '';

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarBody.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.textContent = i;
        day.onclick = () => showTasksForDate(i);
        calendarBody.appendChild(day);
    }
}

function showTasksForDate(day) {
    const dateKey = `${currentYear}-${currentMonth + 1}-${day}`;
    document.getElementById('taskDate').textContent = `Tasks for ${dateKey}`;
    const taskTableBody = document.getElementById('taskTable').querySelector('tbody');
    taskTableBody.innerHTML = '';

    if (tasks[dateKey]) {
        tasks[dateKey].forEach((task, index) => {
            const row = taskTableBody.insertRow();
            const cell1 = row.insertCell(0);
            const cell2 = row.insertCell(1);
            const cell3 = row.insertCell(2);

            cell1.textContent = task.title;
            cell2.textContent = task.description;
            cell1.className = task.completed ? 'completed-task' : '';
            cell3.innerHTML = `
                <button onclick="toggleTask('${dateKey}', ${index})">${task.completed ? 'Uncheck' : 'Check'}</button>
                <button onclick="editTask('${dateKey}', ${index})">Edit</button>
                <button onclick="removeTask('${dateKey}', ${index})">Remove</button>
                <button onclick="postponeTask('${dateKey}', ${index})">Postpone</button>
            `;
        });
    }
}

function addTask() {
    const title = document.getElementById('newTaskTitle').value;
    const description = document.getElementById('newTaskDescription').value;
    const dateKey = document.getElementById('taskDate').textContent.split(' ')[2];

    if (!tasks[dateKey]) tasks[dateKey] = [];
    tasks[dateKey].push({ title, description, completed: false });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    showTasksForDate(new Date(dateKey).getDate());
}

function toggleTask(dateKey, index) {
    tasks[dateKey][index].completed = !tasks[dateKey][index].completed;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    showTasksForDate(new Date(dateKey).getDate());
}

function editTask(dateKey, index) {
    const newTitle = prompt('Edit Task Title', tasks[dateKey][index].title);
    const newDescription = prompt('Edit Task Description', tasks[dateKey][index].description);
    if (newTitle !== null) tasks[dateKey][index].title = newTitle;
    if (newDescription !== null) tasks[dateKey][index].description = newDescription;
    localStorage.setItem('tasks', JSON.stringify(tasks));
    showTasksForDate(new Date(dateKey).getDate());
}

function removeTask(dateKey, index) {
    tasks[dateKey].splice(index, 1);
    if (tasks[dateKey].length === 0) delete tasks[dateKey];
    localStorage.setItem('tasks', JSON.stringify(tasks));
    showTasksForDate(new Date(dateKey).getDate());
}

function postponeTask(dateKey, index) {
    const newDate = prompt('Enter new date (YYYY-MM-DD)', dateKey);
    if (newDate) {
        if (!tasks[newDate]) tasks[newDate] = [];
        tasks[newDate].push(tasks[dateKey][index]);
        removeTask(dateKey, index);
    }
}

function renderTodayTasks() {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const todayTaskList = document.getElementById('todayTaskList');
    todayTaskList.innerHTML = '';

    if (tasks[todayKey]) {
        tasks[todayKey].forEach(task => {
            const taskDiv = document.createElement('div');
            taskDiv.textContent = `${task.title}: ${task.description}`;
            todayTaskList.appendChild(taskDiv);
        });
    } else {
        todayTaskList.textContent = 'No tasks for today.';
    }
}

document.getElementById('showCalendarButton').addEventListener('click', showCalendarPopup);
document.getElementById('closeCalendarPopup').addEventListener('click', hideCalendarPopup);
document.getElementById('addTask').addEventListener('click', addTask);
document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    currentYear = (currentMonth === 11) ? currentYear - 1 : currentYear;
    renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth = (currentMonth === 11) ? 0 : currentMonth + 1;
    currentYear = (currentMonth === 0) ? currentYear + 1 : currentYear;
    renderCalendar();
});

renderTodayTasks();

document.getElementById('menuButton').addEventListener('click', function() {
    const menu = document.getElementById('menu');
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
});

function addTodoTask() {
    const title = document.getElementById('todo-input').value.trim();
    const dueDate = document.getElementById('todo-due-date').value;

    if (title) {
        const task = {
            title,
            dueDate,
            completed: false
        };

        const todos = JSON.parse(localStorage.getItem('todos')) || [];
        todos.push(task);
        localStorage.setItem('todos', JSON.stringify(todos));
        loadTodoTasks(); // Refresh the task list
        clearTodoInputs(); // Clear input fields after adding
    }
}

function loadTodoTasks() {
    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';

    todos.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed-task' : '';
        li.innerHTML = `
            <div class="task-details">
                <span>${task.title}</span>
                <span>${task.dueDate}</span>
            </div>
            <button onclick="toggleTodoComplete(${index})">${task.completed ? 'Uncheck' : 'Check'}</button>
            <button onclick="editTodoTask(${index})">Edit</button>
            <button onclick="removeTodoTask(${index})">Remove</button>
        `;
        todoList.appendChild(li);
    });
}

document.getElementById('addTaskButton').addEventListener('click', addTodoTask);

function clearTodoInputs() {
    document.getElementById('todo-input').value = '';
    document.getElementById('todo-due-date').value = '';
}

function toggleSubjectManagement() {
    const popup = document.getElementById('subjectManagement');
    popup.style.display = popup.style.display === 'none' ? 'flex' : 'none';
    renderSubjectList();
}

// Function to add a subject
function addSubject() {
    const subjectName = document.getElementById('new-subject-name').value.trim();
    if (subjectName && !subjects.includes(subjectName)) {
        if (confirm(`Are you sure you want to add the subject: ${subjectName}?`)) {
            subjects.push(subjectName);
            localStorage.setItem('subjects', JSON.stringify(subjects));
            renderSubjectList();
            updateSubjectOptions();
            renderSubjectContainers();
        }
    }
}

// Function to remove a subject
function removeSubject(subject) {
    if (confirm(`Are you sure you want to remove the subject: ${subject}?`)) {
        subjects = subjects.filter(s => s !== subject);
        localStorage.setItem('subjects', JSON.stringify(subjects));
        renderSubjectList();
        updateSubjectOptions();
        renderSubjectContainers();
    }
}

// Function to render the subject list
function renderSubjectList() {
    const subjectList = document.getElementById('subject-list');
    subjectList.innerHTML = '';
    subjects.forEach(subject => {
        const li = document.createElement('li');
        li.textContent = subject;
        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.onclick = () => removeSubject(subject);
        li.appendChild(removeButton);
        subjectList.appendChild(li);
    });
}

// Function to update subject options in dropdowns
function updateSubjectOptions() {
    const subjectSelects = document.querySelectorAll('#subject-select, #resource-subject-select');
    subjectSelects.forEach(select => {
        select.innerHTML = '';
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject.charAt(0).toUpperCase() + subject.slice(1);
            select.appendChild(option);
        });
    });
}

// Function to render subject containers dynamically
function renderSubjectContainers() {
    const lectureContainer = document.getElementById('lectureContainer');
    const resourcesSection = document.getElementById('resources-section');
    lectureContainer.innerHTML = '';
    resourcesSection.innerHTML = '';

    subjects.forEach(subject => {
        const subjectDiv = document.createElement('div');
        subjectDiv.className = 'subject-section';
        subjectDiv.id = `${subject}`;
        subjectDiv.innerHTML = `
            <h2>${subject.charAt(0).toUpperCase() + subject.slice(1)}</h2>
            <div id="${subject}-chapters"></div>
        `;
        lectureContainer.appendChild(subjectDiv);

        const resourceDiv = document.createElement('div');
        resourceDiv.className = 'resource-box';
        resourceDiv.id = `${subject}-resources`;
        resourcesSection.appendChild(resourceDiv);
    });
}

updateSubjectOptions();
renderSubjectContainers();