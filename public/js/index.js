import '@babel/polyfill';
import { login, logout, validateOTP, VerifyOTP } from './login';
import { signup, forgotPassword, resetPassword } from './signup';
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
  const validateBtn = document.getElementById('validateBtn');

  // Check if the form element exists before adding the event listener
  if (validateBtn) {
    validateBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const token = document.getElementById('otp').value;
      await validateOTP(email, token);
    });
  }
});
// Add this JavaScript code to verify-otp.js
document.addEventListener('DOMContentLoaded', async () => {
  const verifyButton = document.getElementById('verify');
  const otpInput = document.getElementById('otp');

  // Check user's 2FA status
  try {
    const statusResponse = await fetch('/api/v1/users/check-2fa-status');
    const statusData = await statusResponse.json();

    if (statusData.status === 'enabled') {
      // 2FA is already enabled, change the button text and action
      verifyButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const otp = otpInput.value;

        try {
          const response = await fetch('/api/v1/users/disable', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: otp }),
          });

          const data = await response.json();
          if (data.status === 'success') {
            // 2FA disable successful
            showAlert('success', '2FA disabled successfully');
            window.setTimeout(() => {
              location.assign('/login');
            }, 2000);
            // Perform any necessary UI updates
          } else {
            showAlert('error', 'Failed to disable 2FA');
          }
        } catch (error) {
          showAlert('error', 'Error disabling 2FA. Please try again.');
        }
      });
    } else {
      // 2FA is not enabled, keep the button functionality for enabling 2FA
      verifyButton.addEventListener('click', async (event) => {
        event.preventDefault();

        const otp = otpInput.value;

        try {
          const response = await fetch('/api/v1/users/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: otp }),
          });

          const data = await response.json();

          if (data.status === 'success') {
            // OTP verification successful, enable 2FA
            showAlert('success', 'OTP verification successful');
            window.setTimeout(() => {
              location.assign('/login');
            }, 2000);
            // Perform any necessary UI updates
          } else {
            showAlert('error', 'OTP verification failed');
          }
        } catch (error) {
          showAlert('error', 'Error verifying OTP. Please try again.');
        }
      });
    }
  } catch (error) {
    console.error('Error fetching 2FA status:', error);
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

const saveButton = document.querySelector('.btn--green');

if (userDataForm && saveButton) {
  userDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable the save button and change its text to "Saving..."
    saveButton.textContent = 'Saving...';
    saveButton.disabled = true;

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
