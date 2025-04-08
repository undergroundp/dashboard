  <script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
  import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

  const firebaseConfig = {
    apiKey: "AIzaSyA_DCdUq9Nyi_n1dNHRanobGReveOqdS0g",
    authDomain: "dashboard-sync-901fd.firebaseapp.com",
    databaseURL: "https://dashboard-sync-901fd-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dashboard-sync-901fd",
    storageBucket: "dashboard-sync-901fd.firebasestorage.app",
    messagingSenderId: "901043569116",
    appId: "1:901043569116:web:522c157f002d4bfc794f19"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

    
    // --------- STATE SETUP ---------
    const sortDirections = [true, true, 0, 0];
    const priorityOrder = { High: 1, Medium: 2, Low: 3 };
    const deletedTasksStack = [];
const priorityOrders = [["High", "Medium", "Low"], ["Medium", "Low", "High"], ["Low", "High", "Medium"]];
const categoryOrders = [["Home", "Health", "Documents", "Work", "Pet"], ["Health", "Documents", "Work", "Pet", "Home"], ["Documents", "Work", "Pet", "Home", "Health"], ["Work", "Pet", "Home", "Health", "Documents"], ["Pet", "Home", "Health", "Documents", "Work"]];
const assignedOrders = [["Lili", "Michael", "Both"], ["Michael", "Both", "Lili"], ["Both", "Lili", "Michael"]];


    const currentMealIndices = {};
    const mealData = {
      "Tuesday (Veggie)": ["Briam", "Green Beans", "Peas", "Yemista", "Potato leek soup", "Curry carrot soup", "Tomato soup", "French Onion Soup"],
      "Wednesday (Fish and Chicken)": ["Chicken Pot Pie", "Salmon", "Baked Anchovies", "Chicken & Greens", "Chicken Nuggets"],
      "Thursday (Meat and Starch)": ["Lemon Pork with Mashed Potatoes", "Shepherd's Pie", "Burgers", "Hot Dog", "Soutzoukakia", "Spaghetti and Meatballs", "Burritos", "Burgers with Potatoes", "Saucy Sausage Eggs", "Meat Stew", "Youvarlakia", "Bao Buns"],
      "Friday (Lentils and Beans)": ["Lentils", "Chickpeas", "Beans"],
      "Saturday (Pasta and Pizza)": ["Marinara Spaghetti", "Pastitsio", "Broccoli Pasta", "Prosciutto and Mozarella Pesto", "Spinach and Ricotta Shells", "Lasagna Bolognese", "Canelloni", "Mac & Cheese", "Turkish Pasta", "Asian Noodles", "Pizza", "Orzo"],
      "Sunday (Bowls)": ["Leftovers", "Greens & Grains Bowl", "Rice Bowl"],
      "Monday (Simple)": ["Sandwich", "Fish sticks", "Girl Dinner", "Leftovers", "Rice Bowl"]
    };

    // --------- TAB NAVIGATION ---------
    function showTab(id) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      document.querySelector(`.tab-button[onclick="showTab('${id}')"]`).classList.add('active');

// Force re-render when calendar tab is shown

  if (id === 'calendar' && window.myDashboardCalendar) {
    window.myDashboardCalendar.render();
  }
}


    // --------- TASK FUNCTIONS ---------
   function addTask() {
  const row = document.createElement('tr');
row.classList.add('task-row', 'fade-in');
  row.innerHTML = `
    <td contenteditable="true">New Task</td>
    <td>
      <select>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>
    </td>
    <td>
      <select>
        <option>Home</option>
        <option>Health</option>
        <option>Documents</option>
        <option>Work</option>
        <option>Pet</option>
      </select>
    </td>
    <td>
      <select>
        <option>Lili</option>
        <option>Michael</option>
        <option>Both</option>
      </select>
    </td>
    <td><button onclick="deleteTask(this)">🗑️</button></td>
  `;

  // Save task text input on edit
  const editableCell = row.querySelector('td[contenteditable]');
editableCell.addEventListener('input', saveTasksToFirebase);
editableCell.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    editableCell.blur();  // Exit editing
  }
});

  // Attach onchange listeners + styling to dropdowns
  const selects = row.querySelectorAll('select');

  const styleAndSave = (select, classPrefix) => {
    const update = () => {
      select.className = `${classPrefix}-${select.value.toLowerCase()}`;
      saveTasksToFirebase();
    };
    update(); // Initial styling
    select.addEventListener('change', update);
  };

  styleAndSave(selects[0], 'priority');
  styleAndSave(selects[1], 'cat');
  styleAndSave(selects[2], 'assign');

  document.getElementById('task-body').appendChild(row);

