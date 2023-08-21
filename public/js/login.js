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
    } else if (res.status === 402) {
      window.setTimeout(() => {
        location.assign('/Validate');
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

// export const validateOTP = async (otpDigits) => {
//   try {
//     const res = await axios.post('/validate', {
//       otp_digits: otpDigits, // Pass the OTP digits entered by the user
//     });

//     if (res.data.otp_valid) {
//       showAlert('success', 'OTP is valid!');
//       window.setTimeout(() => {
//         location.assign('/All-Tours'); // Redirect to the desired page after successful OTP validation
//       }, 2000);
//     }
//   } catch (error) {
//     console.log(error);
//     showAlert('error', 'Invalid OTP. Please try again.');
//   }
// };

// // Add event listener to the "Verify" button
// document.addEventListener('DOMContentLoaded', () => {
//   const verifyBtn = document.querySelector('.validate--form');

//   if (verifyBtn) {
//     verifyBtn.addEventListener('click', (e) => {
//       e.preventDefault();
//       const otpDigits = Array.from(document.querySelectorAll('.input-fields input'))
//         .map((input) => input.value)
//         .join('');

//       if (otpDigits.length === 6) {
//         validateOTP(otpDigits);
//       } else {
//         showAlert('error', 'Please enter a valid 6-digit OTP.');
//       }
//     });
//   }
// });
