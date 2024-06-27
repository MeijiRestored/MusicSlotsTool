$(document).ready(function () {
  loadEvent();
});

let musicSlotsData = [];
var courses = {};

/**
 * Check if HTML5 file API is supported
 * @returns {boolean} True if supported, else False
 */
function supportsFileAPI() {
  return window.File && window.FileReader && window.FileList && window.Blob;
}

function loadEvent() {
  var $container = $("#container");
  if (!supportsFileAPI()) {
    $container.html(
      "<div id='error'>This browser does not support the HTML5 file API. Please switch to another browser.</div>"
    );
  } else {
    var $fileIn = $("#input");
    $fileIn.bind("change", loadFile);
    $("#inputLabel").bind("click", function () {
      $fileIn.click();
    });
  }
}

function loadFile(evt) {
  evt = evt.originalEvent || evt;
  var file = evt.target.files[0];
  readFile(file);
}

function readFile(file) {
  var reader = new FileReader();
  reader.onload = (function (theFile) {
    return function (e) {
      musicSlotsData = [];

      for (let i in vanillaTracks) {
        courses[vanillaTracks[i].filename] = vanillaTracks[i].course;
      }
      for (let i in customTracks) {
        courses[customTracks[i].filename] = customTracks[i].course;
      }
      var $outputSelection = $("#outputSection");
      $outputSelection.html("<h3>Loading file...</h3>");
      var text = e.target.result;

      // Split the text into lines
      var lines = text.split(/\r?\n/);

      // Iterate over each line
      lines.forEach(function (line, index) {
        var tLine = line.trimStart();
        if (!tLine.startsWith("#")) { // Ignore comments
          if (tLine.match(/[a-zA-Z0-9_]+? :: [a-zA-Z0-9_-]+? :: (?:SINGLE|MULTI_WATER|MULTI_AREA) :: [0-9]+? :: [0-9]+? :: [0-9]+? :: [0-9]+? :: .+? :: .+/)) {
            processLine(tLine, true)
          } else if (tLine.match(/[a-zA-Z0-9_]+? :: [a-zA-Z0-9_-]+? :: (?:SINGLE|MULTI_WATER|MULTI_AREA) :: [0-9]+? :: [0-9]+? :: [0-9]+? :: [0-9]+/)) {
            processLine(tLine, false)
          } else {
            console.log("Invalid line: " + line);
          }
        }
      });

      generateMusicTable(musicSlotsData);
      $("#editor").toggle();
      $outputSelection.html("<h3>Loaded successfully!</h3>");
    };
  })(file);
  reader.readAsText(file);
}

function processLine(line, hasCredits) {
  var tLine = line.split("::");

  for (let i in tLine) {
    tLine[i] = tLine[i].trim();
  }

  let data = {
    "track": tLine[0],
    "name": tLine[1],
    "channel": tLine[2],
    "Nbpm": tLine[3],
    "Noffset": tLine[4],
    "Fbpm": tLine[5],
    "Foffset": tLine[6]
  }

  if (hasCredits) {
    data["credits"] = tLine[7];
    data["author"] = tLine[8];
  } else {
    data["credits"] = "";
    data["author"] = "";
  }

  musicSlotsData.push(data);
}