editableCell.focus();

// Select the "New Task" text
const range = document.createRange();
range.selectNodeContents(editableCell);
const sel = window.getSelection();
sel.removeAllRanges();
sel.addRange(range);

// 🧼 Remove fade-in class after animation ends
row.addEventListener('animationend', () => {
  row.classList.remove('fade-in');
});

  saveTasksToFirebase();
applySelectStyles();
}


function deleteTask(btn) {
  const row = btn.closest('tr');
  const task = {
    text: row.cells[0].innerText.trim(),
    priority: row.cells[1].querySelector('select').value,
    category: row.cells[2].querySelector('select').value,
    assignedTo: row.cells[3].querySelector('select').value
  };
  if (deletedTasksStack.length >= 5) deletedTasksStack.shift();
  deletedTasksStack.push(task);
  row.remove();
 saveTasksToFirebase();
}


   function undoDelete() {
  const task = deletedTasksStack.pop();
  if (!task) return;

const row = document.createElement('tr');
row.classList.add('task-row', 'fade-in');
  row.innerHTML = `
    <td contenteditable="true">${task.text}</td>
    <td>
      <select>
        <option>High</option>
        <option>Medium</option>
        <option>Low</option>
      </select>
    </td>
    <td>
      <select>
        <option>Home</option>
        <option>Health</option>
        <option>Documents</option>
        <option>Work</option>
        <option>Pet</option>
      </select>
    </td>
    <td>
      <select>
        <option>Lili</option>
        <option>Michael</option>
        <option>Both</option>
      </select>
    </td>
    <td><button onclick="deleteTask(this)">🗑️</button></td>
  `;

  // Set dropdown values explicitly
  const selects = row.querySelectorAll('select');
  selects[0].value = task.priority;
  selects[1].value = task.category;
  selects[2].value = task.assignedTo;

  // Apply styling and save listeners
  const styleAndSave = (select, classPrefix) => {
    const update = () => {
      select.className = `${classPrefix}-${select.value.toLowerCase()}`;
     saveTasksToFirebase();
    };
    update();
    select.addEventListener('change', update);
  };

  styleAndSave(selects[0], 'priority');
  styleAndSave(selects[1], 'cat');
  styleAndSave(selects[2], 'assign');

const editableCell = row.querySelector('td[contenteditable]');
editableCell.addEventListener('input', saveTasksToFirebase);
editableCell.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    editableCell.blur();
  }
});


  document.getElementById('task-body').appendChild(row);

// 🧼 Remove fade-in class after animation ends
clonedRow.addEventListener('animationend', () => {
  clonedRow.classList.remove('fade-in');
});

  saveTasksToFirebase();
}




  function sortTasks(colIndex) {
  const tbody = document.getElementById('task-body');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  let order;

  if (colIndex === 1) {  // Priority
    order = priorityOrders[sortDirections[1] % priorityOrders.length];
    rows.sort((a, b) => order.indexOf(a.cells[1].querySelector('select').value) - order.indexOf(b.cells[1].querySelector('select').value));
    sortDirections[1]++;
  } else if (colIndex === 2) {  // Category
    order = categoryOrders[sortDirections[2] % categoryOrders.length];
    rows.sort((a, b) => order.indexOf(a.cells[2].querySelector('select').value) - order.indexOf(b.cells[2].querySelector('select').value));
    sortDirections[2]++;
  } else if (colIndex === 3) {  // Assigned To
    order = assignedOrders[sortDirections[3] % assignedOrders.length];
    rows.sort((a, b) => order.indexOf(a.cells[3].querySelector('select').value) - order.indexOf(b.cells[3].querySelector('select').value));
    sortDirections[3]++;
  } else {  // Task Name
    const asc = sortDirections[0];
    rows.sort((a, b) => asc ? a.cells[0].innerText.localeCompare(b.cells[0].innerText) : b.cells[0].innerText.localeCompare(a.cells[0].innerText));
    sortDirections[0] = !asc;
  }

  tbody.innerHTML = '';
  rows.forEach(row => tbody.appendChild(row));
}


