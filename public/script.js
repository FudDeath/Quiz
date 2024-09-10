let quizData = [];
let currentQuestion = 0;
let score = 0;

const questionContainer = document.getElementById("question-container");
const optionsContainer = document.getElementById("options-container");
const submitBtn = document.getElementById("submit-btn");
const quizContainer = document.getElementById("quiz-container");
const resultContainer = document.getElementById("result-container");
const scoreElement = document.getElementById("score");
const secretKeyForm = document.getElementById("secret-key-form");
const getSecretKeyBtn = document.getElementById("get-secret-key-btn");
const secretKeyResult = document.getElementById("secret-key-result");

function fetchQuestions() {
    fetch("/api/questions")
        .then((response) => response.json())
        .then((data) => {
            quizData = data;
            if (quizData.length > 0) {
                loadQuestion();
            } else {
                questionContainer.textContent = "No questions available.";
            }
        })
        .catch((error) => {
            console.error("Error fetching questions:", error);
            questionContainer.textContent =
                "Error loading questions. Please try again later.";
        });
}

function loadQuestion() {
    if (currentQuestion >= quizData.length) {
        showResult();
        return;
    }

    const question = quizData[currentQuestion];
    questionContainer.textContent = question.question;

    optionsContainer.innerHTML = "";
    question.options.forEach((option, index) => {
        const label = document.createElement("label");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "answer";
        radio.value = index;
        radio.addEventListener("change", () => selectOption(index));

        const circle = document.createElement("span");
        circle.className = "circle";

        label.appendChild(radio);
        label.appendChild(circle);
        label.appendChild(document.createTextNode(option));

        optionsContainer.appendChild(label);
    });

    submitBtn.style.display = "inline-block";
}

function selectOption(index) {
    const options = optionsContainer.getElementsByTagName("label");
    for (let i = 0; i < options.length; i++) {
        options[i].classList.remove("selected");
    }
    options[index].classList.add("selected");
}

function submitAnswer() {
    const selectedOption = optionsContainer.querySelector(
        'input[name="answer"]:checked',
    );
    if (!selectedOption) return;

    const answer = parseInt(selectedOption.value);
    if (answer === quizData[currentQuestion].correct_answer) {
        score++;
    }

    currentQuestion++;
    loadQuestion();
}

function showResult() {
    quizContainer.style.display = "none";
    resultContainer.style.display = "block";
    const percentage = (score / quizData.length) * 100;
    scoreElement.textContent = percentage.toFixed(2);

    // Store user result
    const userId = generateUserId();
    storeUserResult(userId, score);

    const secretKeyForm = document.getElementById("secret-key-form");
    const getSecretKeyBtn = document.getElementById("get-secret-key-btn");
    const startOverContainer = document.getElementById("start-over-container");

    // Clear any existing content in the start over container
    startOverContainer.innerHTML = "";

    if (percentage >= 79.99) {
        // Using 79.99 to account for potential floating point imprecision
        secretKeyForm.style.display = "block";
        getSecretKeyBtn.style.display = "inline-block";
    } else {
        secretKeyForm.style.display = "none";
        getSecretKeyBtn.style.display = "none";

        const startOverBtn = document.createElement("button");
        startOverBtn.textContent = "Start Over";
        startOverBtn.addEventListener("click", startOver);
        startOverContainer.appendChild(startOverBtn);
    }

    console.log("Score percentage:", percentage);
    console.log("Secret key form display:", secretKeyForm.style.display);
    console.log(
        "Get Secret Key button display:",
        getSecretKeyBtn.style.display,
    );
    console.log(
        "Start Over button exists:",
        !!startOverContainer.querySelector("button"),
    );
}

function startOver() {
    currentQuestion = 0;
    score = 0;
    quizContainer.style.display = "block";
    resultContainer.style.display = "none";
    resultContainer.querySelector("button")?.remove();
    fetchQuestions();
}

function requestSecretKey() {
    console.log("Requesting secret key...");
    fetch("/api/secret-key", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Secret key received:", data.secretKey);
            secretKeyResult.textContent = `Your secret key is: ${data.secretKey}`;
        })
        .catch((error) => {
            console.error("Error:", error);
            secretKeyResult.textContent =
                "An error occurred while retrieving the secret key.";
        });
}

function generateUserId() {
    return "user_" + Math.random().toString(36).substr(2, 9);
}

function storeUserResult(userId, score) {
    fetch("/api/store-result", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, score }),
    })
        .then((response) => response.json())
        .then((data) => {
            console.log("Result stored:", data);
        })
        .catch((error) => {
            console.error("Error storing result:", error);
        });
}

submitBtn.addEventListener("click", submitAnswer);
getSecretKeyBtn.addEventListener("click", requestSecretKey);

// Start the quiz by fetching questions
fetchQuestions();