function generateMusicTable(musicSlotsData) {
  // Create the table element
  var table = document.createElement("table");
  table.id = "musicTable";

  // Create the table header
  var thead = document.createElement("thead");
  var headerRow = document.createElement("tr");

  var headers = ["Track name", "Music name", "Channel type", "NFB", "NFO", "FFB", "FFO", "Credits", "Author", "", ""];
  headers.forEach(function (header) {
    var th = document.createElement("th");
    th.appendChild(document.createTextNode(header));
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

// Create the table body
  var tbody = document.createElement("tbody");
  musicSlotsData.forEach(function (data) {
    var row = document.createElement("tr");

    initRow(row, data);

    tbody.appendChild(row);
  });

  table.appendChild(tbody);

  // Insert the table into the container
  var container = document.getElementById("musicTableContainer");
  container.innerHTML = ""; // Clear any existing content
  container.appendChild(table);
}

function createTextInputCell(value, cl) {
  var td = document.createElement("td");
  var input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.classList.add(cl);
  td.appendChild(input);
  return td;
}

function createSelectCell(value, cl, options) {
  var td = document.createElement("td");
  var select = document.createElement("select");

  options.forEach(function (option) {
    var optionElem = document.createElement("option");
    let opt;
    if (option === "Single") {
      opt = "SINGLE"
    } else if (option === "Multi (water)") {
      opt = "MULTI_WATER"
    } else if (option === "Multi (area)") {
      opt = "MULTI_AREA"
    }
    optionElem.value = opt;
    optionElem.text = option;
    select.appendChild(optionElem);
  });

  select.value = value;
  select.classList.add(cl);
  td.appendChild(select);
  return td;
}

// Helper function to create a number input cell
function createNumberInputCell(value, cl, span) {
  var td = document.createElement("td");
  var input = document.createElement("input");
  input.type = "number";
  input.value = value;
  input.setAttribute("min", "0");
  input.setAttribute("step", "1");
  input.classList.add(cl);
  td.appendChild(input);
  if (span) {
    td.appendChild(document.createTextNode(span));
  }
  return td;
}

function createCourseSelectCell(filename, cl) {
  var td = document.createElement("td");
  var select = document.createElement("select");

  for (var key in courses) {
    var option = document.createElement("option");
    option.value = key; // filename
    option.textContent = courses[key]; // course name
    select.appendChild(option);
  }

  if (filename && courses[filename]) {
    select.value = filename;
  }

  select.value = filename;
  select.classList.add(cl);
  td.appendChild(select);
  return td;
}

function createDeleteButtonCell() {
  var td = document.createElement("td");
  var button = document.createElement("button");
  button.textContent = "Delete";
  button.classList.add("deleteBtn");
  button.addEventListener("click", function () {
    var row = this.parentNode.parentNode;
    var tbody = row.parentNode;

    if (tbody.rows.length === 1) {
      var emptyData = {
        "track": "",
        "name": "",
        "channel": "SINGLE",
        "Nbpm": "0",
        "Noffset": "0",
        "Fbpm": "0",
        "Foffset": "0",
        "credits": "",
        "author": ""
      };
      var newRow = createTableRow(emptyData);
      tbody.appendChild(newRow);
    }

    tbody.removeChild(row);
  });
  td.appendChild(button);
  return td;
}

function createPreviewButtonCell() {
  var td = document.createElement("td");
  var button = document.createElement("button");
  button.textContent = "Preview";
  button.classList.add("prevBtn");
  button.addEventListener("click", function () {
    $("#hint").html("Click anywhere around the picture to close...");
    $("#blockingScreen").attr("onclick", "closePreview()");
    $("#previewBox").toggle();
    $("#blockingScreen").toggle();

    var row = this.parentNode.parentNode;
    var credits = row.cells[7].getElementsByTagName("input")[0].value;
    var author = row.cells[8].getElementsByTagName("input")[0].value;

    $("#track").html(credits);
    $("#author").html(author);
  });
  td.appendChild(button);
  return td;
}

function addRow() {
  var emptyData = {
    "track": "",
    "name": "",
    "channel": "SINGLE",
    "Nbpm": "0",
    "Noffset": "0",
    "Fbpm": "0",
    "Foffset": "0",
    "credits": "",
    "author": ""
  };

  var table = document.getElementById("musicTable");
  var tbody = table.getElementsByTagName("tbody")[0];
  var newRow = createTableRow(emptyData);
  tbody.appendChild(newRow);
}

function createTableRow(data) {
  var row = document.createElement("tr");

  initRow(row, data);

  return row;
}

function initRow(row, data) {
  var trackCell = createCourseSelectCell(data.track, "track");
  var nameCell = createTextInputCell(data.name, "track-name");
  var channelCell = createSelectCell(data.channel, "channel", ["Single", "Multi (water)", "Multi (area)"]);
  var nbpmCell = createNumberInputCell(data.Nbpm, "nbpm", " bpm");
  var noffsetCell = createNumberInputCell(data.Noffset, "noffset", " samples");
  var fbpmCell = createNumberInputCell(data.Fbpm, "fbpm", " bpm");
  var foffsetCell = createNumberInputCell(data.Foffset, "foffset", " samples");
  var creditsCell = createTextInputCell(data.credits, "credits");
  var authorCell = createTextInputCell(data.author, "author");
  var deleteCell = createDeleteButtonCell();
  var prevCell = createPreviewButtonCell();

  // Append cells to row
  row.appendChild(trackCell);
  row.appendChild(nameCell);
  row.appendChild(channelCell);
  row.appendChild(nbpmCell);
  row.appendChild(noffsetCell);
  row.appendChild(fbpmCell);
  row.appendChild(foffsetCell);
  row.appendChild(creditsCell);
  row.appendChild(authorCell);
  row.appendChild(deleteCell);
  row.appendChild(prevCell);
}

function readTableData() {
  var table = document.getElementById("musicTable");
  var tbody = table.getElementsByTagName("tbody")[0];
  var rows = tbody.getElementsByTagName("tr");
  var data = [];

  for (var i = 0; i < rows.length; i++) {
    var cells = rows[i].getElementsByTagName("td");
    console.log(cells);
    var rowData = {
      "track": cells[0].getElementsByTagName("select")[0].value.trim(),
      "name": cells[1].getElementsByTagName("input")[0].value.trim(),
      "channel": cells[2].getElementsByTagName("select")[0].value.trim(),
      "Nbpm": cells[3].getElementsByTagName("input")[0].value.trim(),
      "Noffset": cells[4].getElementsByTagName("input")[0].value.trim(),
      "Fbpm": cells[5].getElementsByTagName("input")[0].value.trim(),
      "Foffset": cells[6].getElementsByTagName("input")[0].value.trim(),
      "credits": cells[7].getElementsByTagName("input")[0].value.trim(),
      "author": cells[8].getElementsByTagName("input")[0].value.trim()
    };
    data.push(rowData);
  }

  return data;
}


function save() {
  let data = readTableData();
  let invalids = [];
  let count = 1;
  let $os = $("#outputSection")
  $os.html("");
  let iniString =
    "#-------------------------------------------------------------------------------------------------------------------#\n" +
    "# This is the custom music configuration file, you can find more info here: https://ctgp7.page.link/MusicSlotConfig #\n" +
    "#-------------------------------------------------------------------------------------------------------------------#\n" +
    "# Generated by MusicSlots tool on " + new Date().toLocaleString() + "\n\n";

  for (let i in data) {
    let line = `${data[i].track} :: ${data[i].name} :: ${data[i].channel} :: ${data[i].Nbpm} :: ${data[i].Noffset} :: ${data[i].Fbpm} :: ${data[i].Foffset}`;
    if (data[i].credits) {
      line = `${line} :: ${data[i].credits} :: ${data[i].author}`;
    }

    if (!line.match(/[a-zA-Z0-9_]+? :: [a-zA-Z0-9_-]+? :: (?:SINGLE|MULTI_WATER|MULTI_AREA) :: [0-9]+? :: [0-9]+? :: [0-9]+? :: [0-9]+? :: .+? :: .+/) && !line.match(/[a-zA-Z0-9_]+? :: [a-zA-Z0-9_-]+? :: (?:SINGLE|MULTI_WATER|MULTI_AREA) :: [0-9]+? :: [0-9]+? :: [0-9]+? :: [0-9]+/)) {
      invalids.push(count);
    }

    iniString = `${iniString}${line}\n`;
    count += 1;
  }
  if (invalids.length === 0) {
    download("musicSlotsUser.ini", iniString);
  } else {
    if (invalids.length === 1) {
      $os.html(`<h3>Line ${invalids[0]} has an invalid value !</h3>`);
    } else {
      let lastInvalid = invalids.pop();
      $os.html(`<h3>Lines ${invalids.join(', ')} and ${lastInvalid} have an invalid value!</h3>`);
    }
  }
}

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function closePreview() {
  $("#blockingScreen").toggle();
  $("#previewBox").toggle();
}

function infoToggle() {
  $("#infoBox").toggle();
  $("#blockingScreen").toggle();
  $("#blockingScreen").attr("onclick", "infoToggle()");
  $("#hint").html("Click anywhere outside the box to close...");
}
