// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkmM4hueT7PlnvV8FeRdp8g4rk0qQQrn4",
  authDomain: "midnightmathscape.firebaseapp.com",
  databaseURL: "https://midnightmathscape-default-rtdb.firebaseio.com",
  projectId: "midnightmathscape",
  storageBucket: "midnightmathscape.firebasestorage.app",
  messagingSenderId: "1038485290511",
  appId: "1:1038485290511:web:c8aa78fbcd5266b706ed7a",
  measurementId: "G-WXGW44QMRD"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Clear error messages
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
}

// Login form handling
if (document.getElementById('loginFormElement')) {
    const loginForm = document.getElementById('loginFormElement');
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        let isValid = true;

        if (!validateEmail(email)) {
            document.getElementById('loginEmailError').textContent = 'Please enter a valid email';
            isValid = false;
        }

        if (!validatePassword(password)) {
            document.getElementById('loginPasswordError').textContent = 'Password must be at least 6 characters';
            isValid = false;
        }

        if (isValid) {
            auth.signInWithEmailAndPassword(email, password)
                .then(() => {
                    window.location.href = 'studentList.html';
                })
                .catch((error) => {
                    const errorCode = error.code;
                    
                    if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
                        document.getElementById('loginPasswordError').textContent = 'Invalid email or password';
                    } else {
                        document.getElementById('loginPasswordError').textContent = error.message;
                    }
                });
        }
    });
}

// Signup form handling
if (document.getElementById('signupFormElement')) {
    const signupForm = document.getElementById('signupFormElement');
    
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();
        
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        let isValid = true;

        if (!validateEmail(email)) {
            document.getElementById('signupEmailError').textContent = 'Please enter a valid email';
            isValid = false;
        }

        if (!validatePassword(password)) {
            document.getElementById('signupPasswordError').textContent = 'Password must be at least 6 characters';
            isValid = false;
        }

        if (password !== confirmPassword) {
            document.getElementById('signupConfirmPasswordError').textContent = 'Passwords do not match';
            isValid = false;
        }

        if (isValid) {
            auth.createUserWithEmailAndPassword(email, password)
                .then(() => {
                    window.location.href = 'studentList.html';
                })
                .catch((error) => {
                    const errorCode = error.code;
                    
                    if (errorCode === 'auth/email-already-in-use') {
                        document.getElementById('signupEmailError').textContent = 'Email already in use';
                    } else {
                        document.getElementById('signupEmailError').textContent = error.message;
                    }
                });
        }
    });
}

// Check auth state
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        // Optional: Redirect if user is already logged in
        // window.location.href = 'studentList.html';
    }
});

