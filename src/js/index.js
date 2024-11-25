import { DatabaseManager } from "./indexedDB.js";
const dbManager = DatabaseManager.getInstance();

const noteColorInput = document.querySelector("#noteColor");
const addInput = document.querySelector("#addButton");
const mainElement = document.querySelector("main");

let counterID = 0; // Counter for note IDs
let zIndexValue = 1; // Counter for z-index values

// Load notes from the database when the program starts
getAllNotesDB();

addInput.addEventListener("click", async () => {
  // Create a new note element
  let newNote = document.createElement("div");
  newNote.classList.add("note");
  newNote.id = "note-" + counterID;

  // Create the note header
  let noteHeader = document.createElement("div");
  noteHeader.classList.add("noteHeader");
  noteHeader.innerHTML = `<button class="delete">X</button>`;
  newNote.appendChild(noteHeader);

  // Create the note content area
  let noteContent = document.createElement("div");
  noteContent.classList.add("noteContent");
  noteContent.innerHTML = `<textarea name="noteText-${counterID}" id="noteText-${counterID}"></textarea>`;
  newNote.appendChild(noteContent);

  // Set the note header background color
  noteHeader.style.background = noteColorInput.value;

  // Prepare the note data for the database
  const noteData = {
    color: noteColorInput.value,
    text: "" // Initially empty, will be updated when the user types
  };

  // Add the note to the database
  await addNoteDB(noteData)
    .then((id) => {
      // Save the note ID in the DOM element for future use
      newNote.dataset.noteId = id;
    });

  // Add the new note to the main element
  mainElement.appendChild(newNote);
  counterID++;
});

// Event listener for deleting notes
document.addEventListener("click", async (event) => {
  if (event.target.classList.contains('delete')) {
    const note = event.target.closest('.note');

    // Get the note ID from the DOM element
    const noteId = note.dataset.noteId;

    // Delete the note from the database
    await deleteNoteDB(noteId)
      .then(() => {
        // Remove the note from the DOM after deleting it from the database
        note.remove();
      });
  }
});

// Event listener for updating note content in the database
mainElement.addEventListener('input', async (event) => {
  if (event.target.tagName.toLowerCase() === 'textarea') {
    const note = event.target.closest('.note');
    const noteId = Number(note.dataset.noteId); // Convert note ID to number
    const newText = event.target.value;

    try {
      await dbManager.open();
      await dbManager.updateData(noteId, { text: newText });
      console.log("Note content updated in the database with ID:", noteId);
    } catch (error) {
      console.error("Error updating note content:", error);
    }
  }
});

// Variables to track mouse position and note being dragged
let cursor = {
  x: null,
  y: null
}

let note = {
  dom: null,
  x: null,
  y: null
}

// Event listener for starting note drag
document.addEventListener("mousedown", (event) => {
  if (event.target.classList.contains('noteHeader')) {
    cursor = {
      x: event.clientX,
      y: event.clientY
    }

    let current = event.target.closest('.note');

    note = {
      dom: current,
      x: current.getBoundingClientRect().left,
      y: current.getBoundingClientRect().top
    }

    current.style.cursor = "grabbing";
    current.style.zIndex = zIndexValue;
    zIndexValue++;
  }
});

// Event listener for dragging the note
document.addEventListener("mousemove", (event) => {
  if (note.dom == null) { return; }

  let currentCursor = {
    x: event.clientX,
    y: event.clientY
  }

  let distance = {
    x: currentCursor.x - cursor.x,
    y: currentCursor.y - cursor.y
  }

  note.dom.style.left = (note.x + distance.x) + "px";
  note.dom.style.top = (note.y + distance.y) + "px";
});

// Event listener for ending note drag
document.addEventListener("mouseup", async (event) => {
  if (note.dom) {
    const noteId = Number(note.dom.dataset.noteId); // Convert note ID to number
    const noteX = note.dom.style.left; // Get the final x position
    const noteY = note.dom.style.top; // Get the final y position

    try {
      await dbManager.open();
      await dbManager.updateData(noteId, { x: noteX, y: noteY }); // Update the note position
      console.log("Note position updated in the database with ID:", noteId);
    } catch (error) {
      console.error("Error updating note position:", error);
    }

    note.dom = null; // Reset the note being dragged
    event.target.closest('.noteHeader').style.cursor = "grab"; // Reset cursor
  }
});

// Function to add a new note to the database
async function addNoteDB(noteData) {
  return dbManager.open()
    .then(() => {
      return dbManager.createData(noteData); // Add the note data
    })
    .then((id) => {
      console.log("Note added to the database with ID:", id);
      return id; // Return the generated ID
    })
    .catch((error) => {
      console.error("Error adding note to the database:", error);
      alert("Error al guardar la nota. Por favor, inténtalo de nuevo.");
      throw error;
    });
}

// Function to delete a note from the database
async function deleteNoteDB(noteId) {
  dbManager.open()
    .then(() => {
      dbManager.deleteData(parseInt(noteId))
        .then(() => {
          console.log("Deleted item with id: " + noteId);
        })
        .catch((error) => {
          console.error("Error deleteData: " + error);
          alert("Error al eliminar la nota. Por favor, inténtalo de nuevo.");
        });
    })
    .catch((error) => {
      console.error("Error open: " + error);
    });
}

// Function to load all notes from the database
async function getAllNotesDB() {
  dbManager.open()
    .then(() => {
      return dbManager.readAllData();
    })
    .then(notes => {
      notes.forEach(noteData => {
        const newNote = createNoteElement(noteData);
        mainElement.appendChild(newNote);
      });
    })
    .catch(error => {
      console.error("Error loading notes:", error);
      alert("Error al cargar las notas. Por favor, refresca la página de nuevo.");
    });
}

// Function to create a note element from note data
function createNoteElement(noteData) {
  const newNote = document.createElement("div");
  newNote.classList.add("note");
  newNote.id = "note-" + counterID; // Assign a unique ID

  // Set the note position if it exists in the database
  if (noteData.x && noteData.y) {
    newNote.style.left = noteData.x;
    newNote.style.top = noteData.y;
  }

  const noteHeader = document.createElement("div");
  noteHeader.classList.add("noteHeader");
  noteHeader.style.background = noteData.color;
  noteHeader.innerHTML = `<button class="delete">X</button>`;
  newNote.appendChild(noteHeader);

  const noteContent = document.createElement("div");
  noteContent.classList.add("noteContent");

  noteContent.innerHTML = `<textarea name="noteText-${counterID}" id="noteText-${counterID}">${noteData.text}</textarea>`;
  newNote.appendChild(noteContent);

  counterID++;

  return newNote;
}
