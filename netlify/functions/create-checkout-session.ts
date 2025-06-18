import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { planId, email, successUrl, cancelUrl } = JSON.parse(event.body || '{}');

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'Stripe not configured',
          message: 'Please configure STRIPE_SECRET_KEY environment variable',
          setupUrl: 'https://bolt.new/setup/stripe'
        })
      };
    }

    // Initialize Stripe (you'll need to install stripe package)
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    // For now, return a mock response since Stripe isn't configured
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Stripe integration required',
        setupInstructions: {
          step1: 'Install Stripe: npm install stripe',
          step2: 'Configure STRIPE_SECRET_KEY in environment variables',
          step3: 'Create products and prices in Stripe Dashboard',
          step4: 'Update this function to create checkout sessions'
        },
        mockCheckoutUrl: 'https://checkout.stripe.com/mock-session',
        planId,
        email
      })
    };

    // Uncomment and modify this when Stripe is properly configured:
    /*
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: getPriceId(planId), // You'll need to map planId to Stripe price IDs
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        planId,
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ url: session.url })
    };
    */

  } catch (error) {
    console.error('Checkout session creation error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Helper function to map plan IDs to Stripe price IDs
function getPriceId(planId: string): string {
  const priceMap: Record<string, string> = {
    'pro': process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    'enterprise': process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly'
  };
  
  return priceMap[planId] || '';
}