async function saveTasksToFirebase() {
  const rows = document.querySelectorAll('#task-body tr');
  const tasks = Array.from(rows).map(row => ({
    Task: row.cells[0].innerText.trim(),
    Priority: row.cells[1].querySelector('select').value,
    Category: row.cells[2].querySelector('select').value,
    AssignedTo: row.cells[3].querySelector('select').value
  }));

  try {
    await set(ref(db, 'tasks'), tasks);
    console.log('✅ Tasks saved to Firebase');
  } catch (err) {
    console.error('❌ Error saving tasks to Firebase:', err);
  }
}



async function loadTasksFromFirebase() {
  try {
    const snapshot = await get(ref(db, 'tasks'));
    if (!snapshot.exists()) {
      console.log("No tasks found in Firebase");
      return;
    }

    const tasks = snapshot.val();
    const tbody = document.getElementById('task-body');
    tbody.innerHTML = '';

    tasks.forEach(task => {
      const row = document.createElement('tr');
      row.innerHTML = `<td contenteditable="true">${task.Task}</td>
        <td><select><option>High</option><option>Medium</option><option>Low</option></select></td>
        <td><select><option>Home</option><option>Health</option><option>Documents</option><option>Work</option><option>Pet</option></select></td>
        <td><select><option>Lili</option><option>Michael</option><option>Both</option></select></td>
        <td><button onclick="deleteTask(this)">🗑️</button></td>`;

      const selects = row.querySelectorAll('select');
      selects[0].value = task.Priority || 'Medium';
      selects[1].value = task.Category || 'Home';
      selects[2].value = task.AssignedTo || 'Both';

      const editableCell = row.querySelector('td[contenteditable]');
      editableCell.addEventListener('input', saveTasksToFirebase);
      editableCell.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          editableCell.blur();
        }
      });

      row.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', saveTasksToFirebase);
      });

      tbody.appendChild(row);
    });

    applySelectStyles();
  } catch (err) {
    console.error('❌ Failed to load tasks from Firebase:', err);
  }
}



    // --------- SELECT STYLE UTILS ---------
    function applySelectStyles() {
      document.querySelectorAll('#task-body tr').forEach(row => {
        const selects = row.querySelectorAll('select');
        if (selects.length === 3) {
          const [priority, category, assigned] = selects;
          priority.className = `priority-${priority.value.toLowerCase()}`;
          category.className = `cat-${category.value.toLowerCase()}`;
          assigned.className = `assign-${assigned.value.toLowerCase()}`;

          priority.onchange = () => priority.className = `priority-${priority.value.toLowerCase()}`;
          category.onchange = () => category.className = `cat-${category.value.toLowerCase()}`;
          assigned.onchange = () => assigned.className = `assign-${assigned.value.toLowerCase()}`;
        }
      });
    }

    // --------- GROCERY FUNCTIONS ---------
    function addGroceryItem() {
      const input = document.getElementById('grocery-input');
      const value = input.value.trim();
      if (!value) return;

      const div = document.createElement('div');
      div.className = 'grocery-item';
      div.innerHTML = `<input type="checkbox"> <label>${value}</label>`;

      div.querySelector('input').addEventListener('change', () => {
        div.classList.add('removing');
        setTimeout(() => {
          div.remove();
          saveGroceriesToStorage();
        }, 300);
      });

      document.getElementById('grocery-items').appendChild(div);
      input.value = '';
      saveGroceriesToStorage();
    }

    function handleGroceryKey(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        addGroceryItem();
      }
    }

    function saveGroceriesToStorage() {
      const items = Array.from(document.querySelectorAll('#grocery-items label')).map(label => label.innerText.trim());
      localStorage.setItem('groceryItems', JSON.stringify(items));
    }

    function loadGroceriesFromStorage() {
      const saved = localStorage.getItem('groceryItems');
      if (!saved) return;
      const items = JSON.parse(saved);
      items.forEach(value => {
        const div = document.createElement('div');
        div.className = 'grocery-item';
        div.innerHTML = `<input type="checkbox"> <label>${value}</label>`;
        div.querySelector('input').addEventListener('change', () => {
          div.classList.add('removing');
          setTimeout(() => {
            div.remove();
            saveGroceriesToStorage();
          }, 300);
        });
        document.getElementById('grocery-items').appendChild(div);
      });
    }

    // --------- CHORE FUNCTIONS ---------
    function toggleChore(btn) {
      btn.classList.toggle('done');
      saveChoresToStorage();
    }

    function saveChoresToStorage() {
      const doneChores = Array.from(document.querySelectorAll('.chore-button.done')).map(btn => btn.innerText.trim());
      localStorage.setItem('doneChores', JSON.stringify(doneChores));
    }

    function loadChoresFromStorage() {
      const saved = localStorage.getItem('doneChores');
      if (!saved) return;
      const doneChores = JSON.parse(saved);
      document.querySelectorAll('.chore-button').forEach(btn => {
        if (doneChores.includes(btn.innerText.trim())) {
          btn.classList.add('done');
        }
      });
    }

    // --------- MEAL PLAN FUNCTIONS ---------
    function generateMealPlan() {
      const tbody = document.getElementById('meal-plan-body');
      tbody.innerHTML = '';
      for (const [day, meals] of Object.entries(mealData)) {
        let index = (currentMealIndices[day] + 1) % meals.length;
        currentMealIndices[day] = index;
        const meal = meals[index];
        const row = document.createElement('tr');
        row.innerHTML = `<td>${day}</td><td>${meal}</td><td><button onclick="changeMeal(this, '${day}')">Change Meal</button></td>`;
        tbody.appendChild(row);
      }
      saveMealProgressToStorage();
    }

    function changeMeal(btn, day) {
      const cell = btn.parentElement.previousElementSibling;
      const meals = mealData[day];
      let index = (currentMealIndices[day] + 1) % meals.length;
      currentMealIndices[day] = index;
      cell.innerText = meals[index];
      saveMealProgressToStorage();
    }

    function saveMealProgressToStorage() {
      localStorage.setItem('mealProgressIndices', JSON.stringify(currentMealIndices));
    }

    function loadMealProgressFromStorage() {
      const saved = localStorage.getItem('mealProgressIndices');
      if (!saved) return;
      const savedIndices = JSON.parse(saved);
      Object.keys(savedIndices).forEach(day => currentMealIndices[day] = savedIndices[day]);
      const tbody = document.getElementById('meal-plan-body');
      tbody.innerHTML = '';
      for (const [day, meals] of Object.entries(mealData)) {
        const index = currentMealIndices[day] || 0;
        const meal = meals[index];
        const row = document.createElement('tr');
        row.innerHTML = `<td>${day}</td><td>${meal}</td><td><button onclick="changeMeal(this, '${day}')">Change Meal</button></td>`;
        tbody.appendChild(row);
      }
    }


  async function listUpcomingEvents() {
    try {
      const response = await fetch('https://calendar-backend-jnq8.onrender.com/events');
      const rawEvents = await response.json();

      const events = rawEvents.map(event => ({
        title: event.summary || 'No title',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date
      }));

      console.log('🎉 EVENTS RECEIVED:', events);

      if (window.myDashboardCalendar) {
        window.myDashboardCalendar.removeAllEvents();
        window.myDashboardCalendar.addEventSource(events);
      }
    } catch (err) {
      console.error('❌ Failed to load events from backend:', err);
    }
  }

    // --------- INITIAL LOAD ---------
