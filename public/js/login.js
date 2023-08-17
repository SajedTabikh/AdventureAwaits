import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login ',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      console.log(res.data.status);
      showAlert('success', 'Logged in Successfully', 7);
      window.setTimeout(() => {
        location.assign('/All-Tours');
      }, 2000);
    }
  } catch (error) {
    console.log(error);

    showAlert('error', error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged out Successfully');
      window.setTimeout(() => {
        location.assign('/login');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', 'Error logging out, try again');
  }
};
