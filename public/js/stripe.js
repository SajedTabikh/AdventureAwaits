import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51NYraOCOSwPnLX5e0Q30hphsr7tfGIxrK9GwYiCeQQvI8kuQUuw070WVCVQxSLXxtYsPhnK9CnIlGl95uVOafEHP00np144YWX'
);

export const bookTour = async (tourId) => {
  try {
    //1)  Get chekout session from APi (endpoint)

    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    //2) Create checkout form + charge the credit card

    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
