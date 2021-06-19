// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
  try {
    let res = await axios.get("http://jservice.io/api/categories", {
      params: { count: 100, offset: Math.floor(Math.random() * 7220) },
    });
    return _.sampleSize(res.data, 6);
  } catch (err) {
    alert("Something went wrong!");
    throw new Error(err);
  }
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
  try {
    let res = await axios.get("http://jservice.io/api/category", {
      params: { id: catId },
    });
    if (res.data.clues_count > 5) {
      return { title: res.data.title, clues: _.sampleSize(res.data.clues, 5) };
    }
    return { title: res.data.title, clues: res.data.clues };
  } catch (err) {
    alert("Something went wrong!");
    throw new Error(err);
  }
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

function fillTable(categories) {
  const $gameboard = $("#gameboard");
  const $thead = $("<thead></thead>");
  const $theadRow = $("<tr></tr>");
  const $tbody = $("<tbody></tbody>");

  categories.forEach((category, idx) => {
    $theadRow.append(buildCategorySquare(category));
    if (idx < 5) $tbody.append(buildClueSquares(categories, idx));
  });

  $thead.append($theadRow);
  $gameboard.append($thead);
  $gameboard.append($tbody);
}

function buildCategorySquare(category) {
  return $(`<th>${category.title.toUpperCase()}</th>`);
}

function buildClueSquares(categories, idx) {
  let $tbodyRow = $("<tr></tr>");

  let clues = categories.map((category) => category.clues[idx]);

  clues.forEach((clue) => {
    let $clueSquare = $(`
        <td class="game-square">
          <span class="showing">
            <i class="fa fa-question-circle-o" aria-hidden="true"></i>
          </span>
          <span class="question hidden">${clue.question.toUpperCase()}</span>
          <span class="answer hidden">${clue.answer.toUpperCase()}</span>
        </td>
      `);
    $tbodyRow.append($clueSquare);
  });

  return $tbodyRow;
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
  if (evt.currentTarget.firstElementChild.classList.contains("showing")) {
    evt.currentTarget.firstElementChild.className = "hidden";
    evt.currentTarget.firstElementChild.nextElementSibling.className =
      "showing";
  } else if (
    evt.currentTarget.firstElementChild.nextElementSibling.classList.contains(
      "showing"
    )
  ) {
    evt.currentTarget.classList.add("answered");
    evt.currentTarget.lastElementChild.className = "showing";
    evt.currentTarget.firstElementChild.nextElementSibling.className = "hidden";
  }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
  $("#gameboard").html("");
  $("#new-game-btn").text("LOADING...");
  $("#loading-gif").removeClass("hidden");
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
  $("#new-game-btn").text("START GAME");
  $("#loading-gif").addClass("hidden");
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
  showLoadingView();
  const categoryIds = await getCategoryIds();

  const categoriesPromises = categoryIds.map(async (categoryId) => {
    return await getCategory(categoryId.id);
  });
  const categories = await Promise.all(categoriesPromises);

  setTimeout(() => {
    fillTable(categories);
    hideLoadingView();
  }, 1500);
}

/** On click of start / restart button, set up game. */

$("#new-game-btn").click(setupAndStart);

/** On page load, add event handler for clicking clues */

$("#gameboard").on("click", ".game-square", { event }, handleClick);