window.addEventListener('DOMContentLoaded', () => {
  loadTasksFromFirebase();
  loadGroceriesFromStorage();
  loadChoresFromStorage();
  loadMealProgressFromStorage();

  // === FULLCALENDAR INIT ===
  const calendarEl = document.getElementById('fullcalendar');
  if (calendarEl) {
    window.myDashboardCalendar = new FullCalendar.Calendar(calendarEl, {
  initialView: 'dayGridMonth',
firstDay: 1,
  height: 'auto',
  headerToolbar: {
  start: 'prev,next today',
  center: 'title',
  end: 'dayGridMonth,timeGridWeek,timeGridDay'  // ← view toggles
},
  events: [ ]
});
window.myDashboardCalendar.render();
  listUpcomingEvents();

  }

  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('darkModeToggle').innerText = savedTheme === 'dark' ? '🌙' : '☀️';
});


function toggleDarkMode() {
  const root = document.documentElement;
  const currentTheme = root.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  document.getElementById('darkModeToggle').innerText = newTheme === 'dark' ? '🌙' : '☀️';
}

window.addTask = addTask;
window.undoDelete = undoDelete;
window.showTab = showTab;
window.sortTasks = sortTasks;
window.deleteTask = deleteTask;
window.changeMeal = changeMeal;
window.toggleChore = toggleChore;
window.addGroceryItem = addGroceryItem;
window.handleGroceryKey = handleGroceryKey;
window.toggleDarkMode = toggleDarkMode;




  </script>