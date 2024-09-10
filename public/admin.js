// Fetch and display questions
function fetchQuestions() {
    fetch('/api/questions')
        .then(response => response.json())
        .then(questions => {
            const questionList = document.getElementById('question-list');
            questionList.innerHTML = '<h3>Existing Questions:</h3>';
            questions.forEach(question => {
                const questionDiv = document.createElement('div');
                questionDiv.innerHTML = `
                    <p><strong>${question.question}</strong></p>
                    <ul>
                        ${question.options.map((option, index) => `<li>${option}${index === question.correct_answer ? ' (Correct)' : ''}</li>`).join('')}
                    </ul>
                    <button onclick="editQuestion(${question.id})">Edit</button>
                    <button onclick="deleteQuestion(${question.id})">Delete</button>
                `;
                questionList.appendChild(questionDiv);
            });
        })
        .catch(error => console.error('Error fetching questions:', error));
}

// Fetch and display quiz statistics
function fetchQuizStats() {
    fetch('/api/quiz-stats')
        .then(response => response.json())
        .then(stats => {
            const quizStats = document.getElementById('quiz-stats');
            quizStats.innerHTML = `
                <p>Total Quizzes Taken: ${stats.totalQuizzes}</p>
                <p>Average Score: ${stats.averageScore.toFixed(2)}%</p>
            `;
        })
        .catch(error => console.error('Error fetching quiz stats:', error));
}

// Add new question
document.getElementById('add-question-btn').addEventListener('click', () => {
    showQuestionForm();
});

// Edit question
function editQuestion(questionId) {
    fetch(`/api/questions/${questionId}`)
        .then(response => response.json())
        .then(question => {
            showQuestionForm(question);
        })
        .catch(error => console.error('Error fetching question:', error));
}

// Delete question
function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        fetch(`/api/questions/${questionId}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    fetchQuestions();
                } else {
                    console.error('Error deleting question');
                }
            })
            .catch(error => console.error('Error deleting question:', error));
    }
}

// Show question form
function showQuestionForm(question = null) {
    const formContainer = document.createElement('div');
    formContainer.innerHTML = `
        <h3>${question ? 'Edit' : 'Add'} Question</h3>
        <form id="question-form">
            <input type="hidden" id="question-id" value="${question ? question.id : ''}">
            <label for="question-text">Question:</label>
            <input type="text" id="question-text" value="${question ? question.question : ''}" required>
            <label for="option1">Option 1:</label>
            <input type="text" id="option1" value="${question ? question.options[0] : ''}" required>
            <label for="option2">Option 2:</label>
            <input type="text" id="option2" value="${question ? question.options[1] : ''}" required>
            <label for="option3">Option 3:</label>
            <input type="text" id="option3" value="${question ? question.options[2] : ''}">
            <label for="option4">Option 4:</label>
            <input type="text" id="option4" value="${question ? question.options[3] : ''}">
            <label for="correct-answer">Correct Answer:</label>
            <select id="correct-answer" required>
                <option value="0" ${question && question.correct_answer === 0 ? 'selected' : ''}>Option 1</option>
                <option value="1" ${question && question.correct_answer === 1 ? 'selected' : ''}>Option 2</option>
                <option value="2" ${question && question.correct_answer === 2 ? 'selected' : ''}>Option 3</option>
                <option value="3" ${question && question.correct_answer === 3 ? 'selected' : ''}>Option 4</option>
            </select>
            <button type="submit">${question ? 'Update' : 'Add'} Question</button>
        </form>
    `;
    document.getElementById('admin-container').appendChild(formContainer);

    document.getElementById('question-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const questionId = document.getElementById('question-id').value;
        const questionData = {
            question: document.getElementById('question-text').value,
            options: [
                document.getElementById('option1').value,
                document.getElementById('option2').value,
                document.getElementById('option3').value,
                document.getElementById('option4').value
            ].filter(option => option !== ''),
            correct_answer: parseInt(document.getElementById('correct-answer').value)
        };

        if (questionId) {
            // Update existing question
            fetch(`/api/questions/${questionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            })
            .then(response => {
                if (response.ok) {
                    fetchQuestions();
                    formContainer.remove();
                } else {
                    console.error('Error updating question');
                }
            })
            .catch(error => console.error('Error updating question:', error));
        } else {
            // Add new question
            fetch('/api/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questionData)
            })
            .then(response => {
                if (response.ok) {
                    fetchQuestions();
                    formContainer.remove();
                } else {
                    console.error('Error adding question');
                }
            })
            .catch(error => console.error('Error adding question:', error));
        }
    });
}

// Update secret key
function updateSecretKey() {
    const newSecretKey = prompt('Enter new secret key:');
    if (newSecretKey) {
        fetch('/api/update-secret-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newSecretKey }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
        })
        .catch(error => {
            console.error('Error updating secret key:', error);
            alert('An error occurred while updating the secret key.');
        });
    }
}

// Initial load
fetchQuestions();
fetchQuizStats();
