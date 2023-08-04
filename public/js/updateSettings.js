import axios from 'axios';
import { showAlert } from './alerts';

// Add a function to validate email format
const isEmailValid = function (email) {
  const emailRegex =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|net|org|edu|gov|mil|info|biz|co|us|io|me|tv|uk|ca|au|de|fr|in|it|jp|nl|nz|ru|ch|es|se|za)$/i;
  return emailRegex.test(email);
};

//Type is either password or data
export const updateSettings = async (data, type) => {
  try {
    const url = type === 'password' ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe';

    // Check if the type is 'data' (updating email) before validating the email format
    if (type === 'data' && !isEmailValid(data.get('email'))) {
      showAlert('error', 'Please provide a valid email address');
      return;
    }

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success') {
      if (type === 'data' && data.get('photo')) {
        showAlert('success', `${type.toUpperCase()} Updated Successfully`);
        // Reload the page after a short delay (e.g., 1 second) to see the updated photo
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    }
    if (res.data.status === 'success' && type === 'password') {
      showAlert('success', `${type.toUpperCase()} Updated Successfully`);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
