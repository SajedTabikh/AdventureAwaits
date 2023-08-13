import '@babel/polyfill';
import { login, logout } from './login';
import { signup, forgotPassword } from './signup';
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

  if (formElement) {
    formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      document.querySelector('.btnn-primary').textContent = 'Create Account';
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;
      document.querySelector('.btnn-primary').textContent = 'Creating...';
      document.querySelector('.btnn-primary').textContent = 'Create Account';

      signup(name, email, password, passwordConfirm);
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const formElement = document.querySelector('.form--forgotPasword');

  if (formElement) {
    formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('forgotPassword').value;
      forgotPassword(email);
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
