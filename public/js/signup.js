import axios from 'axios';
import { showAlert } from './alerts';

const isEmailValid = function (email) {
  const emailRegex =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|net|org|edu|gov|mil|info|biz|co|us|io|me|tv|uk|ca|au|de|fr|in|it|jp|nl|nz|ru|ch|es|se|za)$/i;
  return emailRegex.test(email);
};

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    if (!isEmailValid(email)) {
      showAlert('error', 'Invalid email address!');
      return;
    }

    if (password !== passwordConfirm) {
      showAlert('error', 'Passwords do not match!');
      return;
    }

    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Signup Successful. Please login with your credentials.');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }
  } catch (error) {
    const errorMessage =
      error.response.data.message || 'Something went wrong signing up, please try again!';
    showAlert('error', errorMessage);
  }
};

export const forgotPassword = async (email) => {
  try {
    if (!isEmailValid(email)) {
      showAlert('error', 'Invalid email address!!!');
      return;
    }

    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgotPassword',
      data: {
        email,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Please check your inbox!!!');
    }
  } catch (error) {
    const errorMessage = error.response.data.message || 'Something went wrong, please try again!';
    showAlert('error', errorMessage);
  }
};
export const resetPassword = async (password, passwordConfirm, token) => {
  try {
    if (password !== passwordConfirm) {
      showAlert('error', 'Passwords do not match!');
      return;
    }
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/resetPassword/${token}`,
      data: {
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Password Reset Successfully');
    }
  } catch (error) {
    const errorMessage = error.response.data.message || 'Something went wrong, please try again!';
    showAlert('error', errorMessage);
  }
};
