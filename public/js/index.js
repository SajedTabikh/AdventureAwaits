import '@babel/polyfill';
import { login, logout } from './login';
import { signup, forgotPassword, resetPassword, verification } from './signup';
import { displayMAp } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import { showAlert } from './alerts';

//DOM ELEMENTS
const mapbox = document.getElementById('map');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

//DELEGATION
if (mapbox) {
  const locations = JSON.parse(mapbox.dataset.locations);
  displayMAp(locations);
}

document.addEventListener('DOMContentLoaded', () => {
  // Find the form element with the class 'form'
  const formElement = document.querySelector('.form--login');

  // Check if the form element exists before adding the event listener
  if (formElement) {
    formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      login(email, password);
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const formElement = document.querySelector('.form--signup');
  const submitButton = document.querySelector('.btnn-primary');

  if (formElement) {
    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Change button text to "Creating..."
      submitButton.textContent = 'Creating...';
      submitButton.disabled = true; // Disable the button to prevent multiple submissions

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;

      try {
        await signup(name, email, password, passwordConfirm);

        // Signup successful
        submitButton.textContent = 'Create Account';
        submitButton.disabled = false; // Enable the button

        // You can redirect or display a success message here
      } catch (error) {
        // Signup failed
        submitButton.textContent = 'Create Account';
        submitButton.disabled = false; // Enable the button

        // Handle the error (e.g., display an error message)
        console.error('Error:', error);
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const formElement = document.querySelector('.form--forgotPasword');
  const messageElement = document.querySelector('.message');

  if (formElement) {
    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotPassword').value;
      const submitButton = document.querySelector('.btn');

      submitButton.textContent = 'Sending...';

      try {
        const emailSent = await forgotPassword(email);

        if (emailSent) {
          submitButton.textContent = 'Done';
          formElement.classList.add('hide');
          messageElement.textContent =
            'Password reset email sent to your inbox. Please check your email.';
          messageElement.classList.add('success');
        } else {
          submitButton.textContent = 'Send';
        }
      } catch (error) {
        console.error('An error occurred:', error);
        submitButton.textContent = 'Send';

        // Display the error message on the page
        messageElement.textContent = 'An error occurred. Please try again.';
        messageElement.classList.add('error');
      }
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const formElement = document.querySelector('.form--resetPasword');

  if (formElement) {
    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('resetPassword').value;
      const passwordConfirm = document.getElementById('resetPasswordConfirm').value;
      const token = window.location.pathname.split('/').pop(); // Extract token from URL
      resetPassword(password, passwordConfirm, token); // Pass the token to your resetPassword function
    });
  }
});

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });
}

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');

    document.querySelector('.btn--save-password').textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 20);
