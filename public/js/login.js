import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
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

    const errorMessage = error.response.data.message;

    if (errorMessage.includes('Please verify your OTP account before logging in')) {
      showAlert('success', errorMessage);
      window.setTimeout(() => {
        location.assign('/Validate');
      }, 2500);
    } else {
      showAlert('error', errorMessage);
    }
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
    console.log('error: ', error);
    showAlert('error', 'Error logging out, try again');
  }
};

export const validateOTP = async (email, token) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/validate',
      data: {
        email,
        token,
      },
    });

    if (res.data.status === 'success') {
      showAlert('success', 'OTP validated successfully');
      window.setTimeout(() => {
        location.assign('/All-Tours');
      }, 1500);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};

// export const VerifyOTP = async (otp) => {
//   try {
//     const response = await fetch('/api/v1/users/verify', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(otp),
//     });

//     if (response.data.status === 'success') {
//       showAlert('success', 'OTP Verified successfully');
//       window.setTimeout(() => {
//         location.assign('/login');
//       }, 1500);
//     }
//   } catch (error) {
//     showAlert('error', error.response.data.message);
//   }
// };
