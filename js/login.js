// login.js

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.message a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('form').forEach(form => {
                form.classList.toggle('hidden');
            });
        });
    });
});

let correctAnswer;

function showCaptchaModal() {
    // Uncheck the checkbox and disable the login button initially
    const captchaCheckbox = document.getElementById('captcha-checkbox');
    captchaCheckbox.checked = false;
    document.getElementById('login-button').disabled = true;

    // Generate a random math problem
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    correctAnswer = num1 + num2;
    document.getElementById('math-problem').innerText = `What is ${num1} + ${num2}?`;

    // Display the modal
    document.getElementById('captcha-modal').style.display = 'block';
}

function closeCaptchaModal() {
    document.getElementById('captcha-modal').style.display = 'none';
}

function verifyCaptcha() {
    const userAnswer = parseInt(document.getElementById('captcha-answer').value, 10);
    if (userAnswer === correctAnswer) {
        alert('CAPTCHA verified successfully!');
        document.getElementById('captcha-checkbox').checked = true;
        document.getElementById('login-button').disabled = false;
        closeCaptchaModal();
    } else {
        alert('Incorrect answer. Please try again.');
        document.getElementById('captcha-answer').value = '';
        showCaptchaModal();
    }
}

function loginUser(event) {
    event.preventDefault();

    // Ensure CAPTCHA is verified
    if (!document.getElementById('captcha-checkbox').checked) {
        alert('Please verify the CAPTCHA.');
        return;
    }

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Hardcoded credentials
    const hardcodedEmail = 'admin@email.com';
    const hardcodedPasswordHash = '6c7ca345f63f835cb353ff15bd6c5e052ec08e7a';

    // Hash the entered password
    const hashedPassword = sha1(password);

    if (email === hardcodedEmail && hashedPassword === hardcodedPasswordHash) {
        alert('Login successful!');
        window.location.href = 'index.html';
    } else {
        alert('Invalid email or password.');
    }
}

// Close the modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('captcha-modal');
    if (event.target === modal) {
        closeCaptchaModal();
    }
}
